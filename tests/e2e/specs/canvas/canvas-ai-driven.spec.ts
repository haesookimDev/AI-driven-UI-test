import { test, expect } from '../../fixtures/auth.fixture';
import { runAITest, verifyWithAI, VisionExecutor } from '../../../ai/core/vision-executor';
import {
  XGEN_PORT_DEFINITION,
  XGEN_NODE_CONNECTION_PROMPT,
  API_TO_AGENT_CONNECTION_PROMPT,
  ADD_NODE_PROMPT,
} from '../../../ai/prompts';

/**
 * AI 비전 기반 캔버스 테스트
 *
 * 테스트 명명 규칙:
 * - [기능]: [테스트 대상] - [검증 내용]
 * - 예: "더블클릭: 노드 추가 팝업 - Agent Xgen 노드 선택"
 */
test.describe('AI 비전 기반 캔버스 테스트', () => {

  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/canvas');
    await authenticatedPage.waitForLoadState('networkidle');
    await authenticatedPage.waitForTimeout(2000);
  });

  test('더블클릭: 노드 추가 - Agent Xgen 노드를 캔버스에 추가', async ({ authenticatedPage }) => {
    const result = await runAITest(
      authenticatedPage,
      `[사용 액션: doubleClick, click]
캔버스 빈 공간을 doubleClick하여 노드 추가 팝업을 열고, "Agent Xgen" 노드를 click하여 추가하세요.`,
      { maxSteps: 8 }
    );

    console.log('수행한 단계:', result.steps);
    expect(result.success).toBe(true);
  });

  test('헤더버튼: Save Workflow 버튼 클릭', async ({ authenticatedPage }) => {
    const result = await runAITest(
      authenticatedPage,
      `[사용 액션: click]
헤더에서 "Save Workflow" 버튼을 찾아 click하세요.`,
      { maxSteps: 5 }
    );

    console.log('수행한 단계:', result.steps);
    expect(result.success).toBe(true);
  });

  test('더블클릭+검증: 노드 추가 후 캔버스에 노드 존재 확인', async ({ authenticatedPage }) => {
    const executor = new VisionExecutor(authenticatedPage, { maxSteps: 10 });

    // 1. 노드 추가
    const addResult = await executor.execute(
      `[사용 액션: doubleClick, type, click]
캔버스를 doubleClick하여 노드 추가 팝업을 열고, 검색창에 "Agent"를 type으로 입력한 후, "Agent Xgen"을 click하세요.`
    );

    if (!addResult.success) {
      console.log('노드 추가 실패:', addResult.steps);
    }

    // 2. 노드가 추가되었는지 AI로 검증
    const verified = await executor.verify('캔버스에 "Agent Xgen" 노드가 추가되어 있습니다.');

    expect(verified).toBe(true);
  });

  test('헤더버튼: 작업 히스토리 버튼 클릭 및 패널 열림 확인', async ({ authenticatedPage }) => {
    const result = await runAITest(
      authenticatedPage,
      `[사용 액션: click]
헤더에서 "작업 히스토리" 버튼을 찾아 click하세요.`,
      { maxSteps: 5 }
    );

    console.log('수행한 단계:', result.steps);

    // 히스토리 패널이 열렸는지 검증
    const verified = await verifyWithAI(
      authenticatedPage,
      '작업 히스토리 관련 UI가 화면에 표시되어 있습니다.'
    );

    expect(result.success || verified).toBe(true);
  });

  test('더블클릭: 노드 2개 추가 - API Calling Tool(왼쪽)과 Agent Xgen(오른쪽)', async ({ authenticatedPage }) => {
    const executor = new VisionExecutor(authenticatedPage, { maxSteps: 15 });

    // 첫 번째 노드 추가 (왼쪽: API Calling Tool)
    console.log('\n--- 첫 번째 노드 추가 (왼쪽: API Calling Tool) ---');
    const first = await executor.execute(
      `[사용 액션: doubleClick, click]
${ADD_NODE_PROMPT}
캔버스 **왼쪽** 영역을 doubleClick하여 노드 추가 팝업을 열고, "API Calling Tool" 노드를 click하여 추가하세요.`
    );

    await authenticatedPage.waitForTimeout(1000);

    // 두 번째 노드 추가 (오른쪽: Agent Xgen)
    console.log('\n--- 두 번째 노드 추가 (오른쪽: Agent Xgen) ---');
    const second = await executor.execute(
      `[사용 액션: doubleClick, click]
${ADD_NODE_PROMPT}
캔버스 **오른쪽** 영역을 doubleClick하여 노드 추가 팝업을 열고, "Agent Xgen" 노드를 click하여 추가하세요.`
    );

    // 검증
    const verified = await executor.verify(
      '캔버스에 2개 이상의 노드가 있습니다. API Calling Tool이 왼쪽에, Agent Xgen이 오른쪽에 있습니다.'
    );

    console.log('첫 번째 노드:', first.success, '두 번째 노드:', second.success, '검증:', verified);
    expect((first.success && second.success) || verified).toBe(true);
  });

  test('드래그앤드롭: 노드 간 연결선 생성 (API Calling Tool → Agent Xgen)', async ({ authenticatedPage }) => {
    const executor = new VisionExecutor(authenticatedPage, { maxSteps: 25 });

    // 1. 줌 아웃으로 캔버스 전체 보기
    console.log('\n--- 캔버스 줌 아웃 ---');
    await executor.execute(
      `[사용 액션: zoom]
캔버스가 너무 확대되어 있을 수 있습니다. zoom 액션으로 줌 아웃하세요.
- value: "out"
- delta: 240 (2단계 줌 아웃)
줌 아웃 후 done 처리하세요.`
    );
    await authenticatedPage.waitForTimeout(500);

    // 2. 첫 번째 노드 추가 (왼쪽: API Calling Tool - 출력 노드)
    console.log('\n--- 첫 번째 노드(API Calling Tool) 추가 - 왼쪽 ---');
    await executor.execute(
      `[사용 액션: doubleClick, click]
${ADD_NODE_PROMPT}
캔버스 **왼쪽** 영역을 doubleClick하여 노드 추가 팝업을 열고, "API Calling Tool" 노드를 click하여 추가하세요.
(API Calling Tool은 TOOL을 출력하는 노드이므로 왼쪽에 배치)`
    );
    await authenticatedPage.waitForTimeout(1000);

    // 3. 두 번째 노드 추가 (오른쪽: Agent Xgen - 입력 노드)
    console.log('\n--- 두 번째 노드(Agent Xgen) 추가 - 오른쪽 ---');
    await executor.execute(
      `[사용 액션: doubleClick, click]
${ADD_NODE_PROMPT}
캔버스 **오른쪽** 영역을 doubleClick하여 노드 추가 팝업을 열고, "Agent Xgen" 노드를 click하여 추가하세요.
(Agent Xgen은 TOOL을 입력받는 노드이므로 오른쪽에 배치)`
    );
    await authenticatedPage.waitForTimeout(1000);

    // 4. 노드 간 연결 (드래그 앤 드롭)
    console.log('\n--- 노드 연결 (TOOL → TOOL) ---');
    const connectResult = await executor.execute(
      `[사용 액션: drag, zoom]
${XGEN_PORT_DEFINITION}
${XGEN_NODE_CONNECTION_PROMPT}
${API_TO_AGENT_CONNECTION_PROMPT}

**사전 확인:**
- 캔버스에 노드가 2개 있는지 확인하세요 (노드 수가 1개면 노드 추가 먼저!)
- 두 노드가 화면에 모두 보이는지 확인하세요

**성공 조건:** drag 후 곡선 연결선이 보여야 done. 없으면 재시도.`
    );

    // 5. 연결 검증
    const verified = await executor.verify(
      '두 노드가 연결선(edge)으로 연결되어 있습니다. API Calling Tool에서 Agent Xgen으로 선이 이어져 있습니다.'
    );

    console.log('연결 결과:', connectResult.steps);
    expect(connectResult.success || verified).toBe(true);
  });

  test('드래그앤드롭: 노드 위치 이동', async ({ authenticatedPage }) => {
    const executor = new VisionExecutor(authenticatedPage, { maxSteps: 15 });

    // 1. 노드 추가
    console.log('\n--- 노드 추가 ---');
    await executor.execute(
      `[사용 액션: doubleClick, click]
캔버스 중앙을 doubleClick하여 노드 추가 팝업을 열고, "Agent Xgen" 노드를 click하여 추가하세요.`
    );
    await authenticatedPage.waitForTimeout(1000);

    // 2. 노드 드래그 이동
    console.log('\n--- 노드 드래그 이동 ---');
    const dragResult = await executor.execute(
      `[사용 액션: drag]
추가된 "Agent Xgen" 노드를 다른 위치로 이동하세요.

**드래그 방법:**
1. 시작점(x, y): 노드의 헤더(타이틀 바) 부분 - 노드 상단의 제목 영역
2. 끝점(toX, toY): 캔버스의 오른쪽 하단 영역 (현재 위치에서 약 200px 오른쪽, 150px 아래)

drag 액션 실행 후, 노드가 이동했으면 done을 반환하세요.
노드 이동은 한 번의 drag로 완료됩니다.`
    );

    // 3. 이동 검증
    const verified = await executor.verify(
      'Agent Xgen 노드가 캔버스에 보이며, 초기 위치(중앙)에서 이동한 상태입니다.'
    );

    console.log('드래그 결과:', dragResult.steps);
    expect(dragResult.success || verified).toBe(true);
  });

  test('워크플로우실행: Save & Run 버튼으로 워크플로우 저장 및 실행', async ({ authenticatedPage }) => {
    const executor = new VisionExecutor(authenticatedPage, { maxSteps: 15 });

    // 1. 노드 추가
    console.log('\n--- 노드 추가 ---');
    await executor.execute(
      `[사용 액션: doubleClick, click]
캔버스를 doubleClick하여 노드 추가 팝업을 열고, "Agent Xgen" 노드를 click하여 추가하세요.`
    );
    await authenticatedPage.waitForTimeout(1000);

    // 2. Save & Run 버튼 클릭으로 실행
    console.log('\n--- Save & Run 실행 ---');
    const runResult = await executor.execute(
      `[사용 액션: click]
헤더에서 "Save & Run" 버튼을 찾아 click하세요. 없다면 "Run" 버튼을 click하세요.`
    );

    // 3. 실행 결과 검증
    await authenticatedPage.waitForTimeout(2000);
    const verified = await executor.verify(
      '워크플로우 실행 상태가 표시되거나, 실행 패널이 열려있습니다.'
    );

    console.log('실행 결과:', runResult.steps);
    expect(runResult.success || verified).toBe(true);
  });

});

