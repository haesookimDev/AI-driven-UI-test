# XGEN AI-Driven E2E 테스트 개발 가이드

> Playwright + AI 기반 테스트 자동화 프레임워크 구축 가이드

## 📋 목차

1. [시작하기](#시작하기)
2. [프로젝트 설정](#프로젝트-설정)
3. [기본 테스트 작성](#기본-테스트-작성)
4. [AI 기능 통합](#ai-기능-통합)
5. [Page Object Model](#page-object-model)
6. [픽스처 활용](#픽스처-활용)
7. [CI/CD 통합](#cicd-통합)
8. [베스트 프랙티스](#베스트-프랙티스)

---

## 시작하기

### 1단계: 프로젝트 초기화

```bash
cd xgen-frontend

# 테스트 디렉토리 생성
mkdir -p tests/{e2e/{specs/{auth,canvas,chatbot,admin,main},fixtures,pages},ai/{core,models/{prompts},utils,reporters},config,utils,data}

# Playwright 및 AI 패키지 설치
npm install --save-dev \
  @playwright/test@^1.48.0 \
  @anthropic-ai/sdk@^0.30.0 \
  openai@^4.75.0 \
  pixelmatch@^6.0.0 \
  sharp@^0.33.0 \
  zod@^3.22.0 \
  allure-playwright@^2.25.0

# Playwright 브라우저 설치
npx playwright install
```

### 2단계: 환경 변수 설정

`.env.test` 파일 생성:

```bash
# AI API Keys
ANTHROPIC_API_KEY=sk-ant-your-api-key
OPENAI_API_KEY=sk-your-openai-key

# Test Environment
TEST_BASE_URL=http://localhost:3000
TEST_TIMEOUT=60000
TEST_HEADLESS=false

# AI Features Toggle
ENABLE_AI_TEST_GENERATION=true
ENABLE_SELF_HEALING=true
ENABLE_AI_VISUAL_VALIDATION=true
ENABLE_ANOMALY_DETECTION=true

# AI Model Settings
AI_MODEL=claude-3-5-sonnet-20241022
AI_MODEL_FALLBACK=gpt-4-turbo-preview
AI_MAX_TOKENS=4000
AI_TEMPERATURE=0.3

# Visual Testing
VISUAL_DIFF_THRESHOLD=0.05
VISUAL_UPDATE_BASELINE=false

# Performance
PERF_BASELINE_FILE=./tests/data/performance-baseline.json
```

---

## 프로젝트 설정

### Playwright 설정 (`tests/config/playwright.config.ts`)

```typescript
import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

// 테스트 환경변수 로드
dotenv.config({ path: '.env.test' });

export default defineConfig({
  // 테스트 디렉토리
  testDir: '../e2e/specs',

  // 테스트 파일 패턴
  testMatch: '**/*.spec.ts',

  // 병렬 실행
  fullyParallel: true,
  workers: process.env.CI ? 2 : undefined,

  // 재시도 정책
  retries: process.env.CI ? 2 : 0,

  // 타임아웃
  timeout: parseInt(process.env.TEST_TIMEOUT || '60000'),

  // 글로벌 설정
  use: {
    baseURL: process.env.TEST_BASE_URL || 'http://localhost:3000',

    // 스크린샷
    screenshot: 'only-on-failure',

    // 비디오
    video: 'retain-on-failure',

    // 트레이스
    trace: 'on-first-retry',

    // 헤드리스 모드
    headless: process.env.TEST_HEADLESS === 'true',

    // 뷰포트
    viewport: { width: 1920, height: 1080 },

    // 내비게이션 타임아웃
    navigationTimeout: 30000,

    // 액션 타임아웃
    actionTimeout: 10000,
  },

  // 브라우저 프로젝트
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // AI 기능 활성화
        contextOptions: {
          recordVideo: process.env.ENABLE_ANOMALY_DETECTION === 'true'
            ? { dir: './test-results/videos' }
            : undefined,
        },
      },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    // 모바일 테스트 (선택사항)
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  // 리포터
  reporter: [
    ['html', { outputFolder: '../playwright-report' }],
    ['json', { outputFile: '../test-results/results.json' }],
    ['list'],
    // AI 분석 리포터 (커스텀)
    ['../ai/reporters/ai-reporter.ts'],
  ],

  // 웹서버 (개발 서버 자동 시작)
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

### AI 설정 (`tests/config/ai.config.ts`)

```typescript
import { z } from 'zod';

export const AIConfig = {
  // 메인 모델
  primaryModel: {
    provider: 'anthropic',
    model: process.env.AI_MODEL || 'claude-3-5-sonnet-20241022',
    maxTokens: parseInt(process.env.AI_MAX_TOKENS || '4000'),
    temperature: parseFloat(process.env.AI_TEMPERATURE || '0.3'),
  },

  // 폴백 모델
  fallbackModel: {
    provider: 'openai',
    model: process.env.AI_MODEL_FALLBACK || 'gpt-4-turbo-preview',
    maxTokens: 4000,
    temperature: 0.3,
  },

  // 기능 토글
  features: {
    testGeneration: process.env.ENABLE_AI_TEST_GENERATION === 'true',
    selfHealing: process.env.ENABLE_SELF_HEALING === 'true',
    visualValidation: process.env.ENABLE_AI_VISUAL_VALIDATION === 'true',
    anomalyDetection: process.env.ENABLE_ANOMALY_DETECTION === 'true',
  },

  // 비주얼 테스팅 설정
  visual: {
    threshold: parseFloat(process.env.VISUAL_DIFF_THRESHOLD || '0.05'),
    updateBaseline: process.env.VISUAL_UPDATE_BASELINE === 'true',
    baselinePath: './tests/data/baselines/screenshots',
  },

  // 성능 설정
  performance: {
    baselineFile: process.env.PERF_BASELINE_FILE || './tests/data/performance-baseline.json',
    alertThreshold: 2.0, // 2배 느려지면 알림
  },
} as const;

// 설정 검증 스키마
export const AIConfigSchema = z.object({
  primaryModel: z.object({
    provider: z.enum(['anthropic', 'openai']),
    model: z.string(),
    maxTokens: z.number().positive(),
    temperature: z.number().min(0).max(1),
  }),
  // ... 나머지 검증
});

// 타입 추론
export type AIConfigType = typeof AIConfig;
```

---

## 기본 테스트 작성

### 간단한 로그인 테스트

`tests/e2e/specs/auth/login.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('로그인 기능', () => {
  test('정상 로그인', async ({ page }) => {
    // 페이지 이동
    await page.goto('/login');

    // 로그인 폼 작성
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');

    // 로그인 버튼 클릭
    await page.click('button[type="submit"]');

    // 리디렉션 확인
    await expect(page).toHaveURL('/main');

    // 사용자 정보 표시 확인
    await expect(page.locator('[data-testid="user-profile"]')).toBeVisible();
  });

  test('잘못된 자격증명', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="email"]', 'wrong@example.com');
    await page.fill('input[name="password"]', 'wrongpass');
    await page.click('button[type="submit"]');

    // 에러 메시지 확인
    await expect(page.locator('.error-message')).toContainText('이메일 또는 비밀번호가 올바르지 않습니다');
  });
});
```

### Page Object Pattern으로 리팩토링

`tests/e2e/pages/LoginPage.ts`:

```typescript
import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('input[name="email"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.submitButton = page.locator('button[type="submit"]');
    this.errorMessage = page.locator('.error-message');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async getErrorMessage() {
    return await this.errorMessage.textContent();
  }
}
```

사용:

```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

test('정상 로그인 - Page Object 사용', async ({ page }) => {
  const loginPage = new LoginPage(page);

  await loginPage.goto();
  await loginPage.login('test@example.com', 'password123');

  await expect(page).toHaveURL('/main');
});
```

---

## AI 기능 통합

### 1. AI 클라이언트 구현

`tests/ai/core/ai-client.ts`:

```typescript
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { AIConfig } from '../../config/ai.config';

export class AIClient {
  private anthropic: Anthropic | null = null;
  private openai: OpenAI | null = null;

  constructor() {
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
    }

    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
  }

  async generateText(prompt: string, usePrimary = true): Promise<string> {
    const config = usePrimary ? AIConfig.primaryModel : AIConfig.fallbackModel;

    try {
      if (config.provider === 'anthropic' && this.anthropic) {
        const message = await this.anthropic.messages.create({
          model: config.model,
          max_tokens: config.maxTokens,
          temperature: config.temperature,
          messages: [{ role: 'user', content: prompt }],
        });

        const textBlock = message.content.find(block => block.type === 'text');
        return textBlock?.type === 'text' ? textBlock.text : '';
      } else if (config.provider === 'openai' && this.openai) {
        const completion = await this.openai.chat.completions.create({
          model: config.model,
          max_tokens: config.maxTokens,
          temperature: config.temperature,
          messages: [{ role: 'user', content: prompt }],
        });

        return completion.choices[0]?.message?.content || '';
      }
    } catch (error) {
      console.error('AI generation failed:', error);
      // 폴백 시도
      if (usePrimary) {
        return this.generateText(prompt, false);
      }
      throw error;
    }

    throw new Error('No AI provider available');
  }

  async analyzeImage(imageBase64: string, prompt: string): Promise<string> {
    if (!this.anthropic) {
      throw new Error('Anthropic client required for image analysis');
    }

    const message = await this.anthropic.messages.create({
      model: AIConfig.primaryModel.model,
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/png',
              data: imageBase64,
            },
          },
          { type: 'text', text: prompt },
        ],
      }],
    });

    const textBlock = message.content.find(block => block.type === 'text');
    return textBlock?.type === 'text' ? textBlock.text : '';
  }
}

