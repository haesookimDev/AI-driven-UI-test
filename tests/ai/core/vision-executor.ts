import { Page } from '@playwright/test';
import { aiClient } from './ai-client';

/**
 * AI 액션 타입
 */
export interface AIAction {
  type: 'click' | 'type' | 'doubleClick' | 'hover' | 'scroll' | 'wait' | 'drag' | 'zoom' | 'done' | 'failed';
  target?: string;  // 클릭할 요소 설명 또는 좌표
  value?: string;   // 입력할 텍스트 또는 zoom 방향 ('in' | 'out')
  x?: number;       // 시작 좌표 (클릭/드래그 시작점)
  y?: number;
  toX?: number;     // 드래그 종료 좌표
  toY?: number;
  delta?: number;   // zoom 시 휠 델타값 (양수: 줌아웃, 음수: 줌인)
  reason?: string;  // AI가 설명하는 이유
}

/**
 * AI 비전 기반 테스트 실행기
 * 스크린샷을 분석하여 테스트 목적을 달성
 */
export class VisionExecutor {
  private page: Page;
  private maxSteps: number;
  private stepDelay: number;

  constructor(page: Page, options?: { maxSteps?: number; stepDelay?: number }) {
    this.page = page;
    this.maxSteps = options?.maxSteps || 10;
    this.stepDelay = options?.stepDelay || 500;
  }

  /**
   * 스크린샷을 base64로 캡처
   */
  private async captureScreenshot(): Promise<string> {
    const buffer = await this.page.screenshot({ type: 'png' });
    return buffer.toString('base64');
  }

