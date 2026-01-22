import { Page } from '@playwright/test';
import { aiClient } from './ai-client';
import {
  BASE_ACTIONS_PROMPT,
  BASE_DRAG_PROMPT,
  BASE_ZOOM_PROMPT,
  BASE_SUCCESS_PROMPT,
} from '../prompts';

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
 * 캔버스 상태 정보
 */
export interface CanvasState {
  nodesCount: number;
  edgesCount: number;
  hasState: boolean;
}

/**
 * VisionExecutor 옵션
 */
export interface VisionExecutorOptions {
  maxSteps?: number;
  stepDelay?: number;
}

/**
 * AI 비전 기반 테스트 실행기
 * 스크린샷을 분석하여 테스트 목적을 달성
 */
export class VisionExecutor {
  private page: Page;
  private maxSteps: number;
  private stepDelay: number;

  constructor(page: Page, options?: VisionExecutorOptions) {
    this.page = page;
    this.maxSteps = options?.maxSteps || 10;
    this.stepDelay = options?.stepDelay || 500;
  }

  /**
   * 캔버스 상태 가져오기 (노드 수, 엣지 수)
   */
  private async getCanvasState(): Promise<CanvasState | null> {
    try {
      const state = await this.page.evaluate((): CanvasState => {
        // 여러 방법으로 노드 수 계산 시도
        let nodesCount = 0;
        let edgesCount = 0;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const doc = (globalThis as any).document;

        // 방법 1: React Flow 노드 (data-id 속성)
        const rfNodes = doc.querySelectorAll('.react-flow__node');
        if (rfNodes.length > 0) {
          nodesCount = rfNodes.length;
        }

        // 방법 2: XGEN 커스텀 노드 클래스
        if (nodesCount === 0) {
          const xgenNodes = doc.querySelectorAll('[class*="node_"][class*="selected"], [class*="node_"]:not([class*="edge"])');
          nodesCount = xgenNodes.length;
        }

        // 방법 3: 노드 타이틀로 찾기 (Agent Xgen, API Calling Tool 등)
        if (nodesCount === 0) {
          const nodeTitles = doc.querySelectorAll('[class*="nodeTitle"], [class*="node-title"], [class*="NodeTitle"]');
          nodesCount = nodeTitles.length;
        }

        // 방법 4: data-nodeid 속성
        if (nodesCount === 0) {
          const dataNodes = doc.querySelectorAll('[data-nodeid], [data-node-id]');
          nodesCount = dataNodes.length;
        }

        // 엣지 수 계산
        const rfEdges = doc.querySelectorAll('.react-flow__edge');
        edgesCount = rfEdges.length;

        if (edgesCount === 0) {
          const xgenEdges = doc.querySelectorAll('[class*="edge_"], path[class*="edge"]');
          edgesCount = xgenEdges.length;
        }

        return {
          nodesCount,
          edgesCount,
          hasState: nodesCount > 0 || edgesCount > 0
        };
      });

      // 콘솔에 상태 로깅
      console.log(`📊 캔버스 상태: 노드 ${state.nodesCount}개, 엣지 ${state.edgesCount}개`);

      return state;
    } catch (error) {
      console.warn('캔버스 상태 가져오기 실패:', error);
      return null;
    }
  }

  /**
   * 스크린샷을 base64로 캡처
   */
  private async captureScreenshot(): Promise<string> {
    const buffer = await this.page.screenshot({ type: 'png' });
    return buffer.toString('base64');
  }

  /**
   * 캔버스 상태 기반 프롬프트 생성
   */
  private getCanvasStateContext(canvasState: CanvasState | null): string {
    if (!canvasState) return '';

    let context = `
## 🚨 현재 캔버스 상태 (반드시 확인!)
- **노드 수: ${canvasState.nodesCount}개**
- **연결선(엣지) 수: ${canvasState.edgesCount}개**
`;
    if (canvasState.nodesCount === 0) {
      context += `
⛔ **노드가 없습니다!**
- 노드 연결 불가 - 먼저 노드를 추가하세요
- zoom, scroll 하지 말고 doubleClick으로 노드 추가!`;
    } else if (canvasState.nodesCount === 1) {
      context += `
⛔ **노드가 1개뿐입니다!**
- 노드 연결 불가 - 다른 위치에 두 번째 노드를 추가하세요
- zoom, scroll 하지 말고 다른 위치를 doubleClick하여 노드 추가!
- 현재 보이는 노드 외에 다른 노드는 없습니다 (스크롤/줌 불필요)`;
    } else if (canvasState.nodesCount >= 2 && canvasState.edgesCount === 0) {
      context += `
✅ 노드 2개 이상 있음 - 연결 가능!
⚠️ 연결선이 없습니다 - drag로 포트를 연결하세요`;
    } else if (canvasState.edgesCount > 0) {
      context += `
✅ 연결선이 ${canvasState.edgesCount}개 있습니다`;
    }

    return context;
  }

  /**
   * AI에게 현재 화면을 분석하고 다음 액션을 결정하게 함
   */
  private async analyzeAndDecide(objective: string, history: string[]): Promise<AIAction> {
    const screenshot = await this.captureScreenshot();
    const canvasState = await this.getCanvasState();
    const canvasContext = this.getCanvasStateContext(canvasState);

    const prompt = `당신은 웹 UI 테스트 자동화 에이전트입니다.
${canvasContext}

## 테스트 목적
${objective}

## 지금까지 수행한 액션
${history.length > 0 ? history.map((h, i) => `${i + 1}. ${h}`).join('\n') : '없음'}

${BASE_ACTIONS_PROMPT}

## 지시사항
현재 스크린샷을 분석하고, 테스트 목적을 달성하기 위해 수행해야 할 **다음 하나의 액션**을 결정하세요.

## 중요 참고사항
${BASE_ZOOM_PROMPT}
${BASE_DRAG_PROMPT}
${BASE_SUCCESS_PROMPT}

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