// 싱글톤 인스턴스
export const aiClient = new AIClient();
```

### 2. AI 테스트 생성기

`tests/ai/core/test-generator.ts`:

```typescript
import { aiClient } from './ai-client';
import { testGenerationPrompt } from '../models/prompts/test-generation';

export class AITestGenerator {
  async generateTest(description: string, context?: {
    pageUrl?: string;
    pageHtml?: string;
    existingTests?: string[];
  }): Promise<string> {
    const prompt = testGenerationPrompt({
      description,
      pageUrl: context?.pageUrl,
      pageHtml: context?.pageHtml,
      existingTests: context?.existingTests,
    });

    const testCode = await aiClient.generateText(prompt);

    // 생성된 코드 검증 및 정제
    return this.cleanupGeneratedCode(testCode);
  }

  async generateFromBugReport(
    issueNumber: string,
    issueDescription: string
  ): Promise<string> {
    const prompt = `다음 버그 리포트를 재현하는 Playwright 테스트를 작성해주세요:

Issue #${issueNumber}
${issueDescription}

다음을 포함해주세요:
1. 버그 재현 단계
2. 예상 동작과 실제 동작 비교
3. 적절한 assertion
4. Page Object Model 패턴 사용

TypeScript로 작성해주세요.`;

    return await aiClient.generateText(prompt);
  }

