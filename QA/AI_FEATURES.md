# AI 기능 상세 명세

> XGEN AI-Driven E2E 테스트의 AI 기능 구현 가이드

## 📋 목차

1. [AI 테스트 생성기](#ai-테스트-생성기)
2. [셀프힐링 셀렉터](#셀프힐링-셀렉터)
3. [AI 비주얼 검증](#ai-비주얼-검증)
4. [이상 탐지](#이상-탐지)
5. [테스트 분석 및 리포팅](#테스트-분석-및-리포팅)
6. [프롬프트 엔지니어링](#프롬프트-엔지니어링)

---

## AI 테스트 생성기

### 개요

자연어 설명 또는 버그 리포트로부터 Playwright 테스트 코드를 자동 생성합니다.

### 핵심 기능

#### 1. 자연어로 테스트 생성

**입력**:
```
"사용자가 로그인 후 캔버스 페이지에서 ChatGPT 노드와 VectorStore 노드를 추가하고 연결한 다음 워크플로우를 저장하는 시나리오"
```

**출력**:
```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { CanvasPage } from '../pages/CanvasPage';

test.describe('워크플로우 생성 및 저장', () => {
  test('ChatGPT와 VectorStore 연결 워크플로우', async ({ page }) => {
    // 로그인
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('test@example.com', 'password123');

    // 캔버스 이동
    const canvasPage = new CanvasPage(page);
    await canvasPage.goto();

    // ChatGPT 노드 추가
    await canvasPage.addNode('ChatOpenAI');
    const chatGptNode = await canvasPage.findNodeByType('ChatOpenAI');
    await expect(chatGptNode).toBeVisible();

    // VectorStore 노드 추가
    await canvasPage.addNode('VectorStore');
    const vectorStoreNode = await canvasPage.findNodeByType('VectorStore');
    await expect(vectorStoreNode).toBeVisible();

    // 노드 연결
    await canvasPage.connectNodes('chatgpt-1', 'vectorstore-1');

    // 연결 확인
    const edge = page.locator('[data-source="chatgpt-1"][data-target="vectorstore-1"]');
    await expect(edge).toBeVisible();

    // 워크플로우 저장
    await canvasPage.saveWorkflow('My RAG Workflow');

    // 저장 성공 확인
    await expect(page.locator('.toast-success')).toContainText('저장되었습니다');
  });
});
```

#### 2. 페이지 분석 기반 테스트 생성

**구현**:

```typescript
// tests/ai/core/test-generator.ts
export class AITestGenerator {
  async generateFromPage(
    page: Page,
    testDescription: string
  ): Promise<string> {
    // 페이지 HTML 추출
    const html = await page.content();

    // 인터랙티브 요소 분석
    const interactiveElements = await page.evaluate(() => {
      const elements = [];
      document.querySelectorAll('button, input, a, [role="button"]').forEach(el => {
        elements.push({
          tag: el.tagName.toLowerCase(),
          text: el.textContent?.trim(),
          id: el.id,
          class: el.className,
          type: el.getAttribute('type'),
          dataTestId: el.getAttribute('data-testid'),
        });
      });
      return elements;
    });

    // 프롬프트 생성
    const prompt = `다음 페이지에 대한 Playwright 테스트를 작성해주세요.

테스트 설명: ${testDescription}

페이지 구조:
${html.slice(0, 3000)}

인터랙티브 요소:
${JSON.stringify(interactiveElements, null, 2)}

요구사항:
1. Page Object Model 패턴 사용
2. data-testid를 우선 사용, 없으면 의미있는 셀렉터 사용
3. 적절한 assertion 포함
4. TypeScript로 작성

테스트 코드:`;

    return await aiClient.generateText(prompt);
  }

  async generateFromUserFlow(steps: string[]): Promise<string> {
    const stepsText = steps.map((step, i) => `${i + 1}. ${step}`).join('\n');

    const prompt = `다음 사용자 플로우를 Playwright 테스트로 변환해주세요:

${stepsText}

요구사항:
- 각 단계마다 적절한 assertion 추가
- Page Object Pattern 사용
- 에러 처리 포함

TypeScript 코드:`;

    return await aiClient.generateText(prompt);
  }
}
```

#### 3. 버그 리포트에서 테스트 생성

```typescript
async generateBugReproductionTest(bugReport: {
  title: string;
  description: string;
  stepsToReproduce: string[];
  expectedBehavior: string;
  actualBehavior: string;
}): Promise<string> {
  const prompt = `다음 버그를 재현하는 Playwright 테스트를 작성해주세요:

제목: ${bugReport.title}

설명: ${bugReport.description}

재현 단계:
${bugReport.stepsToReproduce.map((s, i) => `${i + 1}. ${s}`).join('\n')}

예상 동작: ${bugReport.expectedBehavior}
실제 동작: ${bugReport.actualBehavior}

테스트는 다음을 포함해야 합니다:
1. 버그 재현 단계를 정확히 따르기
2. 예상 동작 vs 실제 동작 비교
3. 버그가 수정되면 통과하도록 assertion 작성
4. Page Object Model 사용

TypeScript 코드:`;

  return await aiClient.generateText(prompt);
}
```

### 프롬프트 템플릿

`tests/ai/models/prompts/test-generation.ts`:

```typescript
export const TEST_GENERATION_SYSTEM_PROMPT = `당신은 숙련된 QA 엔지니어이자 Playwright 전문가입니다.

주어진 요구사항에 맞는 고품질 E2E 테스트를 작성합니다.

테스트 작성 원칙:
1. **명확성**: 테스트 의도가 명확해야 함
2. **안정성**: Flaky 테스트 방지 (적절한 대기, 명확한 셀렉터)
3. **유지보수성**: Page Object Model 패턴 사용
4. **완전성**: 모든 중요한 동작에 assertion
5. **독립성**: 테스트 간 의존성 없음

셀렉터 우선순위:
1. data-testid (가장 안정적)
2. id
3. 의미있는 aria-label, role
4. 고유한 class 또는 텍스트
5. 구조적 셀렉터 (최후의 수단)

출력 형식:
- 순수 TypeScript 코드만 반환
- 코드 블록 마커(```) 사용 금지
- 주석은 필요한 경우만 최소한으로
- import 문 포함`;

export interface TestGenerationContext {
  description: string;
  pageUrl?: string;
  pageHtml?: string;
  existingTests?: string[];
  userFlow?: string[];
}

export const buildTestGenerationPrompt = (context: TestGenerationContext): string => {
  let prompt = `테스트 요구사항:\n${context.description}\n\n`;

  if (context.pageUrl) {
    prompt += `페이지 URL: ${context.pageUrl}\n\n`;
  }

  if (context.pageHtml) {
    prompt += `페이지 HTML (일부):\n${context.pageHtml.slice(0, 2000)}\n\n`;
  }

  if (context.userFlow && context.userFlow.length > 0) {
    prompt += `사용자 플로우:\n`;
    context.userFlow.forEach((step, i) => {
      prompt += `${i + 1}. ${step}\n`;
    });
    prompt += '\n';
  }

  if (context.existingTests && context.existingTests.length > 0) {
    prompt += `기존 테스트 참고 (스타일 일관성):\n`;
    prompt += context.existingTests[0].slice(0, 500) + '...\n\n';
  }

  prompt += `위 요구사항에 맞는 Playwright 테스트를 작성해주세요.`;

  return prompt;
};
```

---

## 셀프힐링 셀렉터

### 개요

DOM 구조 변경 시 자동으로 올바른 셀렉터를 찾아 테스트를 복구합니다.

### 동작 원리

```
1. 원본 셀렉터 시도
   ↓ (실패)
2. 학습된 셀렉터 시도
   ↓ (실패)
3. 폴백 셀렉터 시도
   ↓ (실패)
4. AI에게 새 셀렉터 찾도록 요청
   ↓ (성공)
5. 새 셀렉터 학습 DB에 저장
```

### 고급 구현

```typescript
// tests/ai/core/self-healing.ts

export interface SelectorStrategy {
  type: 'testid' | 'id' | 'class' | 'text' | 'xpath' | 'css';
  value: string;
  confidence: number; // 0-1
}

export class AdvancedSelfHealingLocator {
  private knowledgeBase: Map<string, SelectorStrategy[]> = new Map();
  private successRate: Map<string, number> = new Map();

  async find(
    page: Page,
    context: {
      original: string;
      description: string;
      visual?: { x: number; y: number; width: number; height: number };
    }
  ): Promise<Locator> {
    // 1. 원본 시도
    const original = await this.trySelector(page, context.original);
    if (original) {
      this.recordSuccess(context.description, context.original);
      return original;
    }

    // 2. 학습된 전략 시도
    const strategies = this.knowledgeBase.get(context.description) || [];
    for (const strategy of strategies.sort((a, b) => b.confidence - a.confidence)) {
      const locator = await this.trySelector(page, strategy.value);
      if (locator) {
        this.recordSuccess(context.description, strategy.value);
        return locator;
      }
    }

    // 3. 시각적 위치 기반 검색 (제공된 경우)
    if (context.visual) {
      const visualLocator = await this.findByVisualPosition(page, context.visual);
      if (visualLocator) {
        const selector = await this.extractSelector(page, visualLocator);
        this.learn(context.description, { type: 'css', value: selector, confidence: 0.7 });
        return visualLocator;
      }
    }

    // 4. AI 분석
    const aiSuggestion = await this.aiAnalyzeAndSuggest(page, context);
    if (aiSuggestion) {
      this.learn(context.description, aiSuggestion);
      return page.locator(aiSuggestion.value);
    }

    throw new Error(`[SelfHealing] 요소를 찾을 수 없음: ${context.description}`);
  }

  private async trySelector(page: Page, selector: string): Promise<Locator | null> {
    try {
      const locator = page.locator(selector);
      await locator.waitFor({ state: 'visible', timeout: 3000 });
      return locator;
    } catch {
      return null;
    }
  }

  private async findByVisualPosition(
    page: Page,
    position: { x: number; y: number; width: number; height: number }
  ): Promise<Locator | null> {
    // 주어진 위치에서 요소 찾기
    const element = await page.evaluate((pos) => {
      const elements = document.elementsFromPoint(
        pos.x + pos.width / 2,
        pos.y + pos.height / 2
      );
      return elements[0];
    }, position);

    if (element) {
      // TODO: element를 Locator로 변환
    }

    return null;
  }

  private async aiAnalyzeAndSuggest(
    page: Page,
    context: { original: string; description: string }
  ): Promise<SelectorStrategy | null> {
    const html = await page.content();

    const prompt = `HTML에서 "${context.description}" 요소를 찾기 위한 최적의 셀렉터를 제안해주세요.

원래 셀렉터 (더 이상 작동하지 않음): ${context.original}

HTML:
${html.slice(0, 5000)}

다음 JSON 형식으로 응답해주세요:
{
  "type": "testid" | "id" | "class" | "text" | "css",
  "value": "셀렉터 값",
  "confidence": 0.0 ~ 1.0,
  "reason": "선택 이유"
}

가장 안정적이고 명확한 셀렉터를 선택하세요.`;

    try {
      const response = await aiClient.generateText(prompt);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const suggestion = JSON.parse(jsonMatch[0]);
        return {
          type: suggestion.type,
          value: suggestion.value,
          confidence: suggestion.confidence,
        };
      }
    } catch (error) {
      console.error('[SelfHealing AI] 분석 실패:', error);
    }

    return null;
  }

  private learn(description: string, strategy: SelectorStrategy) {
    const existing = this.knowledgeBase.get(description) || [];

    // 중복 제거
    const filtered = existing.filter(s => s.value !== strategy.value);

    // 새 전략 추가
    filtered.push(strategy);

    // 신뢰도 순 정렬 및 상위 10개만 유지
    filtered.sort((a, b) => b.confidence - a.confidence);
    this.knowledgeBase.set(description, filtered.slice(0, 10));
  }

  private recordSuccess(description: string, selector: string) {
    const key = `${description}:${selector}`;
    const current = this.successRate.get(key) || 0;
    this.successRate.set(key, current + 1);

    // 성공률 기반 신뢰도 업데이트
    this.updateConfidence(description, selector);
  }

  private updateConfidence(description: string, selector: string) {
    const strategies = this.knowledgeBase.get(description);
    if (!strategies) return;

    const strategy = strategies.find(s => s.value === selector);
    if (strategy) {
      const successCount = this.successRate.get(`${description}:${selector}`) || 0;
      strategy.confidence = Math.min(0.95, 0.5 + successCount * 0.1);
    }
  }

  // 지식 저장/로드
  exportKnowledge(): string {
    return JSON.stringify({
      strategies: Array.from(this.knowledgeBase.entries()),
      successRates: Array.from(this.successRate.entries()),
    });
  }

  importKnowledge(data: string) {
    const parsed = JSON.parse(data);
    this.knowledgeBase = new Map(parsed.strategies);
    this.successRate = new Map(parsed.successRates);
  }
}
```

### 사용 예시

```typescript
import { test } from '@playwright/test';
import { AdvancedSelfHealingLocator } from '../ai/core/self-healing';

test('셀프힐링 로그인', async ({ page }) => {
  const healer = new AdvancedSelfHealingLocator();

  await page.goto('/login');

  const emailInput = await healer.find(page, {
    original: 'input[name="email"]',
    description: '이메일 입력 필드',
    visual: { x: 100, y: 200, width: 300, height: 40 },
  });

  await emailInput.fill('test@example.com');

  // 테스트 후 학습 데이터 저장
  const knowledge = healer.exportKnowledge();
  fs.writeFileSync('./tests/data/selector-knowledge.json', knowledge);
});
```

---

## AI 비주얼 검증

### 개요

픽셀 비교 + AI 시각적 분석으로 의미있는 UI 변경을 감지합니다.

### 고급 기능

#### 1. 영역별 비교

```typescript
export class AdvancedVisualValidator {
  async validateRegion(
    page: Page,
    region: { name: string; selector: string },
    options?: {
      threshold?: number;
      ignoreRegions?: string[]; // 무시할 영역 (광고, 시계 등)
    }
  ): Promise<VisualValidationResult> {
    const element = page.locator(region.selector);

    // 영역 스크린샷
    const screenshot = await element.screenshot();

    // 베이스라인과 비교
    // ...

    // AI 분석
    const analysis = await this.aiAnalyzeRegion(screenshot, region.name);

    return {
      isValid: analysis.verdict === 'pass',
      diffPercentage: 0.05,
      aiAnalysis: analysis,
    };
  }

  private async aiAnalyzeRegion(screenshot: Buffer, regionName: string) {
    const base64 = screenshot.toString('base64');

    const prompt = `다음은 "${regionName}" 영역의 스크린샷입니다.

다음 항목을 확인해주세요:
1. 텍스트가 잘리거나 겹치지 않는가?
2. 이미지가 올바르게 로드되었는가?
3. 버튼이나 입력 필드가 정상적으로 보이는가?
4. 레이아웃이 깨지지 않았는가?
5. 색상 대비가 적절한가? (접근성)

JSON 형식으로 응답:
{
  "verdict": "pass" | "fail",
  "issues": ["발견된 문제들"],
  "accessibility": {
    "colorContrast": "good" | "poor",
    "textReadability": "good" | "poor"
  }
}`;

    const response = await aiClient.analyzeImage(base64, prompt);

    // JSON 파싱
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return { verdict: 'unclear', issues: ['AI 분석 실패'] };
  }

  async compareTwoScreenshots(
    baseline: Buffer,
    current: Buffer,
    context: string
  ): Promise<{
    verdict: 'pass' | 'fail' | 'unclear';
    changes: string[];
    isIntentional: boolean;
  }> {
    const baselineBase64 = baseline.toString('base64');
    const currentBase64 = current.toString('base64');

    const prompt = `두 스크린샷을 비교하여 변경 사항을 분석해주세요.

컨텍스트: ${context}

첫 번째: 베이스라인 (이전 버전)
두 번째: 현재 (새 버전)

다음 질문에 답해주세요:
1. 어떤 변경 사항이 있나요?
2. 변경 사항이 의도적인 개선인가요, 아니면 버그인가요?
3. 사용자 경험에 부정적 영향을 주나요?

JSON 응답:
{
  "verdict": "pass" | "fail" | "unclear",
  "changes": ["변경 사항 목록"],
  "isIntentional": true | false,
  "reasoning": "판단 근거"
}`;

    // Claude는 멀티모달 지원
    // 두 이미지를 함께 전송하여 비교
    const response = await this.aiCompareImages(
      [
        { image: baselineBase64, label: 'Baseline' },
        { image: currentBase64, label: 'Current' },
      ],
      prompt
    );

    return response;
  }

  private async aiCompareImages(
    images: Array<{ image: string; label: string }>,
    prompt: string
  ) {
    // Anthropic Claude API를 통해 여러 이미지 비교
    // 구현 생략 (실제로는 Anthropic SDK 사용)
    return {
      verdict: 'pass' as const,
      changes: [],
      isIntentional: true,
    };
  }
}
```

#### 2. 반응형 테스트

```typescript
async validateResponsive(
  page: Page,
  screenshotName: string,
  viewports: Array<{ name: string; width: number; height: number }>
): Promise<Map<string, VisualValidationResult>> {
  const results = new Map();

  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });

    // 레이아웃 안정화 대기
    await page.waitForTimeout(500);

    const result = await this.validate(page, `${screenshotName}-${viewport.name}`, {
      threshold: 0.05,
      useAI: true,
      context: `${viewport.name} 뷰포트 (${viewport.width}x${viewport.height})`,
    });

    results.set(viewport.name, result);
  }

  return results;
}
```

---

## 이상 탐지

### 개요

테스트 실행 중 성능 저하, 메모리 누수, 비정상 패턴을 AI가 자동 감지합니다.

### 구현

```typescript
// tests/ai/core/anomaly-detector.ts

export interface PerformanceMetrics {
  pageLoadTime: number;
  firstContentfulPaint: number;
  timeToInteractive: number;
  memoryUsage: number;
  cpuUsage?: number;
  networkRequests: number;
  errorCount: number;
}

export class AnomalyDetector {
  private baseline: PerformanceMetrics | null = null;
  private history: PerformanceMetrics[] = [];

  async monitor(page: Page, testName: string): Promise<{
    metrics: PerformanceMetrics;
    anomalies: Array<{ type: string; severity: 'low' | 'medium' | 'high'; message: string }>;
  }> {
    // 메트릭 수집
    const metrics = await this.collectMetrics(page);

    // 베이스라인 로드 (없으면 생성)
    if (!this.baseline) {
      this.baseline = await this.loadBaseline(testName);
    }

    // 이상 탐지
    const anomalies = await this.detectAnomalies(metrics, this.baseline);

    // AI 분석 (이상이 발견된 경우)
    if (anomalies.length > 0) {
      const aiAnalysis = await this.aiAnalyzeAnomalies(metrics, this.baseline, anomalies);
      anomalies.push(...aiAnalysis);
    }

    // 히스토리 업데이트
    this.history.push(metrics);

    return { metrics, anomalies };
  }

  private async collectMetrics(page: Page): Promise<PerformanceMetrics> {
    const performanceData = await page.evaluate(() => {
      const perf = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');

      return {
        pageLoadTime: perf.loadEventEnd - perf.fetchStart,
        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
        timeToInteractive: perf.domInteractive - perf.fetchStart,
        // @ts-ignore
        memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
      };
    });

    // 네트워크 요청 수
    const requests = await page.evaluate(() => {
      return performance.getEntriesByType('resource').length;
    });

    // 콘솔 에러 수 (별도 리스너에서 추적)
    const errorCount = 0; // TODO: 에러 리스너 구현

    return {
      ...performanceData,
      networkRequests: requests,
      errorCount,
    };
  }

  private async detectAnomalies(
    current: PerformanceMetrics,
    baseline: PerformanceMetrics
  ): Promise<Array<{ type: string; severity: 'low' | 'medium' | 'high'; message: string }>> {
    const anomalies = [];

    // 페이지 로드 시간
    if (current.pageLoadTime > baseline.pageLoadTime * 2) {
      anomalies.push({
        type: 'performance',
        severity: 'high' as const,
        message: `페이지 로드 시간이 2배 증가: ${baseline.pageLoadTime}ms → ${current.pageLoadTime}ms`,
      });
    }

    // 메모리 사용량
    if (current.memoryUsage > baseline.memoryUsage * 1.5) {
      anomalies.push({
        type: 'memory',
        severity: 'medium' as const,
        message: `메모리 사용량 1.5배 증가: ${baseline.memoryUsage} → ${current.memoryUsage}`,
      });
    }

    // 네트워크 요청 급증
    if (current.networkRequests > baseline.networkRequests * 3) {
      anomalies.push({
        type: 'network',
        severity: 'medium' as const,
        message: `네트워크 요청 3배 증가: ${baseline.networkRequests} → ${current.networkRequests}`,
      });
    }

    // 에러 발생
    if (current.errorCount > baseline.errorCount) {
      anomalies.push({
        type: 'error',
        severity: 'high' as const,
        message: `콘솔 에러 증가: ${baseline.errorCount} → ${current.errorCount}`,
      });
    }

    return anomalies;
  }

  private async aiAnalyzeAnomalies(
    current: PerformanceMetrics,
    baseline: PerformanceMetrics,
    detectedAnomalies: any[]
  ) {
    const prompt = `다음 성능 메트릭 변화를 분석하고 근본 원인을 추론해주세요.

베이스라인:
${JSON.stringify(baseline, null, 2)}

현재:
${JSON.stringify(current, null, 2)}

감지된 이상:
${JSON.stringify(detectedAnomalies, null, 2)}

다음 질문에 답해주세요:
1. 가능한 근본 원인은 무엇인가요?
2. 즉시 조치가 필요한가요?
3. 해결 방법을 제안해주세요.

JSON 응답:
{
  "rootCauses": ["원인 1", "원인 2"],
  "urgency": "low" | "medium" | "high",
  "recommendations": ["권장 사항 1", "권장 사항 2"]
}`;

    try {
      const response = await aiClient.generateText(prompt);
      const jsonMatch = response.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0]);
        return analysis.rootCauses.map((cause: string, i: number) => ({
          type: 'ai-analysis',
          severity: analysis.urgency,
          message: `${cause} - 권장: ${analysis.recommendations[i] || '추가 조사 필요'}`,
        }));
      }
    } catch (error) {
      console.error('[Anomaly AI] 분석 실패:', error);
    }

    return [];
  }

  private async loadBaseline(testName: string): Promise<PerformanceMetrics> {
    // baseline 파일에서 로드
    const fs = require('fs');
    const baselineFile = `./tests/data/baselines/performance/${testName}.json`;

    if (fs.existsSync(baselineFile)) {
      return JSON.parse(fs.readFileSync(baselineFile, 'utf-8'));
    }

    // 기본값 반환
    return {
      pageLoadTime: 2000,
      firstContentfulPaint: 1000,
      timeToInteractive: 1500,
      memoryUsage: 50 * 1024 * 1024, // 50MB
      networkRequests: 20,
      errorCount: 0,
    };
  }
}
```

---

## 테스트 분석 및 리포팅

### AI 리포터

```typescript
// tests/ai/reporters/ai-reporter.ts

