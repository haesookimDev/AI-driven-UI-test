import { test, expect } from '@playwright/test';
import { CanvasPage } from '../../pages/CanvasPage';

test.describe('캔버스 기본 기능', () => {
  let canvasPage: CanvasPage;

  test.beforeEach(async ({ page }) => {
    canvasPage = new CanvasPage(page);
    // 실제 환경에서는 인증된 상태로 시작해야 할 수 있음
    await canvasPage.goto();
  });

  test('캔버스 페이지 로드', async () => {
    // 캔버스 요소가 보이는지 확인
    await expect(canvasPage.canvas).toBeVisible({ timeout: 10000 });
  });

  test('노드 추가 - ChatGPT', async () => {
    const initialNodeCount = await canvasPage.getNodeCount();

    // ChatGPT 노드 추가
    await canvasPage.addNode('ChatOpenAI');

    // 노드가 추가되었는지 확인
    const finalNodeCount = await canvasPage.getNodeCount();
    expect(finalNodeCount).toBe(initialNodeCount + 1);
  });

  test('워크플로우 저장', async () => {
    // 노드 추가
    await canvasPage.addNode('ChatOpenAI');

    // 워크플로우 저장
    const workflowName = `테스트_워크플로우_${Date.now()}`;
    await canvasPage.saveWorkflow(workflowName);

    // 저장 성공 확인 (실제 구현에 맞게 수정)
    // 예: 성공 메시지가 표시되는지 확인
  });

  test('Undo/Redo 기능', async () => {
    const initialNodeCount = await canvasPage.getNodeCount();

    // 노드 추가
    await canvasPage.addNode('ChatOpenAI');

    // Undo
    await canvasPage.undo();

    // 노드가 삭제되었는지 확인
    const afterUndoCount = await canvasPage.getNodeCount();
    expect(afterUndoCount).toBe(initialNodeCount);

    // Redo
    await canvasPage.redo();

    // 노드가 다시 추가되었는지 확인
    const afterRedoCount = await canvasPage.getNodeCount();
    expect(afterRedoCount).toBe(initialNodeCount + 1);
  });

  test('줌 인/아웃', async () => {
    // 줌 인
    await canvasPage.zoom('in');

    // 줌 아웃
    await canvasPage.zoom('out');

    // 줌 기능이 동작하는지 확인 (실제 줌 레벨 확인은 구현에 따라 다름)
  });
});

test.describe('캔버스 노드 연결', () => {
  test('두 노드 연결', async ({ page }) => {
    const canvasPage = new CanvasPage(page);
    await canvasPage.goto();

    // 두 개의 노드 추가
    await canvasPage.addNode('ChatOpenAI');
    await page.waitForTimeout(500); // 노드 추가 대기

    await canvasPage.addNode('PromptTemplate');

    // 노드 연결 (실제 nodeId는 동적으로 생성됨)
    // 이 부분은 실제 구현에 맞게 조정 필요
    // await canvasPage.connectNodes('node-1', 'node-2');

    // 연결이 생성되었는지 확인
    const edges = await page.locator('.react-flow__edge').count();
    expect(edges).toBeGreaterThan(0);
  });
});