  private cleanupGeneratedCode(code: string): string {
    // 코드 블록 마크다운 제거
    let cleaned = code.replace(/```typescript\n?/g, '').replace(/```\n?/g, '');

    // 불필요한 주석 제거
    cleaned = cleaned.replace(/\/\/ AI generated.*\n/g, '');

    return cleaned.trim();
  }
}

export const testGenerator = new AITestGenerator();
```

`tests/ai/models/prompts/test-generation.ts`:

```typescript
export const testGenerationPrompt = (context: {
  description: string;
  pageUrl?: string;
  pageHtml?: string;
  existingTests?: string[];
}) => {
  return `당신은 Playwright 테스트 전문가입니다. 다음 요구사항에 맞는 E2E 테스트를 작성해주세요.

테스트 요구사항:
${context.description}

${context.pageUrl ? `페이지 URL: ${context.pageUrl}` : ''}

${context.pageHtml ? `페이지 HTML 구조:\n${context.pageHtml.slice(0, 2000)}` : ''}

${context.existingTests?.length ? `\n기존 테스트 참고:\n${context.existingTests.join('\n')}` : ''}

다음 규칙을 따라주세요:
1. Page Object Model 패턴 사용
2. 의미있는 test 이름 (한글 가능)
3. 명확한 assertion 사용
4. 적절한 타임아웃 설정
5. 에러 처리 포함
6. data-testid 선호, 없으면 다른 셀렉터 사용
7. TypeScript로 작성
8. @playwright/test 사용

테스트 코드만 반환해주세요 (설명 불필요):`;
};
```

### 3. 셀프힐링 셀렉터

`tests/ai/core/self-healing.ts`:

```typescript
import { Page, Locator } from '@playwright/test';
import { aiClient } from './ai-client';