import type { Reporter, TestCase, TestResult, FullResult } from '@playwright/test/reporter';

class AIReporter implements Reporter {
  private failedTests: Array<{ test: TestCase; result: TestResult }> = [];

  onTestEnd(test: TestCase, result: TestResult) {
    if (result.status === 'failed') {
      this.failedTests.push({ test, result });
    }
  }

  async onEnd(result: FullResult) {
    if (this.failedTests.length === 0) {
      console.log('\n✅ 모든 테스트 통과! AI 분석 불필요\n');
      return;
    }

    console.log(`\n🤖 AI가 ${this.failedTests.length}개 실패 테스트 분석 중...\n`);

    for (const { test, result } of this.failedTests) {
      const analysis = await this.analyzeFailure(test, result);

      console.log(`\n📋 ${test.title}`);
      console.log(`   원인: ${analysis.rootCause}`);
      console.log(`   제안: ${analysis.suggestion}`);

      if (analysis.fixCode) {
        console.log(`   수정 코드:\n${analysis.fixCode}`);
      }
    }

    // 분석 결과를 파일로 저장
    const fs = require('fs');
    fs.writeFileSync(
      './test-results/ai-analysis.json',
      JSON.stringify(
        this.failedTests.map(({ test, result }) => ({
          title: test.title,
          error: result.error?.message,
          // ...
        })),
        null,
        2
      )
    );
  }

