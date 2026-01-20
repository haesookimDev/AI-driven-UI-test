import { Page, Locator } from '@playwright/test';
import { selfHealingLocator } from '../../ai/core/self-healing';

export class CanvasPage {
  readonly page: Page;

  // 주요 영역
  readonly canvas: Locator;
  readonly sideMenu: Locator;
  readonly header: Locator;
  readonly detailPanel: Locator;
  readonly executionPanel: Locator;

  // 메뉴 버튼들
  readonly menuButtons: Locator;
  readonly sideMenuButtons: Locator;

  // 헤더 버튼
  readonly saveButton: Locator;
  readonly loadButton: Locator;
  readonly executeButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // ✅ 실제 XGEN Canvas 구조에 맞게 수정
    // CSS Module 클래스명이 해시를 포함하므로 부분 일치 사용
    this.canvas = page.locator('[class*="canvasContainer"]').first();
    this.sideMenu = page.locator('[class*="menu"]').first();
    this.header = page.locator('header').first();
    this.detailPanel = page.locator('[class*="detailPanel"]').first();
    this.executionPanel = page.locator('[class*="executionPanel"]').first();

    // ✅ 메뉴 버튼 (6번째 버튼이 노드 정보)
    this.menuButtons = page.locator('[class*="menu"] button, [class*="toolbar"] button');
    this.sideMenuButtons = page.locator('[class*="sideMenu"] button, [class*="sidebar"] button');

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

  /**
   * 6번째 메뉴 버튼 클릭 (노드 정보 메뉴 열기)
   * 가이드: 노드 정보는 6번째 메뉴 버튼에 있음
   */
  async openNodeMenu() {
    // 6번째 메뉴 버튼 클릭 (0-indexed로 5번째)
    const sixthMenuButton = this.menuButtons.nth(5);

    if (await sixthMenuButton.count() > 0) {
      await sixthMenuButton.click();
      await this.page.waitForTimeout(300);
      console.log('✅ 6번째 메뉴 버튼 클릭 - 노드 메뉴 열림');
    } else {
      console.warn('⚠️ 6번째 메뉴 버튼을 찾을 수 없음');
    }
  }

  /**
   * 캔버스 빈 공간 더블클릭으로 노드 생성 메뉴 열기
   * 가이드: 캔버스 빈 공간을 더블클릭하면 노드 생성 가능
   */
  async doubleClickCanvasToOpenNodeMenu() {
    const canvasBounds = await this.canvas.boundingBox();
    if (!canvasBounds) {
      throw new Error('Canvas not found');
    }

    // 캔버스 중앙 더블클릭
    await this.page.mouse.dblclick(
      canvasBounds.x + canvasBounds.width / 2,
      canvasBounds.y + canvasBounds.height / 2
    );
    await this.page.waitForTimeout(300);
    console.log('✅ 캔버스 더블클릭 - 노드 생성 메뉴 열림');
  }

  /**
   * 첫 번째 사이드 메뉴 버튼 클릭 (노드 추가 버튼)
   * 가이드: 첫 번째 사이드 메뉴 버튼이 노드 추가 버튼
   */
  async clickAddNodeButton() {
    const firstSideMenuButton = this.sideMenuButtons.first();

    if (await firstSideMenuButton.count() > 0) {
      await firstSideMenuButton.click();
      await this.page.waitForTimeout(300);
      console.log('✅ 노드 추가 버튼 클릭');
    } else {
      console.warn('⚠️ 사이드 메뉴 버튼을 찾을 수 없음');
    }
  }

  /**
   * 노드 카테고리 선택
   * 가이드: 노드 카테고리를 클릭하면 세부 노드 목록이 나타남
   */
  async selectNodeCategory(category: string) {
    const categorySelectors = [
      `button:has-text("${category}")`,
      `[class*="category"]:has-text("${category}")`,
      `[data-category="${category}"]`,
      `div:has-text("${category}")`,
    ];

    for (const selector of categorySelectors) {
      const categoryElement = this.page.locator(selector).first();
      if (await categoryElement.count() > 0) {
        await categoryElement.click();
        await this.page.waitForTimeout(300);
        console.log(`✅ 노드 카테고리 선택: ${category}`);
        return;
      }
    }

    console.warn(`⚠️ 노드 카테고리를 찾을 수 없음: ${category}`);
  }

  /**
   * 셀프힐링 기능으로 노드 찾기
   */
  async findNodeByType(nodeType: string): Promise<Locator> {
    return await selfHealingLocator.find(this.page, {
      original: `[data-testid="node-${nodeType}"]`,
      description: `${nodeType} 노드`,
      fallbacks: [
        `[data-node-type="${nodeType}"]`,
        `.node-${nodeType}`,
        `[aria-label="${nodeType} 노드"]`,
        `button:has-text("${nodeType}")`,
        `[class*="node"]:has-text("${nodeType}")`,
        `div:has-text("${nodeType}")`,
      ],
    });
  }

  /**
   * 노드 추가 (개선된 방식)
   * 가이드:
   * 방법 1: 6번째 메뉴 버튼 클릭 → 사이드 메뉴 → 노드 추가 버튼 → 카테고리 선택 → 노드 선택
   * 방법 2: 캔버스 더블클릭 → 노드 선택
   */
  async addNode(nodeType: string, options?: { useDoubleClick?: boolean; category?: string }) {
    const { useDoubleClick = false, category } = options || {};

    if (useDoubleClick) {
      // 방법 2: 캔버스 더블클릭으로 노드 생성 메뉴 열기
      await this.doubleClickCanvasToOpenNodeMenu();
    } else {
      // 방법 1: 메뉴 버튼을 통한 노드 추가
      await this.openNodeMenu();
      await this.clickAddNodeButton();
    }

    // 카테고리가 지정된 경우 카테고리 먼저 선택
    if (category) {
      await this.selectNodeCategory(category);
    }

    // 노드 타입 선택
    const nodeButton = await this.findNodeByType(nodeType);

    if (await nodeButton.count() > 0) {
      await nodeButton.click();
      await this.page.waitForTimeout(500);
      console.log(`✅ 노드 추가 완료: ${nodeType}`);
    } else {
      // 폴백: 드래그 방식 시도
      console.log('⚠️ 클릭 방식 실패, 드래그 방식 시도');
      const canvasBounds = await this.canvas.boundingBox();
      if (!canvasBounds) {
        throw new Error('Canvas not found');
      }

      await nodeButton.dragTo(this.canvas, {
        targetPosition: {
          x: canvasBounds.width / 2,
          y: canvasBounds.height / 2,
        },
      });
    }
  }

  /**
   * 노드 추가 (레거시 드래그 방식)
   */
  async addNodeByDrag(nodeType: string) {
    const nodeButton = await this.findNodeByType(nodeType);

    const canvasBounds = await this.canvas.boundingBox();
    if (!canvasBounds) {
      throw new Error('Canvas not found');
    }

    await nodeButton.dragTo(this.canvas, {
      targetPosition: {
        x: canvasBounds.width / 2,
        y: canvasBounds.height / 2,
      },
    });
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
