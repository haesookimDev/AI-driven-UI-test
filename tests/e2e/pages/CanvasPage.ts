import { Page, Locator } from '@playwright/test';
import { selfHealingLocator } from '../../ai/core/self-healing';
import { aiClient } from '../../ai/core/ai-client';

export class CanvasPage {
  readonly page: Page;

  // 주요 영역
  readonly canvas: Locator;
  readonly sideMenu: Locator;
  readonly header: Locator;
  readonly detailPanel: Locator;
  readonly executionPanel: Locator;

  // 노드 추가 팝업 (더블클릭 시 나타남)
  readonly addNodePopup: Locator;
  readonly nodeSearchInput: Locator;

  // 헤더 메뉴 버튼들 (분석 결과 기반)
  readonly headerMenuButtons: Locator;

  // 헤더 버튼
  readonly saveButton: Locator;
  readonly loadButton: Locator;
  readonly executeButton: Locator;

  // 메뉴 탭 캐시 (AI 발견 결과)
  private menuTabsCache: Map<string, string> = new Map();

  constructor(page: Page) {
    this.page = page;

    // ✅ 실제 XGEN Canvas 구조에 맞게 수정
    // CSS Module 클래스명이 해시를 포함하므로 부분 일치 사용
    this.canvas = page.locator('[class*="canvasContainer"]').first();
    this.sideMenu = page.locator('[class*="menu"]').first();
    this.header = page.locator('header').first();
    this.detailPanel = page.locator('[class*="detailPanel"]').first();
    this.executionPanel = page.locator('[class*="executionPanel"]').first();

    // ✅ 노드 추가 팝업 (더블클릭 시 나타남) - 분석 결과 기반
    this.addNodePopup = page.locator('[class*="Popup"], [class*="popup"]').first();
    this.nodeSearchInput = page.locator('input[placeholder*="Search nodes"], input[placeholder*="노드 검색"]');

    // ✅ 헤더 메뉴 버튼 (분석 결과: header 내부 버튼들이 메뉴)
    this.headerMenuButtons = page.locator('header button');

    // ✅ 실제 버튼 텍스트에 맞게 수정
    this.saveButton = page.locator('button:has-text("Save")');
    this.loadButton = page.locator('button:has-text("로드")');
    this.executeButton = page.locator('button:has-text("Run")');
  }

  async goto() {
    await this.page.goto('/canvas');
    // ✅ Canvas 컨테이너 로드 대기
    await this.canvas.waitFor({ timeout: 10000 }).catch(() => {
      console.warn('Canvas container not found');
    });
    // 페이지가 완전히 로드될 때까지 대기
    await this.page.waitForLoadState('networkidle').catch(() => {
      console.warn('Page did not reach networkidle state');
    });
  }

  // ============================================
  // 메뉴 탭 관련 메서드 (AI 기반 발견)
  // ============================================

  /**
   * AI를 사용하여 메뉴 탭 정보 발견
   * ✅ 분석 결과: 헤더 버튼들은 title 속성으로 식별됨
   */
  async discoverMenuTabs(): Promise<Array<{ index: number; title: string; text: string }>> {
    const menuTabs: Array<{ index: number; title: string; text: string }> = [];
    const buttonCount = await this.headerMenuButtons.count();

    console.log(`🔍 메뉴 탭 발견 시작 (총 ${buttonCount}개 버튼)`);

    for (let i = 0; i < buttonCount; i++) {
      const btn = this.headerMenuButtons.nth(i);
      const title = await btn.getAttribute('title') || '';
      const text = (await btn.textContent())?.trim() || '';
      const ariaLabel = await btn.getAttribute('aria-label') || '';

      const identifier = title || text || ariaLabel || `button-${i}`;
      menuTabs.push({ index: i, title: identifier, text });

      // 캐시에 저장
      this.menuTabsCache.set(identifier.toLowerCase(), `header button >> nth=${i}`);

      console.log(`  메뉴 ${i + 1}: title="${title}", text="${text}"`);
    }

    return menuTabs;
  }