  private async analyzeFailure(test: TestCase, result: TestResult) {
    const errorMessage = result.error?.message || '';
    const stackTrace = result.error?.stack || '';

    const prompt = `다음 테스트 실패를 분석해주세요:

테스트: ${test.title}

에러 메시지:
${errorMessage}

스택 트레이스:
${stackTrace.slice(0, 1000)}

다음을 제공해주세요:
1. 근본 원인 (간결하게)
2. 수정 방법
3. 가능하다면 수정 코드 예시

JSON 응답:
{
  "rootCause": "원인",
  "suggestion": "수정 방법",
  "fixCode": "코드 예시 (선택)"
}`;

    try {
      const response = await aiClient.generateText(prompt);
      const jsonMatch = response.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('AI 분석 실패:', error);
    }

    return {
      rootCause: 'AI 분석 실패',
      suggestion: '수동 검토 필요',
    };
  }
}

export default AIReporter;
```

---

## 프롬프트 엔지니어링

### 효과적인 프롬프트 작성 원칙

1. **명확한 역할 정의**
```typescript
const prompt = `당신은 10년 경력의 QA 자동화 전문가이자 Playwright 마스터입니다.`;
```

2. **구체적인 요구사항**
```typescript
// ❌ 나쁨
"테스트 작성해줘"

// ✅ 좋음
"로그인 페이지에서 잘못된 비밀번호 입력 시 에러 메시지가 표시되는지 확인하는 Playwright 테스트를 작성해주세요. Page Object Model 패턴을 사용하고, data-testid 셀렉터를 우선하세요."
```

3. **예시 제공**
```typescript
const prompt = `다음 예시와 동일한 스타일로 테스트를 작성해주세요:

예시:
test('사용자 로그인', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('user@example.com', 'pass');
  await expect(page).toHaveURL('/dashboard');
});

이제 회원가입 테스트를 작성해주세요.`;
```

4. **출력 형식 지정**
```typescript
const prompt = `...

JSON 형식으로 응답해주세요:
{
  "verdict": "pass" | "fail",
  "reason": "이유",
  "confidence": 0.0 ~ 1.0
}`;
```

5. **제약 조건 명시**
```typescript
const prompt = `...

제약 조건:
- 코드 블록 마커(```) 사용 금지
- 주석 최소화
- 200줄 이하로 작성`;
```

---

**다음 단계**: [ARCHITECTURE.md](./ARCHITECTURE.md)에서 시스템 아키텍처 확인
