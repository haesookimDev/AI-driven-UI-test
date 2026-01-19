# XGEN E2E 테스트 아키텍처

> AI 기반 테스트 자동화 시스템의 기술 아키텍처 및 설계 문서

## 📋 목차

1. [시스템 개요](#시스템-개요)
2. [아키텍처 다이어그램](#아키텍처-다이어그램)
3. [주요 컴포넌트](#주요-컴포넌트)
4. [데이터 플로우](#데이터-플로우)
5. [AI 파이프라인](#ai-파이프라인)
6. [확장성 및 성능](#확장성-및-성능)
7. [보안 고려사항](#보안-고려사항)

---

## 시스템 개요

### 목표

XGEN 플랫폼에 대한 **지능형 E2E 테스트 자동화 시스템**을 구축하여:
- 테스트 작성 시간 50% 단축
- 유지보수 비용 70% 절감
- 버그 탐지율 30% 향상
- AI 기반 자동 복구로 Flaky 테스트 90% 감소

### 핵심 기술 스택

```
┌─────────────────────────────────────────┐
│         AI-Driven Test Framework        │
├─────────────────────────────────────────┤
│  Playwright    TypeScript    Node.js    │
│  Claude AI     OpenAI        Pixelmatch │
│  Sharp         Zod           Allure     │
└─────────────────────────────────────────┘
```

---

## 아키텍처 다이어그램

### 전체 시스템 아키텍처

```
┌──────────────────────────────────────────────────────────────────┐
│                          XGEN Frontend                            │
│                    (Next.js 15 Application)                       │
└────────────────┬─────────────────────────────────────────────────┘
                 │
                 │ HTTP/WS
                 │
┌────────────────▼─────────────────────────────────────────────────┐
│                   E2E Test Framework Layer                        │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │   Test      │  │    Page      │  │      Fixtures        │   │
│  │   Specs     │─▶│   Objects    │◀─│   (Auth, Data)       │   │
│  └─────────────┘  └──────────────┘  └──────────────────────┘   │
│         │                  │                                     │
│         └──────────────────┼─────────────────────────────┐      │
│                            │                             │      │
│                            ▼                             ▼      │
│         ┌─────────────────────────────┐   ┌────────────────────┐│
│         │    AI Enhancement Layer     │   │   Playwright Core  ││
│         └─────────────────────────────┘   └────────────────────┘│
└───────────────────────────────────────────────────────────────────┘
                            │
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐  ┌────────────────┐  ┌────────────────┐
│  AI Test Gen  │  │  Self-Healing  │  │ Visual Verify  │
│  (Claude API) │  │   (AI Locator) │  │ (Image + AI)   │
└───────────────┘  └────────────────┘  └────────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                            ▼
                ┌───────────────────────┐
                │   Learning Database   │
                │  (Selector Knowledge) │
                └───────────────────────┘
```

### AI 통합 아키텍처

```
┌────────────────────────────────────────────────────────────────┐
│                      AI Integration Layer                       │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐         ┌──────────────┐                    │
│  │  AI Client   │         │ Prompt Mgmt  │                    │
│  │  (Unified)   │────────▶│  (Templates) │                    │
│  └──────────────┘         └──────────────┘                    │
│         │                                                       │
│         ├─────────┬──────────┬──────────┬──────────┐          │
│         │         │          │          │          │          │
│         ▼         ▼          ▼          ▼          ▼          │
│  ┌──────────┐ ┌──────┐ ┌────────┐ ┌────────┐ ┌────────┐     │
│  │   Test   │ │ Self │ │ Visual │ │Anomaly │ │Reporter│     │
│  │Generator │ │Healer│ │Validator│ │Detector│ │Analyzer│     │
│  └──────────┘ └──────┘ └────────┘ └────────┘ └────────┘     │
│         │         │          │          │          │          │
│         └─────────┴──────────┴──────────┴──────────┘          │
│                            │                                   │
│                            ▼                                   │
│              ┌──────────────────────────┐                     │
│              │  Anthropic Claude API    │                     │
│              │  (Primary - Multimodal)  │                     │
│              └──────────────────────────┘                     │
│                            │                                   │
│                            │ Fallback                          │
│                            ▼                                   │
│              ┌──────────────────────────┐                     │
│              │     OpenAI GPT API       │                     │
│              │     (Secondary)          │                     │
│              └──────────────────────────┘                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 주요 컴포넌트

### 1. Test Execution Layer

#### Playwright Test Runner
```typescript
// 역할: 테스트 실행 및 브라우저 자동화
// 위치: @playwright/test

기능:
- 멀티 브라우저 테스트 (Chromium, Firefox, WebKit)
- 병렬 실행
- 자동 재시도
- 스크린샷/비디오 캡처
- 트레이싱
```

#### Test Specs
```typescript
// 역할: 실제 테스트 시나리오 정의
// 위치: tests/e2e/specs/**/*.spec.ts

구조:
- auth/: 인증 테스트
- canvas/: 워크플로우 캔버스 테스트
- chatbot/: 챗봇 테스트
- admin/: 관리자 기능 테스트
- main/: 관리 센터 테스트
```

#### Page Objects
```typescript
// 역할: UI 추상화 및 재사용성
// 위치: tests/e2e/pages/

패턴:
export class CanvasPage {
  constructor(page: Page);

  // 내비게이션
  async goto(): Promise<void>;

  // 액션
  async addNode(type: string): Promise<void>;
  async connectNodes(source: string, target: string): Promise<void>;

  // 검증
  async getNodeCount(): Promise<number>;
}
```

### 2. AI Enhancement Layer

#### AI Client (Unified Interface)

```typescript
// tests/ai/core/ai-client.ts

export class AIClient {
  // 텍스트 생성
  async generateText(prompt: string): Promise<string>;

  // 이미지 분석 (멀티모달)
  async analyzeImage(image: string, prompt: string): Promise<string>;

  // 여러 이미지 비교
  async compareImages(images: string[], prompt: string): Promise<any>;

  // 구조화된 출력 (JSON)
  async generateStructured<T>(prompt: string, schema: ZodSchema<T>): Promise<T>;
}

계층 구조:
┌────────────────────┐
│    AIClient        │
└────────────────────┘
          │
    ┌─────┴─────┐
    │           │
┌───▼────┐ ┌───▼────┐
│Anthropic│ │ OpenAI │
└─────────┘ └────────┘
```

#### Test Generator

```typescript
// tests/ai/core/test-generator.ts

export class AITestGenerator {
  // 자연어 → 테스트 코드
  async generateTest(description: string, context?: Context): Promise<string>;

  // 페이지 분석 기반 생성
  async generateFromPage(page: Page, description: string): Promise<string>;

  // 버그 리포트 → 재현 테스트
  async generateFromBugReport(bug: BugReport): Promise<string>;

  // 사용자 플로우 → 테스트
  async generateFromUserFlow(steps: string[]): Promise<string>;
}

워크플로우:
자연어 설명
    │
    ▼
프롬프트 생성 (템플릿 + 컨텍스트)
    │
    ▼
AI API 호출 (Claude/GPT)
    │
    ▼
응답 파싱 및 정제
    │
    ▼
코드 검증 (ESLint, TypeScript)
    │
    ▼
테스트 코드 반환
```

#### Self-Healing Locator

```typescript
// tests/ai/core/self-healing.ts

export class SelfHealingLocator {
  // 멀티 전략 셀렉터 찾기
  async find(page: Page, context: SelectorContext): Promise<Locator>;

  private async tryOriginal(): Promise<Locator | null>;
  private async tryLearned(): Promise<Locator | null>;
  private async tryFallbacks(): Promise<Locator | null>;
  private async aiSuggest(): Promise<Locator | null>;

  // 학습
  private learn(description: string, selector: SelectorStrategy): void;

  // 지식 저장/로드
  exportKnowledge(): string;
  importKnowledge(data: string): void;
}

전략 우선순위:
1. 원본 셀렉터 (fastest)
2. 학습된 셀렉터 (knowledge base)
3. 폴백 셀렉터 (predefined)
4. AI 제안 (smartest, slowest)
```

#### Visual Validator

```typescript
// tests/ai/core/visual-validator.ts

export class VisualValidator {
  // 비주얼 검증 파이프라인
  async validate(
    page: Page,
    name: string,
    options?: ValidationOptions
  ): Promise<ValidationResult>;

  private async pixelCompare(): Promise<number>; // Pixelmatch
  private async aiAnalyze(): Promise<AIVerdict>; // Claude Vision

  // 영역별 검증
  async validateRegion(selector: string): Promise<ValidationResult>;

  // 반응형 검증
  async validateResponsive(viewports: Viewport[]): Promise<Map<string, ValidationResult>>;
}

파이프라인:
스크린샷 캡처
    │
    ▼
베이스라인과 픽셀 비교 (pixelmatch)
    │
    ├─▶ 차이 < 임계값 → ✅ Pass
    │
    └─▶ 차이 ≥ 임계값
            │
            ▼
        AI 이미지 분석 (Claude Vision)
            │
            ├─▶ 의도적 변경 → ✅ Pass
            └─▶ 버그 가능성 → ❌ Fail
```

#### Anomaly Detector

```typescript
// tests/ai/core/anomaly-detector.ts

export class AnomalyDetector {
  // 성능 모니터링
  async monitor(page: Page, testName: string): Promise<MonitorResult>;

  private collectMetrics(): Promise<PerformanceMetrics>;
  private detectAnomalies(current: Metrics, baseline: Metrics): Anomaly[];
  private aiAnalyze(anomalies: Anomaly[]): Promise<AIInsight>;
}

메트릭 수집:
- 페이지 로드 시간
- First Contentful Paint
- Time to Interactive
- 메모리 사용량
- 네트워크 요청 수
- 콘솔 에러 수

이상 탐지 로직:
if (current.loadTime > baseline.loadTime * 2) → 알림
if (current.memory > baseline.memory * 1.5) → 알림
if (current.errors > baseline.errors) → 알림

AI 분석:
메트릭 + 이상 → AI → 근본 원인 추론 + 해결책 제안
```

### 3. Data & Storage Layer

#### Learning Database

```typescript
// tests/ai/utils/learning-db.ts

export class LearningDatabase {
  private selectorKnowledge: Map<string, SelectorStrategy[]>;
  private performanceBaselines: Map<string, PerformanceMetrics>;
  private visualBaselines: Map<string, Buffer>;

  // CRUD
  save(key: string, value: any): void;
  load(key: string): any;

  // 영속성
  persist(filePath: string): void;
  restore(filePath: string): void;
}

저장 구조:
tests/data/
├── selector-knowledge.json      # 셀프힐링 학습 데이터
├── performance-baseline.json    # 성능 베이스라인
└── baselines/
    └── screenshots/             # 비주얼 베이스라인
        ├── canvas-default.png
        ├── canvas-with-nodes.png
        └── ...
```

#### Fixtures

```typescript
// tests/e2e/fixtures/

// 인증 픽스처
export const test = base.extend<AuthFixture>({
  authenticatedPage: async ({ page }, use) => {
    // 로그인 수행
    await login(page);
    await use(page);
  },
});

// 데이터 픽스처
export const workflowFixture = {
  simpleWorkflow: { nodes: [...], edges: [...] },
  ragWorkflow: { nodes: [...], edges: [...] },
};
```

### 4. Reporting Layer

#### AI Reporter

```typescript
// tests/ai/reporters/ai-reporter.ts

export class AIReporter implements Reporter {
  onTestEnd(test: TestCase, result: TestResult): void;

  async onEnd(fullResult: FullResult): Promise<void> {
    // 실패한 테스트 AI 분석
    for (const failed of this.failedTests) {
      const analysis = await this.analyzeFailure(failed);
      console.log(analysis);
    }

    // 리포트 생성
    this.generateReport();
  }

  private async analyzeFailure(test): Promise<FailureAnalysis>;
}

리포트 출력:
- HTML 리포트 (Playwright 기본)
- JSON 리포트 (CI/CD 파싱용)
- AI 분석 리포트 (실패 원인 + 해결책)
- Allure 리포트 (엔터프라이즈급)
```

---

## 데이터 플로우

### 일반 테스트 실행 플로우

```
1. 테스트 시작
   │
   ▼
2. Playwright가 브라우저 실행
   │
   ▼
3. Page Object를 통해 UI 조작
   │
   ▼
4. Assertion 검증
   │
   ├─▶ ✅ Pass → 다음 테스트
   │
   └─▶ ❌ Fail → 5단계

5. 실패 처리
   │
   ├─▶ 스크린샷/비디오 캡처
   ├─▶ 트레이스 수집
   └─▶ AI 분석 트리거

6. AI 분석
   │
   ├─▶ 에러 메시지 분석
   ├─▶ 스택 트레이스 분석
   └─▶ 근본 원인 추론

7. 리포트 생성
```

### AI 테스트 생성 플로우

```
1. 자연어 설명 입력
   "사용자가 로그인 후 워크플로우 생성"
   │
   ▼
2. 컨텍스트 수집
   │
   ├─▶ 페이지 HTML (선택)
   ├─▶ 기존 테스트 스타일 (선택)
   └─▶ Page Object 목록

3. 프롬프트 생성
   │
   ▼
4. AI API 호출 (Claude/GPT)
   │
   ▼
5. 응답 파싱
   │
   ├─▶ 코드 블록 추출
   ├─▶ import 문 확인
   └─▶ 문법 검증

6. 코드 정제
   │
   ├─▶ ESLint 실행
   ├─▶ Prettier 포맷팅
   └─▶ TypeScript 컴파일 확인

7. 테스트 파일 생성
   │
   ▼
8. (선택) 즉시 실행하여 검증
```

### 셀프힐링 플로우

```
1. 원본 셀렉터로 요소 찾기 시도
   button[data-testid="save"]
   │
   └─▶ ❌ 실패 (요소 없음)

2. 학습 DB에서 검색
   "저장 버튼" → ['button:has-text("저장")', ...]
   │
   ├─▶ 각 학습된 셀렉터 시도
   │   │
   │   └─▶ ✅ 성공 → 신뢰도 증가 → 반환
   │
   └─▶ 모두 실패 → 3단계

3. 폴백 셀렉터 시도
   ['button.save-button', 'header button >> nth=2']
   │
   ├─▶ ✅ 성공 → 학습 DB에 저장 → 반환
   │
   └─▶ 모두 실패 → 4단계

4. AI에게 요청
   │
   ├─▶ 페이지 HTML 전송
   ├─▶ "저장 버튼을 찾는 셀렉터 제안해줘"
   └─▶ AI 응답: 'button[aria-label="워크플로우 저장"]'

5. AI 제안 셀렉터 시도
   │
   ├─▶ ✅ 성공 → 학습 DB에 저장 (높은 신뢰도) → 반환
   │
   └─▶ ❌ 실패 → Error 발생
```

### 비주얼 검증 플로우

```
1. 페이지 스크린샷 캡처
   │
   ▼
2. 베이스라인 로드
   │
   ├─▶ 베이스라인 없음 → 현재를 베이스라인으로 저장 → ✅ Pass
   │
   └─▶ 베이스라인 있음 → 3단계

3. 픽셀 비교 (Pixelmatch)
   │
   ├─▶ 차이 < 5% → ✅ Pass
   │
   └─▶ 차이 ≥ 5% → 4단계

4. Diff 이미지 생성 및 저장
   │
   ▼
5. AI 비주얼 분석
   │
   ├─▶ 베이스라인 이미지 → AI
   ├─▶ 현재 이미지 → AI
   └─▶ "변경이 버그인지 의도적인지 판단해줘"

6. AI 판정
   │
   ├─▶ "의도적 변경 (디자인 개선)" → ✅ Pass (베이스라인 업데이트 제안)
   ├─▶ "버그 가능성 (텍스트 잘림)" → ❌ Fail
   └─▶ "불확실" → ⚠️  Manual Review
```

---

## AI 파이프라인

### 프롬프트 관리

```typescript
// tests/ai/models/prompts/

// 프롬프트 템플릿 구조
export interface PromptTemplate {
  system: string;         // 시스템 프롬프트 (역할 정의)
  user: (context: any) => string;  // 사용자 프롬프트 (동적 생성)
  examples?: Array<{ input: string; output: string }>;  // Few-shot examples
}

// 버전 관리
export const TEST_GENERATION_PROMPT_V2 = {
  system: `당신은 QA 자동화 전문가입니다...`,
  user: (ctx) => `테스트 설명: ${ctx.description}...`,
  examples: [
    { input: "로그인 테스트", output: "test('로그인', ..." },
  ],
};
```

### AI 응답 검증

```typescript
// tests/ai/utils/response-validator.ts

import { z } from 'zod';

// 스키마 정의
const SelectorSuggestionSchema = z.object({
  type: z.enum(['testid', 'id', 'class', 'text', 'css']),
  value: z.string(),
  confidence: z.number().min(0).max(1),
  reason: z.string().optional(),
});

// 검증 함수
export async function validateAIResponse<T>(
  response: string,
  schema: z.ZodSchema<T>
): Promise<T> {
  // JSON 추출
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('AI 응답에 JSON 없음');
  }

  const parsed = JSON.parse(jsonMatch[0]);

  // 스키마 검증
  return schema.parse(parsed);
}
```

### 비용 최적화

```typescript
// tests/config/ai.config.ts

export const AIOptimization = {
  // 캐싱: 동일한 요청은 캐시 사용
  cache: {
    enabled: true,
    ttl: 3600, // 1시간
  },

  // 모델 선택: 작업별 최적 모델
  modelSelection: {
    testGeneration: 'claude-3-5-sonnet', // 복잡한 작업
    selectorHealing: 'claude-3-haiku',   // 간단한 작업 (저렴)
    visualAnalysis: 'claude-3-5-sonnet', // 이미지 분석
  },

  // 배치 처리: 여러 요청을 한 번에
  batching: {
    enabled: true,
    maxBatchSize: 5,
    timeout: 1000, // 1초 대기 후 배치 전송
  },

  // 로컬 우선: AI 호출 전 로컬 처리 시도
  localFirst: true,
};

예상 비용 (월 1000 테스트 실행 기준):
- 테스트 생성: $20 (100개 생성, Claude Sonnet)
- 셀프힐링: $5 (200회 호출, Claude Haiku)
- 비주얼 검증: $30 (150회 분석, Claude Sonnet Vision)
- 총: ~$55/월
```

---

## 확장성 및 성능

### 병렬 실행

```typescript
// playwright.config.ts

export default defineConfig({
  workers: process.env.CI ? 4 : undefined, // CI: 4개 워커, 로컬: CPU 코어 수
  fullyParallel: true,

  // 샤딩 (대규모 테스트 스위트)
  shard: process.env.SHARD ? {
    current: parseInt(process.env.SHARD_INDEX || '1'),
    total: parseInt(process.env.SHARD_TOTAL || '1'),
  } : undefined,
});

// CI에서 샤딩 사용
// Job 1: SHARD_INDEX=1 SHARD_TOTAL=3
// Job 2: SHARD_INDEX=2 SHARD_TOTAL=3
// Job 3: SHARD_INDEX=3 SHARD_TOTAL=3
```

### 캐싱 전략

```typescript
// tests/ai/utils/cache.ts

export class AICache {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private ttl: number = 3600000; // 1시간

  async get<T>(key: string): Promise<T | null> {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  set(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  // 파일 기반 영속성
  persist(filePath: string): void {
    fs.writeFileSync(filePath, JSON.stringify([...this.cache.entries()]));
  }
}

// 사용
const cacheKey = hashPrompt(prompt);
const cached = await aiCache.get<string>(cacheKey);
if (cached) return cached;

const result = await aiClient.generateText(prompt);
aiCache.set(cacheKey, result);
```

### 성능 목표

```
- 테스트 실행 시간: < 5분 (전체 스위트)
- 셀프힐링 오버헤드: < 2초/테스트
- AI 응답 시간: < 3초 (캐시 미스)
- 비주얼 검증: < 5초/스크린샷
```

---

## 보안 고려사항

### API 키 관리

```typescript
// .env.test (Git에 커밋 금지)
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

// CI/CD에서는 환경변수로 주입
# GitHub Actions
env:
  ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

### 민감 데이터 보호

```typescript
// tests/utils/sanitizer.ts

export function sanitizeForAI(html: string): string {
  return html
    .replace(/data-user-id="[^"]+"/g, 'data-user-id="***"')
    .replace(/api-key="[^"]+"/g, 'api-key="***"')
    .replace(/token="[^"]+"/g, 'token="***"');
}

// AI에게 전송 전 민감 데이터 제거
const safeHtml = sanitizeForAI(await page.content());
await aiClient.generateText(prompt + '\n' + safeHtml);
```

### 네트워크 격리

```
테스트 환경은 프로덕션과 격리:
- 별도 API 엔드포인트 사용
- 테스트 전용 데이터베이스
- Mock 서버 활용 (MSW)
```

---

## 다이어그램 요약

### 컴포넌트 간 상호작용

```
┌─────────────┐
│   Test Spec │
└──────┬──────┘
       │
       │ uses
       ▼
┌─────────────┐     ┌──────────────┐
│ Page Object │────▶│ Self-Healing │
└──────┬──────┘     │   Locator    │
       │            └──────┬───────┘
       │                   │
       │ validates         │ learns
       ▼                   ▼
┌─────────────┐     ┌──────────────┐
│   Visual    │────▶│  Learning DB │
│  Validator  │     └──────────────┘
└──────┬──────┘
       │
       │ analyzes
       ▼
┌─────────────┐
│ AI Reporter │
└─────────────┘
```

---

**이 아키텍처를 기반으로 XGEN AI-Driven E2E 테스트 프레임워크를 구축하세요!**

다음: [README.md](./README.md)로 돌아가 프로젝트 시작하기