interface SelectorContext {
  original: string;
  description: string;
  fallbacks?: string[];
}

export class SelfHealingLocator {
  private learningDB: Map<string, string[]> = new Map();

  async find(page: Page, context: SelectorContext): Promise<Locator> {
    // 1. 원본 셀렉터 시도
    try {
      const locator = page.locator(context.original);
      await locator.waitFor({ timeout: 5000 });
      return locator;
    } catch (error) {
      console.log(`[SelfHealing] 원본 셀렉터 실패: ${context.original}`);
    }

    // 2. 학습된 셀렉터 시도
    const learned = this.learningDB.get(context.description);
    if (learned) {
      for (const selector of learned) {
        try {
          const locator = page.locator(selector);
          await locator.waitFor({ timeout: 3000 });
          console.log(`[SelfHealing] 학습된 셀렉터 성공: ${selector}`);
          return locator;
        } catch {}
      }
    }

    // 3. 폴백 셀렉터 시도
    if (context.fallbacks) {
      for (const fallback of context.fallbacks) {
        try {
          const locator = page.locator(fallback);
          await locator.waitFor({ timeout: 3000 });
          console.log(`[SelfHealing] 폴백 셀렉터 성공: ${fallback}`);
          this.learn(context.description, fallback);
          return locator;
        } catch {}
      }
    }

    // 4. AI에게 새 셀렉터 찾도록 요청
    const newSelector = await this.aiSuggestSelector(page, context);
    if (newSelector) {
      const locator = page.locator(newSelector);
      await locator.waitFor({ timeout: 3000 });
      console.log(`[SelfHealing] AI 제안 셀렉터 성공: ${newSelector}`);
      this.learn(context.description, newSelector);
      return locator;
    }

    throw new Error(`[SelfHealing] 모든 시도 실패: ${context.description}`);
  }