  /**
   * AI에게 현재 화면을 분석하고 다음 액션을 결정하게 함
   */
  private async analyzeAndDecide(objective: string, history: string[]): Promise<AIAction> {
    const screenshot = await this.captureScreenshot();

    const prompt = `당신은 웹 UI 테스트 자동화 에이전트입니다.

## 테스트 목적
${objective}

## 지금까지 수행한 액션
${history.length > 0 ? history.map((h, i) => `${i + 1}. ${h}`).join('\n') : '없음'}

## 사용 가능한 액션
1. **click**: 단일 클릭 (x, y 좌표 필수)
2. **doubleClick**: 더블 클릭 (x, y 좌표 필수)
3. **drag**: 드래그 앤 드롭 (x, y: 시작점, toX, toY: 끝점 필수)
4. **type**: 키보드 입력 (value 필수, 현재 포커스된 요소에 입력)
5. **hover**: 마우스 호버 (x, y 좌표 필수)
6. **scroll**: 스크롤 (y: 스크롤 양)
7. **zoom**: 캔버스 줌 인/아웃 (Ctrl+휠) - value: "in" 또는 "out", delta: 휠 양 (기본 -120 줌인, 120 줌아웃)
8. **wait**: 1초 대기
9. **done**: 목적 달성 완료
10. **failed**: 진행 불가

## 지시사항
현재 스크린샷을 분석하고, 테스트 목적을 달성하기 위해 수행해야 할 **다음 하나의 액션**을 결정하세요.

다음 JSON 형식으로만 응답하세요:
{
  "type": "click" | "doubleClick" | "drag" | "type" | "hover" | "scroll" | "zoom" | "wait" | "done" | "failed",
  "target": "대상 요소 설명 (예: 'Agent Xgen 노드', '검색 입력창')",
  "x": 시작_X좌표_숫자,
  "y": 시작_Y좌표_숫자,
  "toX": 드래그_종료_X좌표_숫자 (drag인 경우 필수),
  "toY": 드래그_종료_Y좌표_숫자 (drag인 경우 필수),
  "value": "입력할_텍스트 또는 zoom방향 ('in'/'out')",
  "delta": 줌_휠_델타값 (zoom인 경우, 기본: -120 줌인, 120 줌아웃),
  "reason": "이 액션을 선택한 이유"
}

## 중요 참고사항

### 줌 (zoom)
- 캔버스가 너무 확대되어 노드가 잘 보이지 않으면 zoom out (value: "out", delta: 120)
- 노드가 너무 작아서 포트가 안 보이면 zoom in (value: "in", delta: -120)
- 줌은 캔버스 중앙에서 수행됩니다

### 드래그 (drag)
- **노드 이동**: 노드의 헤더(타이틀 바) 부분을 시작점으로 잡고 드래그
- **노드 연결**: 반드시 출력 포트 → 입력 포트로 드래그
  - 출력 포트: 노드 오른쪽 가장자리의 작은 원형 점 (보통 노드 우측 중앙)
  - 입력 포트: 노드 왼쪽 가장자리의 작은 원형 점 (보통 노드 좌측 중앙)
  - 포트는 노드 경계에서 약간 돌출된 작은 원으로 보임

### 성공 판단
- **노드 이동 완료**: drag 액션 수행 후, 노드가 의도한 위치로 이동했으면 done
- **연결 완료**: drag 후 두 노드 사이에 선(edge)이 생겼으면 done
- 액션 수행 후 화면 변화를 확인하고, 목적이 달성되었으면 반드시 done 반환

### 좌표 참고
- 스크린샷 크기 기준으로 좌표를 제공하세요
- 팝업이나 모달이 있으면 그 안에서 액션을 수행하세요
- 더 이상 진행할 수 없으면 type: "failed"`;

    try {
      const response = await aiClient.analyzeImage(screenshot, prompt);

      // JSON 파싱 시도
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const action = JSON.parse(jsonMatch[0]) as AIAction;
        return action;
      }

      return { type: 'failed', reason: 'AI 응답을 파싱할 수 없음' };
    } catch (error) {
      console.error('AI 분석 실패:', error);
      return { type: 'failed', reason: String(error) };
    }
  }

  /**
   * AI가 결정한 액션 실행
   */
  private async executeAction(action: AIAction): Promise<boolean> {
    console.log(`🤖 AI 액션: ${action.type} - ${action.reason || ''}`);

    try {
      switch (action.type) {
        case 'click':
          if (action.x !== undefined && action.y !== undefined) {
            await this.page.mouse.click(action.x, action.y);
          } else if (action.target) {
            // 텍스트 기반 클릭 시도
            const element = this.page.locator(`text=${action.target}`).first();
            if (await element.count() > 0) {
              await element.click();
            } else {
              console.warn(`⚠️ 요소를 찾을 수 없음: ${action.target}`);
              return false;
            }
          }
          break;

        case 'doubleClick':
          if (action.x !== undefined && action.y !== undefined) {
            await this.page.mouse.dblclick(action.x, action.y);
          }
          break;

        case 'type':
          if (action.value) {
            // 현재 포커스된 요소에 입력
            await this.page.keyboard.type(action.value);
          }
          break;

        case 'hover':
          if (action.x !== undefined && action.y !== undefined) {
            await this.page.mouse.move(action.x, action.y);
          }
          break;

        case 'drag':
          if (action.x !== undefined && action.y !== undefined &&
              action.toX !== undefined && action.toY !== undefined) {
            // 드래그 시작점으로 이동
            await this.page.mouse.move(action.x, action.y);
            await this.page.waitForTimeout(100);
            // 마우스 버튼 누르기
            await this.page.mouse.down();
            await this.page.waitForTimeout(100);
            // 드래그 (중간 지점을 거쳐 자연스럽게 이동)
            await this.page.mouse.move(action.toX, action.toY, { steps: 20 });
            await this.page.waitForTimeout(100);
            // 마우스 버튼 놓기
            await this.page.mouse.up();
            console.log(`  📍 드래그: (${action.x}, ${action.y}) → (${action.toX}, ${action.toY})`);
          } else {
            console.warn('⚠️ 드래그에 필요한 좌표가 부족합니다 (x, y, toX, toY 필요)');
            return false;
          }
          break;

        case 'zoom':
          {
            // 캔버스 중앙 좌표 계산 (또는 지정된 좌표 사용)
            const viewport = this.page.viewportSize();
            const zoomX = action.x ?? (viewport?.width ?? 1280) / 2;
            const zoomY = action.y ?? (viewport?.height ?? 720) / 2;

            // 줌 방향에 따른 델타 값 결정
            let wheelDelta = action.delta ?? (action.value === 'in' ? -120 : 120);

            // 마우스를 캔버스 중앙으로 이동
            await this.page.mouse.move(zoomX, zoomY);

            // Ctrl 키를 누른 상태에서 휠 스크롤 (줌 인/아웃)
            await this.page.keyboard.down('Control');
            await this.page.mouse.wheel(0, wheelDelta);
            await this.page.keyboard.up('Control');

            const direction = wheelDelta < 0 ? '줌 인' : '줌 아웃';
            console.log(`  🔍 ${direction}: 델타 ${wheelDelta} at (${zoomX}, ${zoomY})`);
          }
          break;

        case 'scroll':
          await this.page.mouse.wheel(0, action.y || 100);
          break;

        case 'wait':
          await this.page.waitForTimeout(1000);
          break;

        case 'done':
          console.log('✅ 테스트 목적 달성');
          return true;

        case 'failed':
          console.error('❌ 테스트 실패:', action.reason);
          return false;
      }

      await this.page.waitForTimeout(this.stepDelay);
      return true;
    } catch (error) {
      console.error('액션 실행 실패:', error);
      return false;
    }
  }

  /**
   * 테스트 목적을 달성할 때까지 AI가 자동으로 수행
   */
  async execute(objective: string): Promise<{ success: boolean; steps: string[] }> {
    const history: string[] = [];
    let step = 0;

    console.log(`\n🎯 테스트 시작: ${objective}`);
    console.log('='.repeat(50));

    while (step < this.maxSteps) {
      step++;
      console.log(`\n📍 Step ${step}/${this.maxSteps}`);

      // AI에게 현재 상태 분석 및 다음 액션 결정 요청
      const action = await this.analyzeAndDecide(objective, history);

      // 히스토리에 추가
      const actionLog = `${action.type}: ${action.target || ''} ${action.value || ''} (${action.reason || ''})`;
      history.push(actionLog);

      // 완료 또는 실패 체크
      if (action.type === 'done') {
        console.log('\n' + '='.repeat(50));
        console.log('✅ 테스트 성공!');
        return { success: true, steps: history };
      }

      if (action.type === 'failed') {
        console.log('\n' + '='.repeat(50));
        console.log('❌ 테스트 실패:', action.reason);
        return { success: false, steps: history };
      }

      // 액션 실행
      const result = await this.executeAction(action);
      if (!result) {
        console.warn('⚠️ 액션 실행 실패, 계속 진행');
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('⚠️ 최대 스텝 도달');
    return { success: false, steps: history };
  }

  /**
   * 간단한 검증: 화면에 특정 요소가 있는지 AI에게 확인
   */
  async verify(condition: string): Promise<boolean> {
    const screenshot = await this.captureScreenshot();

    const prompt = `현재 스크린샷을 보고 다음 조건이 충족되었는지 확인하세요:

조건: ${condition}

JSON 형식으로만 응답하세요:
{
  "satisfied": true 또는 false,
  "reason": "판단 이유"
}`;

    try {
      const response = await aiClient.analyzeImage(screenshot, prompt);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        console.log(`🔍 검증: ${condition} -> ${result.satisfied ? '✅' : '❌'} (${result.reason})`);
        return result.satisfied;
      }
    } catch (error) {
      console.error('검증 실패:', error);
    }

    return false;
  }
}

/**
 * 간편하게 사용할 수 있는 함수
 */
export async function runAITest(
  page: Page,
  objective: string,
  options?: { maxSteps?: number; stepDelay?: number }
): Promise<{ success: boolean; steps: string[] }> {
  const executor = new VisionExecutor(page, options);
  return await executor.execute(objective);
}

export async function verifyWithAI(page: Page, condition: string): Promise<boolean> {
  const executor = new VisionExecutor(page);
  return await executor.verify(condition);
}