  /**
   * AI를 사용하여 메뉴 버튼 셀렉터 찾기
   */
  async findMenuSelectorWithAI(menuName: string): Promise<string | null> {
    // 캐시 확인
    const cached = this.menuTabsCache.get(menuName.toLowerCase());
    if (cached) {
      return cached;
    }

    if (!aiClient.isAvailable()) {
      console.warn('⚠️ AI 클라이언트 사용 불가');
      return null;
    }

    try {
      const prompt = `주어진 메뉴 이름에 대한 Playwright 셀렉터를 생성하세요.
메뉴 이름: "${menuName}"

헤더 메뉴 버튼 구조 (분석 결과):
- 버튼들은 title 속성으로 식별됨
- 예시 title 값들:
  - "뒤로가기" (Back)
  - "Edit workflow name"
  - "자동 워크플로우 생성" (Auto workflow)
  - "New Workflow"
  - "Save Workflow"
  - "워크플로우 복사" (Copy workflow)
  - "작업 히스토리" (Task history)

가장 적합한 셀렉터 하나만 반환하세요 (따옴표 없이):
예: button[title="Save Workflow"]`;

      const response = await aiClient.generateText(prompt);
      const selector = response.trim().replace(/^["']|["']$/g, '');

      // 캐시에 저장
      this.menuTabsCache.set(menuName.toLowerCase(), selector);

      return selector;
    } catch (error) {
      console.warn('⚠️ AI 셀렉터 생성 실패:', error);
      return null;
    }
  }

  /**
   * 메뉴 버튼 클릭 (title 속성으로 찾기)
   */
  async clickMenuByTitle(title: string) {
    // 1. 정확한 title 매칭 시도
    let button = this.page.locator(`header button[title="${title}"]`);

    if (await button.count() === 0) {
      // 2. 부분 매칭 시도
      button = this.page.locator(`header button[title*="${title}"]`);
    }

    if (await button.count() === 0) {
      // 3. AI 기반 셀렉터 시도
      const aiSelector = await this.findMenuSelectorWithAI(title);
      if (aiSelector) {
        button = this.page.locator(aiSelector);
      }
    }

    if (await button.count() === 0) {
      // 4. 텍스트 매칭 시도
      button = this.page.locator(`header button:has-text("${title}")`);
    }

    if (await button.count() > 0) {
      await button.first().click();
      await this.page.waitForTimeout(300);
      console.log(`✅ 메뉴 클릭: ${title}`);
      return true;
    }

    console.warn(`⚠️ 메뉴를 찾을 수 없음: ${title}`);
    return false;
  }

  /**
   * 메뉴 버튼 클릭 (인덱스로 찾기)
   */
  async clickMenuByIndex(index: number) {
    const button = this.headerMenuButtons.nth(index);

    if (await button.count() > 0) {
      await button.click();
      await this.page.waitForTimeout(300);
      console.log(`✅ 메뉴 클릭: index=${index}`);
      return true;
    }

    console.warn(`⚠️ 메뉴를 찾을 수 없음: index=${index}`);
    return false;
  }

  // ============================================
  // 명시적 메뉴 액션 메서드 (분석 결과 기반)
  // ============================================

  /**
   * 뒤로가기
   */
  async goBack() {
    return await this.clickMenuByTitle('뒤로가기');
  }

  /**
   * 워크플로우 이름 편집
   */
  async editWorkflowName() {
    return await this.clickMenuByTitle('Edit workflow name');
  }

  /**
   * 배포 테스트
   */
  async deployTest() {
    // 텍스트로 찾기 (배포 테스트 버튼은 텍스트가 있음)
    const button = this.page.locator('header button:has-text("배포 테스트")');
    if (await button.count() > 0) {
      await button.click();
      await this.page.waitForTimeout(300);
      console.log('✅ 배포 테스트 클릭');
      return true;
    }
    return false;
  }

  /**
   * 자동 워크플로우 생성
   */
  async autoGenerateWorkflow() {
    return await this.clickMenuByTitle('자동 워크플로우 생성');
  }

  /**
   * 새 워크플로우
   */
  async newWorkflow() {
    return await this.clickMenuByTitle('New Workflow');
  }

  /**
   * 워크플로우 저장 (메뉴 버튼)
   */
  async saveWorkflowMenu() {
    return await this.clickMenuByTitle('Save Workflow');
  }

  /**
   * 워크플로우 복사
   */
  async copyWorkflow() {
    return await this.clickMenuByTitle('워크플로우 복사');
  }

  /**
   * 작업 히스토리
   */
  async viewHistory() {
    return await this.clickMenuByTitle('작업 히스토리');
  }

  // ============================================
  // 노드 추가 관련 메서드
  // ============================================

  /**
   * 캔버스 더블클릭으로 노드 추가 팝업 열기
   * ✅ 분석 결과: 더블클릭 시 "Add Node" 팝업이 나타남
   */
  async openAddNodePopup() {
    const canvasBounds = await this.canvas.boundingBox();
    if (!canvasBounds) {
      throw new Error('Canvas not found');
    }

    // 캔버스 중앙 더블클릭
    await this.page.mouse.dblclick(
      canvasBounds.x + canvasBounds.width / 2,
      canvasBounds.y + canvasBounds.height / 2
    );
    await this.page.waitForTimeout(500);

    // 팝업이 나타날 때까지 대기
    await this.addNodePopup.waitFor({ timeout: 3000 }).catch(() => {
      console.warn('⚠️ 노드 추가 팝업을 찾을 수 없음');
    });

    console.log('✅ 캔버스 더블클릭 - 노드 추가 팝업 열림');
  }

  /**
   * 노드 검색 및 선택
   * ✅ 분석 결과: 팝업에 검색 입력창과 노드 목록이 있음
   */
  async searchAndSelectNode(nodeType: string) {
    // 검색 입력창에 노드 이름 입력
    if (await this.nodeSearchInput.count() > 0) {
      await this.nodeSearchInput.fill(nodeType);
      await this.page.waitForTimeout(300);
      console.log(`✅ 노드 검색: ${nodeType}`);
    }

    // 노드 목록에서 선택 (셀프힐링 사용)
    const nodeItem = await this.findNodeInPopup(nodeType);
    if (await nodeItem.count() > 0) {
      await nodeItem.click();
      await this.page.waitForTimeout(500);
      console.log(`✅ 노드 선택: ${nodeType}`);
      return true;
    }

    return false;
  }

  /**
   * AI 기반 노드 셀렉터 찾기
   * ✅ AI API를 사용하여 동적으로 셀렉터 생성
   */
  async findNodeSelectorWithAI(nodeType: string): Promise<string[]> {
    if (!aiClient.isAvailable()) {
      console.warn('⚠️ AI 클라이언트 사용 불가, 기본 셀렉터 사용');
      return this.getDefaultNodeSelectors(nodeType);
    }

    try {
      const prompt = `주어진 노드 타입에 대한 Playwright 셀렉터를 생성하세요.
노드 타입: "${nodeType}"

팝업 구조:
- 팝업 내부에 노드 목록이 있음
- 각 노드 항목은 노드 이름과 카테고리 경로를 포함
- 예: "Agent Xgen" (agents/xgen)

가능한 셀렉터 패턴 (우선순위 순):
1. 정확한 텍스트 매칭
2. 부분 텍스트 매칭
3. 클래스 기반 매칭

JSON 배열 형식으로 3-5개의 셀렉터를 반환하세요:
["selector1", "selector2", "selector3"]`;

      const response = await aiClient.generateText(prompt);
      const selectors = JSON.parse(response);
      return Array.isArray(selectors) ? selectors : this.getDefaultNodeSelectors(nodeType);
    } catch (error) {
      console.warn('⚠️ AI 셀렉터 생성 실패:', error);
      return this.getDefaultNodeSelectors(nodeType);
    }
  }

  /**
   * 기본 노드 셀렉터 목록
   */
  private getDefaultNodeSelectors(nodeType: string): string[] {
    return [
      `[class*="Popup"] div:has-text("${nodeType}")`,
      `[class*="popup"] *:has-text("${nodeType}")`,
      `div:has-text("${nodeType}"):not(:has(*:has-text("${nodeType}")))`,
      `button:has-text("${nodeType}")`,
      `[data-node-type="${nodeType}"]`,
    ];
  }

  /**
   * 팝업 내에서 노드 찾기 (셀프힐링 + AI)
   */
  async findNodeInPopup(nodeType: string): Promise<Locator> {
    // AI 기반 셀렉터 시도
    const aiSelectors = await this.findNodeSelectorWithAI(nodeType);

    // 셀프힐링으로 노드 찾기
    return await selfHealingLocator.find(this.page, {
      original: `[class*="Popup"] div:has-text("${nodeType}")`,
      description: `${nodeType} 노드 (팝업 내)`,
      fallbacks: [
        ...aiSelectors,
        `[class*="Popup"] *:text-is("${nodeType}")`,
        `[class*="popup"] *:has-text("${nodeType}")`,
        `div:has-text("${nodeType}")`,
      ],
    });
  }

  /**
   * 노드 추가 (더블클릭 방식)
   * ✅ 분석 결과 기반: 캔버스 더블클릭 → 팝업 → 검색/선택
   */
  async addNode(nodeType: string, options?: { searchFirst?: boolean }) {
    const { searchFirst = true } = options || {};

    // 1. 캔버스 더블클릭으로 팝업 열기
    await this.openAddNodePopup();

    // 2. 검색 후 선택 또는 직접 선택
    if (searchFirst) {
      const found = await this.searchAndSelectNode(nodeType);
      if (found) {
        console.log(`✅ 노드 추가 완료: ${nodeType}`);
        return;
      }
    }

    // 3. 검색 없이 직접 찾기
    const nodeItem = await this.findNodeInPopup(nodeType);
    if (await nodeItem.count() > 0) {
      await nodeItem.click();
      await this.page.waitForTimeout(500);
      console.log(`✅ 노드 추가 완료: ${nodeType}`);
    } else {
      throw new Error(`노드를 찾을 수 없음: ${nodeType}`);
    }
  }

  /**
   * 팝업 닫기
   */
  async closeAddNodePopup() {
    // ESC 키로 팝업 닫기
    await this.page.keyboard.press('Escape');
    await this.page.waitForTimeout(300);
  }

  /**
   * 노드 연결
   */
  async connectNodes(sourceNodeId: string, targetNodeId: string) {
    const sourceHandle = this.page.locator(
      `[data-nodeid="${sourceNodeId}"] [data-handlepos="right"]`
    );
    const targetHandle = this.page.locator(
      `[data-nodeid="${targetNodeId}"] [data-handlepos="left"]`
    );

    await sourceHandle.dragTo(targetHandle);
  }

  /**
   * 워크플로우 저장
   * ✅ 실제 XGEN UI에 맞게 수정
   */
  async saveWorkflow(name: string) {
    // "Save & Run" 버튼 클릭 시도
    const saveAndRunButton = this.page.locator('button:has-text("Save & Run")');
    const saveButton = this.page.locator('button:has-text("Save")');

    // Save & Run 또는 Save 버튼 클릭
    const buttonToClick = await saveAndRunButton.count() > 0 ? saveAndRunButton : saveButton;
    await buttonToClick.click().catch(() => {
      console.warn('Save button not found, trying alternative selectors');
    });

    // 워크플로우 이름 입력 (다양한 선택자 시도)
    const nameInputSelectors = [
      'input[placeholder*="워크플로우"]',
      'input[placeholder*="workflow"]',
      'input[placeholder*="이름"]',
      'input[type="text"]',
    ];

    for (const selector of nameInputSelectors) {
      const input = this.page.locator(selector).first();
      if (await input.count() > 0) {
        await input.fill(name);
        break;
      }
    }

    // 저장 확인 버튼 클릭
    await this.page.locator('button:has-text("저장"), button:has-text("Save")').first().click().catch(() => {
      console.warn('Save confirmation button not found');
    });

    // 성공 표시 대기 (toast 또는 URL 변경)
    await this.page.waitForTimeout(1000);
  }

  /**
   * 워크플로우 실행
   * ✅ 실제 XGEN UI에 맞게 수정
   */
  async executeWorkflow() {
    // "Save & Run" 또는 "Run" 버튼 찾기
    const saveAndRunButton = this.page.locator('button:has-text("Save & Run")');
    const runButton = this.page.locator('button:has-text("Run")');

    // 버튼 클릭
    if (await saveAndRunButton.count() > 0) {
      await saveAndRunButton.click();
    } else if (await runButton.count() > 0) {
      await runButton.click();
    } else {
      console.warn('Run button not found');
      return;
    }

    // Execution panel이 나타날 때까지 대기
    await this.executionPanel.waitFor({ timeout: 5000 }).catch(() => {
      console.warn('Execution panel not found');
    });
  }

  /**
   * 실행 상태 확인
   */
  async getExecutionStatus(): Promise<'idle' | 'running' | 'completed' | 'failed'> {
    const statusElement = this.executionPanel.locator('[data-testid="execution-status"]');
    const status = await statusElement.getAttribute('data-status');
    return (status as any) || 'idle';
  }

  /**
   * 실행 완료 대기
   */
  async waitForExecutionComplete(timeout: number = 30000) {
    const statusLocator = this.executionPanel.locator('[data-testid="execution-status"]');
    const startTime = Date.now();

    // 폴링 방식으로 상태 확인
    while (Date.now() - startTime < timeout) {
      const status = await statusLocator.getAttribute('data-status').catch(() => null);
      if (status === 'completed' || status === 'failed') {
        return;
      }
      await this.page.waitForTimeout(500); // 0.5초마다 체크
    }

    throw new Error(`Execution did not complete within ${timeout}ms`);
  }

  /**
   * 노드 선택
   */
  async selectNode(nodeId: string) {
    await this.page.click(`[data-nodeid="${nodeId}"]`);
    await this.detailPanel.waitFor({ timeout: 3000 }).catch(() => {
      console.warn('Detail panel not found');
    });
  }

  /**
   * 노드 파라미터 설정
   */
  async setNodeParameter(paramName: string, value: string) {
    const input = this.detailPanel.locator(`[name="${paramName}"]`);
    await input.fill(value);
  }

  /**
   * 캔버스에 있는 모든 노드 개수 확인
   * ✅ 실제 XGEN 노드 구조에 맞게 수정
   */
  async getNodeCount(): Promise<number> {
    // Canvas 내부의 노드 요소들을 찾기 (여러 패턴 시도)
    // SVG 기반 노드 또는 DIV 기반 노드를 모두 커버
    const possibleSelectors = [
      '[class*="canvasGrid"] > div[data-node-id]', // DIV 노드 with data-node-id
      '[class*="canvasGrid"] svg g[data-type="node"]', // SVG 노드
      '[class*="canvasGrid"] [class*="node"]', // 클래스에 node 포함
      '[class*="canvasContainer"] [data-node]', // data-node 속성
    ];

    // 각 선택자를 시도하여 노드 찾기
    for (const selector of possibleSelectors) {
      const count = await this.page.locator(selector).count();
      if (count > 0) {
        return count;
      }
    }

    // 노드가 없거나 선택자가 맞지 않는 경우 0 반환
    return 0;
  }

  /**
   * 줌 인/아웃
   */
  async zoom(direction: 'in' | 'out') {
    const zoomButton = direction === 'in'
      ? this.page.locator('[data-testid="zoom-in"]')
      : this.page.locator('[data-testid="zoom-out"]');

    await zoomButton.click();
  }

  /**
   * Undo 실행
   */
  async undo() {
    await this.page.keyboard.press('Control+Z');
  }

  /**
   * Redo 실행
   */
  async redo() {
    await this.page.keyboard.press('Control+Y');
  }
}
