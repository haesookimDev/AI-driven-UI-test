# 🚀 빠른 시작 가이드

이 가이드는 XGEN AI E2E 테스트 프레임워크를 빠르게 시작하는 방법을 안내합니다.

## ⏱️ 5분 만에 시작하기

### Step 1: 패키지 설치 (1분)

```bash
npm install
npx playwright install
```

### Step 2: 환경 변수 설정 (1분)

`.env.test` 파일을 열고 다음을 수정하세요:

```bash
# 필수 설정
ANTHROPIC_API_KEY=sk-ant-your-actual-api-key-here  # Claude API 키
TEST_BASE_URL=http://localhost:3000                 # XGEN 서버 URL
TEST_USER_EMAIL=your-test-email@example.com         # 테스트 계정
TEST_USER_PASSWORD=your-test-password               # 테스트 비밀번호

# AI 기능 토글 (필요한 것만 true로 설정)
ENABLE_AI_TEST_GENERATION=true
ENABLE_SELF_HEALING=true
ENABLE_AI_VISUAL_VALIDATION=false    # 비용 절감을 위해 일단 false
ENABLE_ANOMALY_DETECTION=false       # 비용 절감을 위해 일단 false
```

### Step 3: 첫 테스트 실행 (3분)

```bash
# UI 모드로 테스트 실행 (추천)
npm run test:e2e:ui

# 또는 일반 모드로 실행
npm run test:e2e:headed
```

## 🎯 다음 단계

### 1. 테스트 작성하기

간단한 테스트를 작성해봅시다:

```typescript
// tests/e2e/specs/my-first-test.spec.ts
import { test, expect } from '@playwright/test';

test('내 첫 번째 테스트', async ({ page }) => {
  await page.goto('/');

  const title = await page.title();
  console.log('페이지 제목:', title);

  expect(title).toBeTruthy();
});
```

실행:
```bash
npx playwright test tests/e2e/specs/my-first-test.spec.ts
```

### 2. Page Object 사용하기

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

### 3. 셀프힐링 기능 사용하기

```typescript
import { LoginPage } from '../pages/LoginPage';

test('셀프힐링 로그인', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();

  // 셀렉터가 변경되어도 자동으로 찾아줍니다
  await loginPage.loginWithSelfHealing('test@example.com', 'password123');
});
```

## 📝 자주 사용하는 명령어

```bash
# 테스트 실행
npm run test:e2e              # 모든 테스트 실행
npm run test:e2e:headed       # 브라우저 보면서 실행
npm run test:e2e:ui           # UI 모드 (가장 추천)
npm run test:e2e:debug        # 디버그 모드

# 특정 테스트만 실행
npx playwright test login.spec.ts

# 특정 브라우저만
npx playwright test --project=chromium

# 리포트 확인
npm run test:report
```

## 🎨 UI 모드 사용법

UI 모드는 테스트를 시각적으로 확인하면서 실행할 수 있는 가장 좋은 방법입니다:

```bash
npm run test:e2e:ui
```

UI 모드에서 할 수 있는 것:
- ✅ 테스트 선택 및 실행
- ✅ 단계별 실행 및 디버깅
- ✅ 시간 여행 (Time Travel)
- ✅ DOM 스냅샷 확인
- ✅ 네트워크 요청 확인

## 🔍 실제 프로젝트에 맞게 수정하기

### 1. 셀렉터 수정

실제 XGEN DOM 구조에 맞게 셀렉터를 수정해야 합니다:

```typescript
// tests/e2e/pages/LoginPage.ts
this.emailInput = page.locator('input[name="email"]');  // 실제 셀렉터로 수정

// 올바른 셀렉터를 찾는 방법:
// 1. Chrome DevTools에서 요소 검사
// 2. 또는 Playwright 코드 생성기 사용
npm run test:codegen http://localhost:3000/login
```

### 2. URL 경로 수정

```typescript
// 실제 XGEN 라우팅에 맞게 수정
await page.goto('/login');      // 실제 로그인 경로
await page.goto('/canvas');     // 실제 캔버스 경로
```

### 3. 테스트 계정 생성

XGEN 서버에 테스트 계정을 생성하고 `.env.test`에 입력하세요.

## 🐛 문제 해결

### "Browser not found" 에러
```bash
npx playwright install
```

### AI 기능이 작동하지 않음
- `.env.test`에서 `ANTHROPIC_API_KEY` 확인
- API 키 유효성 확인: https://console.anthropic.com/

### "Cannot find module" 에러
```bash
npm install
```

### 테스트가 타임아웃됨
- `.env.test`에서 `TEST_BASE_URL`이 올바른지 확인
- XGEN 서버가 실행 중인지 확인
- `TEST_TIMEOUT`을 늘려보세요 (기본 60초)

### 셀렉터를 찾을 수 없음
```bash
# 코드 생성기로 올바른 셀렉터 찾기
npm run test:codegen http://localhost:3000
```

## 📚 더 알아보기

- [개발 가이드](QA/DEVELOPMENT_GUIDE.md) - 상세한 개발 방법
- [테스트 시나리오](QA/TEST_SCENARIOS.md) - 작성해야 할 테스트 목록
- [AI 기능 사용법](QA/AI_FEATURES.md) - AI 기능 자세히 알아보기

## 💡 팁

### 1. 테스트 작성 순서 (권장)

1. ✅ 로그인/로그아웃 (완료)
2. ⬜ 캔버스 기본 기능
3. ⬜ 노드 추가/연결
4. ⬜ 워크플로우 저장/로드
5. ⬜ 워크플로우 실행

### 2. Page Object 먼저 작성

테스트 케이스를 작성하기 전에 Page Object를 먼저 작성하면 테스트 코드가 간결해집니다.

### 3. 셀프힐링 활용

셀렉터가 자주 변경되는 요소에는 셀프힐링을 사용하세요.

### 4. 비용 관리

처음에는 AI 기능 중 꼭 필요한 것만 활성화하세요:
- `ENABLE_SELF_HEALING=true` - 가장 유용
- `ENABLE_AI_TEST_GENERATION=true` - 테스트 작성 시 유용
- 나머지는 false로 시작

## 🎉 축하합니다!

첫 테스트를 실행했다면 성공입니다! 이제 실제 XGEN 기능에 맞는 테스트를 작성해보세요.

질문이 있으면 [개발 가이드](QA/DEVELOPMENT_GUIDE.md)를 참조하거나 팀에 문의하세요.
