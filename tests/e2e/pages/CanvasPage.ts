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

  // 헤더 버튼
  readonly saveButton: Locator;
  readonly loadButton: Locator;
  readonly executeButton: Locator;

  constructor(page: Page) {
    this.page = page;

    this.canvas = page.locator('[data-testid="react-flow-canvas"]');
    this.sideMenu = page.locator('[data-testid="side-menu"]');
    this.header = page.locator('[data-testid="canvas-header"]');
    this.detailPanel = page.locator('[data-testid="detail-panel"]');
    this.executionPanel = page.locator('[data-testid="execution-panel"]');

    this.saveButton = page.locator('button:has-text("저장")');
    this.loadButton = page.locator('button:has-text("로드")');
    this.executeButton = page.locator('button:has-text("실행")');
  }

  async goto() {
    await this.page.goto('/canvas');
    await this.canvas.waitFor({ timeout: 10000 }).catch(() => {
      console.warn('Canvas element not found with data-testid');
    });
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
      ],
    });
  }

  /**
   * 노드 추가
   */
  async addNode(nodeType: string) {
    const nodeButton = await this.findNodeByType(nodeType);

    // 캔버스 중앙으로 드래그
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
   */
  async saveWorkflow(name: string) {
    await this.saveButton.click();
    await this.page.fill('input[placeholder="워크플로우 이름"]', name);
    await this.page.click('button:has-text("저장")');

    // 성공 토스트 대기
    await this.page.waitForSelector('.toast-success', { timeout: 5000 }).catch(() => {
      console.warn('Success toast not found');
    });
  }

  /**
   * 워크플로우 실행
   */
  async executeWorkflow() {
    await this.executeButton.click();
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
    await this.page.waitForFunction(
      () => {
        const el = document.querySelector('[data-testid="execution-status"]');
        const status = el?.getAttribute('data-status');
        return status === 'completed' || status === 'failed';
      },
      { timeout }
    );
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
   */
  async getNodeCount(): Promise<number> {
    const nodes = await this.page.locator('.react-flow__node').count();
    return nodes;
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
