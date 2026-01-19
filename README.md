# XGEN AI-Driven E2E Testing Framework

> Playwright + AI 기반의 지능형 E2E 테스트 자동화 프레임워크

## 📋 프로젝트 개요

XGEN 프로젝트를 위한 AI 기반 E2E 테스트 자동화 프레임워크입니다. Claude AI와 Playwright를 결합하여 테스트 생성, 셀프힐링, 비주얼 검증, 이상 탐지 등 5가지 핵심 AI 기능을 제공합니다.

## 🚀 핵심 AI 기능

### 1. AI 테스트 생성기
- 자연어 설명으로 테스트 자동 생성
- 버그 리포트에서 테스트 케이스 생성
- 기존 코드 패턴 학습 및 적용

### 2. 셀프힐링 셀렉터
- UI 변경 시 자동으로 새로운 셀렉터 탐색
- 학습 기반 셀렉터 데이터베이스
- 폴백 셀렉터 자동 관리

### 3. AI 비주얼 검증
- 스크린샷 비교 및 AI 기반 분석
- 의도적 변경 vs 버그 자동 판단
- 영역별, 반응형 비주얼 테스트

### 4. 이상 탐지 시스템
- 실행 시간 패턴 분석
- 네트워크 요청 모니터링
- 콘솔 에러 자동 탐지

### 5. 테스트 분석 & AI 리포터
- 실패 원인 자동 분석
- 수정 제안 생성
- 테스트 커버리지 분석

## 🛠 기술 스택

- **테스트 프레임워크**: Playwright 1.48+
- **AI 엔진**: Anthropic Claude 3.5 Sonnet
- **언어**: TypeScript 5.3+
- **비주얼 비교**: Pixelmatch, Sharp
- **리포팅**: Allure, Custom AI Reporter

## 📁 프로젝트 구조

```
AI-driven-UI-test/
├── tests/
│   ├── e2e/
│   │   ├── specs/          # 테스트 케이스
│   │   │   ├── auth/       # 인증 테스트
│   │   │   ├── canvas/     # 캔버스 테스트
│   │   │   ├── chatbot/    # 챗봇 테스트
│   │   │   └── admin/      # 관리자 테스트
│   │   ├── pages/          # Page Object Models
│   │   └── fixtures/       # 테스트 픽스처
│   ├── ai/
│   │   ├── core/           # AI 핵심 기능
│   │   │   ├── ai-client.ts
│   │   │   ├── test-generator.ts
│   │   │   ├── self-healing.ts
│   │   │   └── visual-validator.ts
│   │   ├── models/
│   │   │   └── prompts/    # AI 프롬프트
│   │   └── reporters/      # AI 리포터
│   ├── config/             # 설정 파일
│   ├── utils/              # 유틸리티
│   └── data/               # 테스트 데이터
├── QA/                     # 문서
│   ├── README.md
│   ├── TEST_SCENARIOS.md
│   ├── DEVELOPMENT_GUIDE.md
│   ├── AI_FEATURES.md
│   └── ARCHITECTURE.md
├── playwright.config.ts
├── tsconfig.json
└── package.json
```

## 🚦 시작하기

### 1. 설치

```bash
# 패키지 설치
npm install

# Playwright 브라우저 설치
npx playwright install
```

### 2. 환경 변수 설정

`.env.test` 파일을 생성하고 다음 정보를 입력하세요:

```bash
# AI API Keys
ANTHROPIC_API_KEY=your-api-key-here

# Test Environment
TEST_BASE_URL=http://localhost:3000
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=password123

# AI Features Toggle
ENABLE_AI_TEST_GENERATION=true
ENABLE_SELF_HEALING=true
ENABLE_AI_VISUAL_VALIDATION=true
```

### 3. 테스트 실행

```bash
# 모든 테스트 실행
npm run test:e2e

# 헤드리스 모드 (브라우저 보이기)
npm run test:e2e:headed

# UI 모드
npm run test:e2e:ui

# 디버그 모드
npm run test:e2e:debug

# 특정 테스트만 실행
npx playwright test tests/e2e/specs/auth/login.spec.ts
```