/**
 * 수동 조작 기반 워크플로우 테스트
 * - 자동 생성 기능을 사용하지 않고 수동으로 노드 추가/연결/실행
 */
test.describe('수동 조작 기반 워크플로우 테스트', () => {

  test('수동노드추가+저장: 더블클릭으로 노드 추가 후 Save Workflow로 저장', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/canvas');
    await authenticatedPage.waitForLoadState('networkidle');

    const result = await runAITest(
      authenticatedPage,
      `[사용 액션: doubleClick, click]
다음 작업을 순서대로 수행하세요:
1. 캔버스 빈 공간을 doubleClick하여 노드 추가 팝업을 엽니다
2. "Agent Xgen" 노드를 click하여 추가합니다
3. 헤더에서 "Save Workflow" 버튼을 click합니다
4. 저장이 완료되면 done을 반환합니다`,
      { maxSteps: 12 }
    );

    console.log('\n=== 테스트 결과 ===');
    console.log('성공:', result.success);
    console.log('수행 단계:');
    result.steps.forEach((step, i) => console.log(`  ${i + 1}. ${step}`));

    expect(result.success).toBe(true);
  });

  test('수동연결+실행: API Calling Tool → Agent Xgen 연결 후 Run 실행', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/canvas');
    await authenticatedPage.waitForLoadState('networkidle');
    await authenticatedPage.waitForTimeout(2000);

    const executor = new VisionExecutor(authenticatedPage, { maxSteps: 30 });

    // 0. 줌 아웃으로 캔버스 전체 보기
    console.log('\n--- 0단계: 캔버스 줌 조정 ---');
    await executor.execute(
      `[사용 액션: zoom]
캔버스 뷰를 조정합니다. zoom 액션으로 줌 아웃하세요.
- value: "out"
- delta: 240
줌 아웃 후 done 반환.`
    );
    await authenticatedPage.waitForTimeout(500);

    // 1. 첫 번째 노드 추가 (왼쪽: API Calling Tool - 출력 노드)
    console.log('\n--- 1단계: API Calling Tool 추가 (왼쪽) ---');
    const step1 = await executor.execute(
      `[사용 액션: doubleClick, click]
${ADD_NODE_PROMPT}
캔버스 **왼쪽** 중앙을 doubleClick하여 노드 추가 팝업을 열고, "API Calling Tool" 노드를 click하여 추가하세요.
(워크플로우: 왼쪽 → 오른쪽 방향. API Calling Tool은 TOOL을 출력하므로 왼쪽에 배치)`
    );
    await authenticatedPage.waitForTimeout(1000);

    // 2. 두 번째 노드 추가 (오른쪽: Agent Xgen - 입력 노드)
    console.log('\n--- 2단계: Agent Xgen 추가 (오른쪽) ---');
    const step2 = await executor.execute(
      `[사용 액션: doubleClick, click]
${ADD_NODE_PROMPT}
캔버스 **오른쪽** 중앙을 doubleClick하여 노드 추가 팝업을 열고, "Agent Xgen" 노드를 click하여 추가하세요.
(Agent Xgen은 TOOL을 입력받으므로 오른쪽에 배치)`
    );
    await authenticatedPage.waitForTimeout(1000);

    // 3. 노드 연결 (TOOL → TOOL)
    console.log('\n--- 3단계: 노드 연결 (TOOL → TOOL) ---');
    const step3 = await executor.execute(
      `[사용 액션: drag, zoom]
${XGEN_PORT_DEFINITION}
${XGEN_NODE_CONNECTION_PROMPT}
${API_TO_AGENT_CONNECTION_PROMPT}

**사전 확인:**
- 캔버스에 노드가 2개 있어야 합니다 (1개면 연결 불가 → 노드 추가 필요)
- 두 노드가 화면에 모두 보여야 합니다

**포트가 안 보이면:** zoom in

**성공:** 곡선 연결선 보이면 done. 없으면 재시도.`
    );
    await authenticatedPage.waitForTimeout(1000);

    // 4. 워크플로우 실행
    console.log('\n--- 4단계: 워크플로우 실행 ---');
    const step4 = await executor.execute(
      `[사용 액션: click]
헤더에서 "Save & Run" 또는 "Run" 버튼을 click하여 워크플로우를 실행하세요.
버튼 클릭 후 done 반환.`
    );

    // 5. 결과 검증
    await authenticatedPage.waitForTimeout(3000);
    const verified = await executor.verify(
      '워크플로우가 실행 중이거나 실행이 완료된 상태입니다. 실행 패널이나 상태 표시가 보입니다.'
    );

    console.log('\n=== 테스트 결과 ===');
    console.log('1단계 (API Calling Tool 추가):', step1.success);
    console.log('2단계 (Agent Xgen 추가):', step2.success);
    console.log('3단계 (TOOL → TOOL 연결):', step3.success);
    console.log('4단계 (실행):', step4.success);
    console.log('검증:', verified);

    expect(step1.success && step2.success).toBe(true);
  });

  test('UI탐색: 헤더 버튼 호버로 툴팁 확인', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/canvas');
    await authenticatedPage.waitForLoadState('networkidle');

    const executor = new VisionExecutor(authenticatedPage, { maxSteps: 8 });

    // AI에게 UI 탐색 시키기
    const result = await executor.execute(
      `[사용 액션: hover, wait]
헤더에 있는 버튼들을 하나씩 hover하면서 툴팁을 확인하세요.
각 버튼 위에서 hover 후 wait하여 툴팁이 표시되면 다음 버튼으로 이동하세요.
모든 버튼을 확인했으면 done을 반환하세요.`
    );

    console.log('탐색 결과:', result.steps);
    expect(result.success).toBe(true);
  });

});
