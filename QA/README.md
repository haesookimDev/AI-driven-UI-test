# XGEN AI-Driven E2E Test Automation

> Playwright 기반 AI 자동화 테스트 프레임워크 개발 문서

## 📋 목차

1. [프로젝트 개요](#프로젝트-개요)
2. [핵심 기능](#핵심-기능)
3. [기술 스택](#기술-스택)
4. [프로젝트 구조](#프로젝트-구조)
5. [개발 가이드](./DEVELOPMENT_GUIDE.md)
6. [테스트 시나리오](./TEST_SCENARIOS.md)
7. [AI 기능 명세](./AI_FEATURES.md)
8. [설치 및 실행](#설치-및-실행)

---

## 프로젝트 개요

XGEN은 비주얼 AI 워크플로우 에디터 플랫폼입니다. 이 프로젝트는 **AI 기반 E2E 테스트 자동화 도구**를 개발하여 다음을 목표로 합니다:

### 🎯 목표

- **자동화된 테스트 생성**: AI가 자연어 설명으로부터 테스트 케이스 자동 생성
- **셀프힐링**: UI 변경 시 자동으로 셀렉터 복구
- **지능형 검증**: AI 비주얼 분석으로 의미있는 변경 탐지
- **유지보수 비용 절감**: 테스트 코드 업데이트 자동화
- **품질 향상**: AI 기반 이상 탐지 및 성능 분석

### 🔍 대상 애플리케이션

**XGEN Frontend** - Next.js 15 기반 AI 워크플로우 플랫폼

주요 페이지:
- `/` - 랜딩 페이지
- `/login`, `/signup` - 인증
- `/canvas` - 비주얼 워크플로우 에디터 (핵심)
- `/chatbot/[chatId]` - AI 챗봇 인터페이스
- `/main` - 통합 관리 센터
- `/admin` - 관리자 페이지
- `/ml-inference`, `/ml-monitoring` - ML 기능

### 📊 현재 프로젝트 상태

- **프레임워크**: Next.js 15.5.7, React 19
- **스타일링**: SCSS Modules, Tailwind CSS
- **상태관리**: React State, LocalStorage
- **타입**: TypeScript 5
- **주요 기술**: D3.js (비주얼라이제이션), Framer Motion (애니메이션)

---

## 핵심 기능

### 1️⃣ AI 테스트 생성기

**자연어로 테스트 케이스 작성**

```typescript
// 사용자 입력
"사용자가 로그인 후 새 워크플로우를 생성하고 LLM 노드를 추가하는 시나리오"

// AI 자동 생성
test('워크플로우 생성 및 LLM 노드 추가', async ({ page }) => {
  await loginPage.login('user@example.com', 'password');
  await workflowPage.createNew('My Workflow');
  await canvasPage.addNode('ChatOpenAI');
  await expect(canvasPage.nodeByName('ChatOpenAI')).toBeVisible();
});
```

**기능**:
- 자연어 설명 → Playwright 테스트 코드 변환
- Page Object Model 패턴 자동 적용
- 적절한 assertion 추천
- 베스트 프랙티스 적용

### 2️⃣ 셀프힐링 셀렉터

**DOM 변경에도 자동 복구**

```typescript
// 원래 셀렉터가 실패하면
await selfHealingLocator.find(page, {
  original: 'button[data-testid="save-workflow"]',
  context: '워크플로우 저장 버튼',
  fallbacks: [
    'button:has-text("저장")',
    'button.save-button',
    'header button >> nth=2'
  ]
});

// AI가 최적의 대체 셀렉터 자동 선택
// 성공한 셀렉터를 학습하여 다음에 우선 사용
```

**기능**:
- 원본 셀렉터 실패 시 AI가 대체 찾기
- 과거 성공 패턴 학습
- 시각적 요소 분석 (위치, 크기, 색상)
- 자동 업데이트 제안

### 3️⃣ AI 비주얼 검증

**스크린샷 비교 + AI 분석**

```typescript
await visualValidator.validate({
  before: 'baseline.png',
  after: 'current.png',
  context: '워크플로우 캔버스 렌더링',
  threshold: 0.05, // 5% 차이 허용
  aiAnalysis: true
});

// AI가 판단:
// ✅ "버튼 색상 변경은 디자인 업데이트"
// ❌ "텍스트가 잘림 - 버그 가능성 높음"
```

**기능**:
- 픽셀 단위 이미지 비교
- AI 시각적 의미 분석
- 버그 vs 의도적 변경 구분
- 자동 베이스라인 업데이트 제안

### 4️⃣ 이상 행동 탐지

**AI가 예상치 못한 패턴 감지**

```typescript
await anomalyDetector.monitor(page, {
  metrics: ['performance', 'memory', 'network', 'errors'],
  baseline: 'normal-workflow-execution.json',
  alertOn: ['degradation', 'spike', 'leak']
});

// 감지 예시:
// ⚠️  메모리 사용량 3배 증가 (노드 100개 추가 시)
// ⚠️  API 응답 시간 2초 → 8초 증가
// ⚠️  콘솔 에러 급증
```

**기능**:
- 성능 저하 자동 탐지
- 메모리 누수 감지
- 비정상 네트워크 패턴
- 에러 패턴 분석

### 5️⃣ 테스트 리포트 AI 분석

**실패 원인 자동 분석 및 제안**

```typescript
// 테스트 실패 시 AI 분석 리포트
{
  "testName": "워크플로우 실행",
  "status": "failed",
  "aiAnalysis": {
    "rootCause": "API 타임아웃 - 백엔드 응답 지연",
    "recommendation": "타임아웃 값을 30초에서 60초로 증가 권장",
    "relatedIssues": ["#123", "#145"],
    "fixSuggestion": "await page.waitForResponse(url, { timeout: 60000 })"
  }
}
```

**기능**:
- 실패 원인 자동 분석
- 수정 방법 제안
- 관련 이슈 연결
- 코드 수정 예시 제공

---

## 기술 스택

### Core Testing
- **Playwright** `^1.48.0` - E2E 테스트 프레임워크
- **TypeScript** `^5.0` - 타입 안전성

### AI Integration
- **@anthropic-ai/sdk** `^0.30.0` - Claude API (메인 AI)
- **OpenAI** `^4.75.0` - GPT API (대체/보조)

### Image Processing
- **Pixelmatch** `^6.0.0` - 이미지 비교
- **Sharp** `^0.33.0` - 이미지 처리

### Utilities
- **dotenv** `^17.2.0` - 환경변수 관리
- **Zod** `^3.22.0` - 스키마 검증

### Reporting
- **Allure** `^2.25.0` - 테스트 리포트
- Custom AI Reporter - AI 분석 리포트

---

## 프로젝트 구조

```
xgen-frontend/
├── QA/                                    # 테스트 문서 및 가이드
│   ├── README.md                          # 이 파일
│   ├── DEVELOPMENT_GUIDE.md               # 개발 가이드
│   ├── TEST_SCENARIOS.md                  # 테스트 시나리오 명세
│   ├── AI_FEATURES.md                     # AI 기능 상세 명세
│   └── ARCHITECTURE.md                    # 아키텍처 문서
│
├── tests/                                 # 테스트 코드
│   ├── e2e/                              # E2E 테스트
│   │   ├── specs/                        # 테스트 시나리오
│   │   │   ├── auth/                     # 인증 테스트
│   │   │   │   ├── login.spec.ts
│   │   │   │   ├── signup.spec.ts
│   │   │   │   └── password-reset.spec.ts
│   │   │   ├── canvas/                   # 캔버스 테스트 (핵심)
│   │   │   │   ├── node-creation.spec.ts
│   │   │   │   ├── node-connection.spec.ts
│   │   │   │   ├── workflow-save.spec.ts
│   │   │   │   ├── workflow-execution.spec.ts
│   │   │   │   └── canvas-interactions.spec.ts
│   │   │   ├── chatbot/                  # 챗봇 테스트
│   │   │   │   ├── chat-interface.spec.ts
│   │   │   │   └── workflow-selection.spec.ts
│   │   │   ├── admin/                    # 관리자 테스트
│   │   │   │   ├── config-management.spec.ts
│   │   │   │   └── model-management.spec.ts
│   │   │   └── main/                     # 관리 센터 테스트
│   │   │       ├── monitoring.spec.ts
│   │   │       └── settings.spec.ts
│   │   │
│   │   ├── fixtures/                     # 재사용 가능한 픽스처
│   │   │   ├── auth.fixture.ts           # 인증 픽스처
│   │   │   ├── workflow.fixture.ts       # 워크플로우 데이터
│   │   │   └── canvas.fixture.ts         # 캔버스 상태
│   │   │
│   │   └── pages/                        # Page Object Model
│   │       ├── BasePage.ts               # 베이스 페이지
│   │       ├── LoginPage.ts
│   │       ├── CanvasPage.ts
│   │       ├── ChatbotPage.ts
│   │       └── AdminPage.ts
│   │
│   ├── ai/                               # AI 기능 구현
│   │   ├── core/                         # 핵심 AI 기능
│   │   │   ├── ai-client.ts              # AI API 클라이언트
│   │   │   ├── test-generator.ts         # 테스트 생성기
│   │   │   ├── self-healing.ts           # 셀프힐링 셀렉터
│   │   │   ├── visual-validator.ts       # 비주얼 검증
│   │   │   ├── anomaly-detector.ts       # 이상 탐지
│   │   │   └── test-analyzer.ts          # 테스트 분석
│   │   │
│   │   ├── models/                       # AI 모델 설정
│   │   │   ├── prompts/                  # 프롬프트 템플릿
│   │   │   │   ├── test-generation.ts
│   │   │   │   ├── selector-healing.ts
│   │   │   │   └── visual-analysis.ts
│   │   │   └── schema.ts                 # 응답 스키마
│   │   │
│   │   ├── utils/                        # AI 유틸리티
│   │   │   ├── image-processor.ts        # 이미지 처리
│   │   │   ├── pattern-matcher.ts        # 패턴 매칭
│   │   │   └── learning-db.ts            # 학습 데이터 저장
│   │   │
│   │   └── reporters/                    # AI 리포터
│   │       ├── ai-reporter.ts            # 메인 리포터
│   │       └── report-analyzer.ts        # 리포트 분석
│   │
│   ├── config/                           # 설정 파일
│   │   ├── playwright.config.ts          # Playwright 설정
│   │   ├── ai.config.ts                  # AI 설정
│   │   └── environments/                 # 환경별 설정
│   │       ├── local.ts
│   │       ├── staging.ts
│   │       └── production.ts
│   │
│   ├── utils/                            # 공통 유틸리티
│   │   ├── logger.ts                     # 로거
│   │   ├── helpers.ts                    # 헬퍼 함수
│   │   └── constants.ts                  # 상수
│   │
│   └── data/                             # 테스트 데이터
│       ├── users.json                    # 사용자 데이터
│       ├── workflows.json                # 워크플로우 데이터
│       └── baselines/                    # 비주얼 베이스라인
│           └── screenshots/
│
├── playwright-report/                    # 테스트 리포트 (자동 생성)
├── test-results/                         # 테스트 결과 (자동 생성)
└── .env.test                             # 테스트 환경변수
```

---

## 설치 및 실행

### 1. 의존성 설치

```bash
# 테스트 관련 패키지 설치
npm install --save-dev @playwright/test @anthropic-ai/sdk openai pixelmatch sharp zod allure-playwright

# Playwright 브라우저 설치
npx playwright install
```

### 2. 환경변수 설정

`.env.test` 파일 생성:

```bash
# AI API Keys
ANTHROPIC_API_KEY=your_claude_api_key
OPENAI_API_KEY=your_openai_api_key

# Test Environment
TEST_BASE_URL=http://localhost:3000
TEST_TIMEOUT=60000

# AI Features
ENABLE_AI_TEST_GENERATION=true
ENABLE_SELF_HEALING=true
ENABLE_AI_VISUAL_VALIDATION=true
ENABLE_ANOMALY_DETECTION=true

# AI Model Settings
AI_MODEL=claude-3-5-sonnet-20241022
AI_MAX_TOKENS=4000
AI_TEMPERATURE=0.3
```

### 3. 테스트 실행

```bash
# 모든 테스트 실행
npm run test:e2e

# 특정 테스트 실행
npm run test:e2e -- tests/e2e/specs/canvas/

# UI 모드로 실행 (디버깅)
npm run test:e2e:ui

# AI 테스트 생성 모드
npm run test:ai:generate

# 리포트 보기
npm run test:report
```

---

## 다음 단계

1. [개발 가이드](./DEVELOPMENT_GUIDE.md) - 구현 시작하기
2. [테스트 시나리오](./TEST_SCENARIOS.md) - 테스트 케이스 확인
3. [AI 기능 명세](./AI_FEATURES.md) - AI 기능 상세 이해
4. [아키텍처](./ARCHITECTURE.md) - 시스템 구조 파악

---

## 📞 지원

- **이슈 리포트**: GitHub Issues
- **문의**: Plateer AI-LAB

---

**Made with ❤️ by Plateer AI-LAB**