### 4. 리포트 확인

```bash
# HTML 리포트 열기
npm run test:report
```

## 📝 테스트 작성 예시

### 기본 테스트

```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

test('로그인 테스트', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('test@example.com', 'password123');

  await expect(page).toHaveURL('/main');
});
```

### 셀프힐링 테스트

```typescript
import { selfHealingLocator } from '../ai/core/self-healing';

test('셀프힐링 로그인', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.loginWithSelfHealing('test@example.com', 'password123');
});
```

## 🎯 주요 테스트 시나리오

### 인증 (Authentication)
- ✅ 로그인 / 로그아웃
- ✅ 회원가입
- ✅ 비밀번호 재설정

### 캔버스 워크플로우 (Canvas Workflow) - 핵심
- ✅ 노드 추가/삭제/연결
- ✅ 워크플로우 저장/로드/실행
- ✅ 템플릿 사용
- ✅ Undo/Redo
- ✅ 줌/패닝

### 챗봇 (Chatbot)
- ✅ 메시지 전송/수신
- ✅ 세션 관리

### 관리자 (Admin)
- ✅ 사용자 관리
- ✅ 통계 확인

전체 테스트 시나리오는 [TEST_SCENARIOS.md](QA/TEST_SCENARIOS.md)를 참조하세요.

## 🤖 AI 기능 사용법

### AI 테스트 생성

```typescript
import { testGenerator } from './tests/ai/core/test-generator';

const testCode = await testGenerator.generateTest(
  '로그인 후 캔버스에서 ChatGPT 노드를 추가하는 테스트',
  {
    pageUrl: '/canvas',
  }
);
```

### 셀프힐링 셀렉터

```typescript
import { selfHealingLocator } from './tests/ai/core/self-healing';

const button = await selfHealingLocator.find(page, {
  original: 'button[data-testid="submit"]',
  description: '제출 버튼',
  fallbacks: [
    'button:has-text("제출")',
    '.submit-button',
  ],
});
```

## 📊 비용 예상

월별 예상 비용: **$55**

- AI 테스트 생성: $15/월
- 셀프힐링: $10/월
- 비주얼 검증: $20/월
- 이상 탐지: $5/월
- 분석 리포트: $5/월

자세한 비용 분석은 [AI_FEATURES.md](QA/AI_FEATURES.md)를 참조하세요.

## 📖 문서

- [개발 가이드](QA/DEVELOPMENT_GUIDE.md) - 상세한 개발 방법
- [테스트 시나리오](QA/TEST_SCENARIOS.md) - 전체 테스트 케이스
- [AI 기능 명세](QA/AI_FEATURES.md) - AI 기능 상세 설명
- [시스템 아키텍처](QA/ARCHITECTURE.md) - 아키텍처 설계

## 🔧 주요 명령어

```bash
# 테스트 실행
npm run test:e2e              # 모든 테스트
npm run test:e2e:headed       # 브라우저 보이기
npm run test:e2e:ui           # UI 모드
npm run test:e2e:debug        # 디버그 모드

# 리포트
npm run test:report           # HTML 리포트

# AI 기능
npm run ai:generate-test      # AI 테스트 생성 스크립트

# Playwright 코드 생성
npm run test:codegen          # 코드 생성기
```

## 🐛 문제 해결

### AI 기능이 작동하지 않음
- `.env.test` 파일에 `ANTHROPIC_API_KEY`가 설정되어 있는지 확인
- API 키가 유효한지 확인

### 테스트가 실패함
- `TEST_BASE_URL`이 올바른지 확인
- 실제 XGEN 서버가 실행 중인지 확인
- 셀렉터가 실제 DOM 구조와 일치하는지 확인

### 셀프힐링이 작동하지 않음
- `.env.test`에서 `ENABLE_SELF_HEALING=true` 확인
- `tests/data/self-healing-knowledge.json` 파일이 생성되는지 확인

## 🤝 기여

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 라이선스

MIT License

## 👥 작성자

XGEN QA Team

---

**더 많은 정보는 [QA 문서](QA/) 폴더를 참조하세요.**