  private async aiSuggestSelector(
    page: Page,
    context: SelectorContext
  ): Promise<string | null> {
    // 페이지 HTML 가져오기
    const html = await page.content();

    const prompt = `다음 HTML에서 "${context.description}" 요소를 찾기 위한 최적의 CSS 셀렉터를 제안해주세요.

원래 셀렉터 (실패함): ${context.original}

HTML (일부):
${html.slice(0, 5000)}

요구사항:
1. 가장 안정적인 셀렉터 (data-testid > id > 의미있는 class > 구조)
2. 하나의 셀렉터만 반환 (설명 없이)
3. 유효한 CSS 또는 Playwright 셀렉터

셀렉터:`;

    try {
      const suggestion = await aiClient.generateText(prompt);
      return suggestion.trim().replace(/[`'"]/g, '');
    } catch (error) {
      console.error('[SelfHealing] AI 제안 실패:', error);
      return null;
    }
  }

  private learn(description: string, selector: string) {
    const existing = this.learningDB.get(description) || [];
    if (!existing.includes(selector)) {
      existing.unshift(selector); // 최신 것을 앞에
      this.learningDB.set(description, existing.slice(0, 5)); // 최대 5개 저장
    }
  }

  // 학습 데이터 저장/로드 (선택적)
  saveKnowledge(filePath: string) {
    const fs = require('fs');
    const data = Object.fromEntries(this.learningDB);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }

  loadKnowledge(filePath: string) {
    const fs = require('fs');
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      this.learningDB = new Map(Object.entries(data));
    } catch {}
  }
}

export const selfHealingLocator = new SelfHealingLocator();
```

사용 예시:

```typescript
import { test, expect } from '@playwright/test';
import { selfHealingLocator } from '../ai/core/self-healing';

test('셀프힐링 로그인', async ({ page }) => {
  await page.goto('/login');

  // 셀프힐링 셀렉터 사용
  const emailInput = await selfHealingLocator.find(page, {
    original: 'input[name="email"]',
    description: '이메일 입력 필드',
    fallbacks: [
      'input[type="email"]',
      'input[placeholder*="이메일"]',
      'form input:nth-child(1)',
    ],
  });

  await emailInput.fill('test@example.com');
});
```

### 4. AI 비주얼 검증

`tests/ai/core/visual-validator.ts`:

```typescript
import { Page } from '@playwright/test';
import { aiClient } from './ai-client';
import sharp from 'sharp';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import fs from 'fs';
import path from 'path';

export interface VisualValidationResult {
  isValid: boolean;
  diffPercentage: number;
  aiAnalysis?: {
    verdict: 'pass' | 'fail' | 'unclear';
    reason: string;
    suggestions: string[];
  };
}

export class VisualValidator {
  private baselinePath: string;

  constructor(baselinePath: string = './tests/data/baselines/screenshots') {
    this.baselinePath = baselinePath;

    // 베이스라인 디렉토리 생성
    if (!fs.existsSync(baselinePath)) {
      fs.mkdirSync(baselinePath, { recursive: true });
    }
  }

  async validate(
    page: Page,
    screenshotName: string,
    options?: {
      threshold?: number;
      useAI?: boolean;
      context?: string;
    }
  ): Promise<VisualValidationResult> {
    const threshold = options?.threshold || 0.05;
    const useAI = options?.useAI !== false;

    // 현재 스크린샷 촬영
    const currentBuffer = await page.screenshot({ fullPage: true });

    // 베이스라인 경로
    const baselineFile = path.join(this.baselinePath, `${screenshotName}.png`);
    const currentFile = path.join(this.baselinePath, `${screenshotName}.current.png`);
    const diffFile = path.join(this.baselinePath, `${screenshotName}.diff.png`);

    // 베이스라인이 없으면 생성
    if (!fs.existsSync(baselineFile)) {
      fs.writeFileSync(baselineFile, currentBuffer);
      console.log(`[Visual] 베이스라인 생성: ${screenshotName}`);
      return { isValid: true, diffPercentage: 0 };
    }

    // 현재 스크린샷 저장
    fs.writeFileSync(currentFile, currentBuffer);

    // 이미지 비교
    const baseline = PNG.sync.read(fs.readFileSync(baselineFile));
    const current = PNG.sync.read(currentBuffer);

    // 크기 조정 (필요시)
    if (baseline.width !== current.width || baseline.height !== current.height) {
      console.warn(`[Visual] 크기 불일치 - 베이스라인 업데이트 권장`);
    }

    const { width, height } = baseline;
    const diff = new PNG({ width, height });

    const numDiffPixels = pixelmatch(
      baseline.data,
      current.data,
      diff.data,
      width,
      height,
      { threshold: 0.1 }
    );

    const diffPercentage = numDiffPixels / (width * height);

    // Diff 이미지 저장
    fs.writeFileSync(diffFile, PNG.sync.write(diff));

    // 임계값 이하면 통과
    if (diffPercentage <= threshold) {
      return { isValid: true, diffPercentage };
    }

    // AI 분석 (활성화된 경우)
    if (useAI && diffPercentage > threshold) {
      const aiAnalysis = await this.aiAnalyze(
        fs.readFileSync(baselineFile),
        currentBuffer,
        options?.context || screenshotName
      );

      return {
        isValid: aiAnalysis.verdict === 'pass',
        diffPercentage,
        aiAnalysis,
      };
    }

    return { isValid: false, diffPercentage };
  }

  private async aiAnalyze(
    baselineBuffer: Buffer,
    currentBuffer: Buffer,
    context: string
  ) {
    const baselineBase64 = baselineBuffer.toString('base64');
    const currentBase64 = currentBuffer.toString('base64');

    const prompt = `다음 두 스크린샷을 비교하여 변경 사항이 버그인지 의도적인 디자인 변경인지 판단해주세요.

컨텍스트: ${context}

첫 번째 이미지는 베이스라인(예상)이고, 두 번째 이미지는 현재 상태입니다.

다음 형식으로 답변해주세요:
{
  "verdict": "pass" | "fail" | "unclear",
  "reason": "변경 사항 설명",
  "suggestions": ["제안 1", "제안 2"]
}

판단 기준:
- pass: 의도적인 디자인 변경 (색상, 폰트, 레이아웃 개선 등)
- fail: 버그 가능성 높음 (텍스트 잘림, 요소 누락, 깨진 레이아웃 등)
- unclear: 판단하기 어려움`;

    // 첫 번째 이미지
    let response = await aiClient.analyzeImage(baselineBase64, 'Baseline image');

    // 비교 분석 (두 이미지 함께 - Anthropic Claude는 여러 이미지 지원)
    try {
      const analysisText = await aiClient.generateText(
        `${prompt}\n\n[베이스라인과 현재 이미지를 비교한 결과를 JSON 형식으로 반환]`
      );

      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('[Visual AI] 분석 실패:', error);
    }

    // 기본값
    return {
      verdict: 'unclear' as const,
      reason: 'AI 분석 실패',
      suggestions: ['수동 검토 필요'],
    };
  }
}

export const visualValidator = new VisualValidator();
```

사용 예시:

```typescript
import { test, expect } from '@playwright/test';
import { visualValidator } from '../ai/core/visual-validator';

test('캔버스 렌더링 비주얼 검증', async ({ page }) => {
  await page.goto('/canvas');

  // 노드 추가
  await page.click('[data-testid="add-node-chatgpt"]');

  // 비주얼 검증
  const result = await visualValidator.validate(
    page,
    'canvas-with-chatgpt-node',
    {
      threshold: 0.05,
      useAI: true,
      context: 'ChatGPT 노드가 추가된 캔버스',
    }
  );

  if (!result.isValid) {
    console.log('AI 분석:', result.aiAnalysis);
  }

  expect(result.isValid).toBeTruthy();
});
```

---

## Page Object Model

### 캔버스 페이지 객체

`tests/e2e/pages/CanvasPage.ts`:

```typescript
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
    await this.canvas.waitFor();
  }

  // 셀프힐링 기능 사용
  async findNodeByType(nodeType: string): Promise<Locator> {
    return await selfHealingLocator.find(this.page, {
      original: `[data-testid="node-${nodeType}"]`,
      description: `${nodeType} 노드`,
      fallbacks: [
        `[data-node-type="${nodeType}"]`,
        `.node-${nodeType}`,
        `[aria-label="${nodeType} 노드"]`,
      ],
    });
  }

  async addNode(nodeType: string) {
    const nodeButton = await this.findNodeByType(nodeType);

    // 캔버스 중앙으로 드래그
    const canvasBounds = await this.canvas.boundingBox();
    if (!canvasBounds) throw new Error('Canvas not found');

    await nodeButton.dragTo(this.canvas, {
      targetPosition: {
        x: canvasBounds.width / 2,
        y: canvasBounds.height / 2,
      },
    });
  }

  async connectNodes(sourceNodeId: string, targetNodeId: string) {
    const sourceHandle = this.page.locator(
      `[data-nodeid="${sourceNodeId}"] [data-handlepos="right"]`
    );
    const targetHandle = this.page.locator(
      `[data-nodeid="${targetNodeId}"] [data-handlepos="left"]`
    );

    await sourceHandle.dragTo(targetHandle);
  }

  async saveWorkflow(name: string) {
    await this.saveButton.click();
    await this.page.fill('input[placeholder="워크플로우 이름"]', name);
    await this.page.click('button:has-text("저장")');

    // 성공 토스트 대기
    await this.page.waitForSelector('.toast-success', { timeout: 5000 });
  }

  async executeWorkflow() {
    await this.executeButton.click();
    await this.executionPanel.waitFor();
  }

  async getExecutionStatus(): Promise<'idle' | 'running' | 'completed' | 'failed'> {
    const statusElement = this.executionPanel.locator('[data-testid="execution-status"]');
    const status = await statusElement.getAttribute('data-status');
    return status as any;
  }

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

  // 노드 설정
  async selectNode(nodeId: string) {
    await this.page.click(`[data-nodeid="${nodeId}"]`);
    await this.detailPanel.waitFor();
  }

  async setNodeParameter(paramName: string, value: string) {
    const input = this.detailPanel.locator(`[name="${paramName}"]`);
    await input.fill(value);
  }
}
```

---

## 픽스처 활용

`tests/e2e/fixtures/auth.fixture.ts`:

```typescript
import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

type AuthFixture = {
  authenticatedPage: Page;
};

export const test = base.extend<AuthFixture>({
  authenticatedPage: async ({ page }, use) => {
    // 로그인 수행
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(
      process.env.TEST_USER_EMAIL || 'test@example.com',
      process.env.TEST_USER_PASSWORD || 'password123'
    );

    // 로그인 확인
    await page.waitForURL('/main');

    // 테스트에서 사용
    await use(page);

    // 정리 (로그아웃 등)
    // await page.click('[data-testid="logout"]');
  },
});

export { expect } from '@playwright/test';
```

사용:

```typescript
import { test, expect } from '../fixtures/auth.fixture';
import { CanvasPage } from '../pages/CanvasPage';

test('인증된 사용자 - 워크플로우 생성', async ({ authenticatedPage }) => {
  const canvas = new CanvasPage(authenticatedPage);
  await canvas.goto();
  await canvas.addNode('ChatOpenAI');

  // ...테스트 계속
});
```

---

## CI/CD 통합

### GitHub Actions 예시

`.github/workflows/e2e-tests.yml`:

```yaml
name: E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Create .env.test
        run: |
          echo "ANTHROPIC_API_KEY=${{ secrets.ANTHROPIC_API_KEY }}" >> .env.test
          echo "TEST_BASE_URL=http://localhost:3000" >> .env.test
          echo "ENABLE_AI_TEST_GENERATION=true" >> .env.test
          echo "ENABLE_SELF_HEALING=true" >> .env.test

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30

      - name: Upload AI analysis
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: ai-analysis
          path: test-results/ai-analysis.json
```

---

## 베스트 프랙티스

### 1. 테스트 격리
- 각 테스트는 독립적으로 실행 가능해야 함
- 테스트 간 상태 공유 금지
- 픽스처를 활용한 초기화

### 2. 명확한 테스트 이름
```typescript
// Good
test('사용자가 로그인 후 새 워크플로우를 생성하고 ChatGPT 노드를 추가할 수 있다', ...);

// Bad
test('test1', ...);
```

### 3. Page Object 일관성
- 모든 페이지 인터랙션은 Page Object를 통해
- 셀렉터는 Page Object에만 존재
- 재사용 가능한 메서드 작성

### 4. 적절한 대기
```typescript
// Good
await page.waitForSelector('[data-testid="result"]');

// Bad
await page.waitForTimeout(5000);
```

### 5. AI 기능 활용
- 반복적인 테스트는 AI로 생성
- 셀프힐링으로 유지보수 비용 절감
- 비주얼 검증으로 UI 버그 조기 발견

### 6. 에러 처리
```typescript
test('워크플로우 실행 - 에러 처리', async ({ page }) => {
  try {
    await canvas.executeWorkflow();
    await canvas.waitForExecutionComplete();
  } catch (error) {
    // 스크린샷 및 로그 수집
    await page.screenshot({ path: 'error-state.png' });
    const logs = await page.evaluate(() => console.log);
    console.error('Execution failed:', error, logs);
    throw error;
  }
});
```

---

**다음 단계**: [AI 기능 명세](./AI_FEATURES.md)로 이동하여 AI 기능 상세 구현 방법 확인
