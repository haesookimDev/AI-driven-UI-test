# 🔐 인증 Fixture 가이드

## 개요

로그인이 필수인 기능(캔버스, 챗봇, 관리자 등)을 테스트할 때 **자동으로 로그인된 상태**로 시작하는 방법입니다.

---

## 🎯 왜 필요한가?

### ❌ 문제점 (기존 방식)
```typescript
test('캔버스 테스트', async ({ page }) => {
  // 매번 로그인 해야 함
  await page.goto('/login');
  await page.fill('input#email', 'test@example.com');
  await page.fill('input#password', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);

  // 실제 테스트 시작
  await page.goto('/canvas');
  // ...
});
```

### ✅ 해결 (Fixture 사용)
```typescript
test('캔버스 테스트', async ({ authenticatedPage }) => {
  // 이미 로그인되어 있음!
  const canvasPage = new CanvasPage(authenticatedPage);
  await canvasPage.goto();
  // ...
});
```

---

## 📦 구조

### 1. **Auth Fixture 파일**

[tests/e2e/fixtures/auth.fixture.ts](tests/e2e/fixtures/auth.fixture.ts)

```typescript
import { test as base, Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

type AuthFixtures = {
  authenticatedPage: Page;  // 로그인된 페이지
  authenticatedContext: {    // 로그인 정보 포함
    page: Page;
    email: string;
  };
};

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    // 1. 로그인 수행
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(email, password);

    // 2. 로그인 성공 확인
    if (isStillOnLoginPage) {
      throw new Error('로그인 실패!');
    }

    // 3. 테스트에서 사용
    await use(page);
  },
});

export { expect } from '@playwright/test';
```

---

## 🚀 사용 방법

### Step 1: Fixture Import

```typescript
// ❌ 기존
import { test, expect } from '@playwright/test';

// ✅ 수정
import { test, expect } from '../../fixtures/auth.fixture';
```

### Step 2: authenticatedPage 사용

```typescript
import { test, expect } from '../../fixtures/auth.fixture';
import { CanvasPage } from '../../pages/CanvasPage';

test.describe('캔버스 테스트', () => {
  test('노드 추가', async ({ authenticatedPage }) => {
    // ✅ 이미 로그인되어 있음!
    const canvasPage = new CanvasPage(authenticatedPage);
    await canvasPage.goto();

    // 실제 테스트 로직
    await canvasPage.addNode('ChatOpenAI');
  });
});
```

---

## 📝 실제 예시

### ✅ Canvas 테스트 (수정됨)

[tests/e2e/specs/canvas/canvas-basic.spec.ts](tests/e2e/specs/canvas/canvas-basic.spec.ts)

```typescript
import { test, expect } from '../../fixtures/auth.fixture';
import { CanvasPage } from '../../pages/CanvasPage';

test.describe('캔버스 기본 기능 (인증 필요)', () => {
  let canvasPage: CanvasPage;

  test.beforeEach(async ({ authenticatedPage }) => {
    console.log('✅ 인증된 상태로 캔버스 테스트 시작');

    canvasPage = new CanvasPage(authenticatedPage);
    await canvasPage.goto();
    await authenticatedPage.waitForLoadState('networkidle');
  });

  test('캔버스 페이지 로드', async ({ authenticatedPage }) => {
    console.log('현재 URL:', authenticatedPage.url());
    await expect(canvasPage.canvas).toBeVisible({ timeout: 10000 });
  });

  test('노드 추가', async ({ authenticatedPage }) => {
    const initialCount = await canvasPage.getNodeCount();
    await canvasPage.addNode('ChatOpenAI');

    const finalCount = await canvasPage.getNodeCount();
    expect(finalCount).toBe(initialCount + 1);
  });
});
```

---

## 🔧 Fixture 작동 방식

### 실행 흐름

```
1. 테스트 시작
   ↓
2. authenticatedPage fixture 실행
   ↓
3. 로그인 페이지로 이동
   ↓
4. 로그인 수행 (자동)
   ↓
5. 로그인 성공 확인
   ↓
   ├─ 성공 → 테스트 진행
   └─ 실패 → Error 발생, 테스트 중단
   ↓
6. 테스트 코드 실행 (이미 로그인된 상태)
   ↓
7. 테스트 완료
   ↓
8. Fixture 정리 (cleanup)
```

---

## 📊 두 가지 Fixture

### 1. **authenticatedPage** (기본)

```typescript
test('테스트', async ({ authenticatedPage }) => {
  // 로그인된 페이지만 제공
  const page = authenticatedPage;
});
```

### 2. **authenticatedContext** (정보 포함)

```typescript
test('테스트', async ({ authenticatedContext }) => {
  // 페이지 + 로그인 정보
  const { page, email } = authenticatedContext;
  console.log('로그인 계정:', email);
});
```

---

## ⚙️ 환경 설정

### .env.test 파일

```bash
# 실제 XGEN 계정으로 설정
TEST_USER_EMAIL=your-actual-xgen-email@example.com
TEST_USER_PASSWORD=your-actual-xgen-password
```

### ⚠️ 중요!

- 실제 계정이 없으면 **fixture에서 Error 발생**
- 로그인 실패 시 스크린샷 자동 저장: `test-results/auth-fixture-login-failed.png`
- 테스트 실행 전 반드시 실제 계정 설정 필요!

---

## 🎯 어떤 테스트에 사용할까?

### ✅ 사용해야 하는 경우

- **캔버스** 기능 테스트
- **챗봇** 기능 테스트
- **관리자** 페이지 테스트
- **사용자 설정** 테스트
- **워크플로우** 관련 테스트

### ❌ 사용하지 않는 경우

- **로그인** 페이지 테스트 (당연히!)
- **회원가입** 테스트
- **공개** 페이지 테스트
- **인증 없이 접근 가능한** 페이지

---

## 📝 새로운 테스트 작성 예시

### 챗봇 테스트 만들기

```typescript
// tests/e2e/specs/chatbot/chatbot-basic.spec.ts
import { test, expect } from '../../fixtures/auth.fixture';
import { ChatbotPage } from '../../pages/ChatbotPage';

test.describe('챗봇 기능 (인증 필요)', () => {
  test('메시지 전송', async ({ authenticatedPage }) => {
    const chatbotPage = new ChatbotPage(authenticatedPage);
    await chatbotPage.goto();

    // 메시지 전송
    await chatbotPage.sendMessage('안녕하세요');

    // 응답 확인
    const response = await chatbotPage.getLastResponse();
    expect(response).toBeTruthy();
  });
});
```

### 관리자 테스트 만들기

```typescript
// tests/e2e/specs/admin/user-management.spec.ts
import { test, expect } from '../../fixtures/auth.fixture';
import { AdminPage } from '../../pages/AdminPage';

test.describe('사용자 관리 (인증 필요)', () => {
  test('사용자 목록 조회', async ({ authenticatedPage }) => {
    const adminPage = new AdminPage(authenticatedPage);
    await adminPage.goto();

    const userCount = await adminPage.getUserCount();
    expect(userCount).toBeGreaterThan(0);
  });
});
```

---

## 🐛 문제 해결

### 문제 1: "로그인 실패" 에러

```
Error: 로그인 실패: 실제 XGEN 계정으로 .env.test를 설정하세요
```

**해결:**
```bash
# .env.test 파일 확인
TEST_USER_EMAIL=실제계정@example.com
TEST_USER_PASSWORD=실제비밀번호
```

### 문제 2: Fixture가 작동하지 않음

```
authenticatedPage is not defined
```

**해결:**
```typescript
// ❌ 잘못된 import
import { test, expect } from '@playwright/test';

// ✅ 올바른 import
import { test, expect } from '../../fixtures/auth.fixture';
```

### 문제 3: 테스트가 너무 느림

**원인:** 모든 테스트마다 로그인 수행

**해결:** Playwright의 storage state 사용 (고급)

```typescript
// playwright.config.ts에서 설정
projects: [
  {
    name: 'setup',
    testMatch: /.*\.setup\.ts/,
  },
  {
    name: 'logged-in-tests',
    dependencies: ['setup'],
    use: {
      storageState: '.auth/user.json',
    },
  },
],
```

---

## 📚 참고

### 공식 문서
- [Playwright Fixtures](https://playwright.dev/docs/test-fixtures)
- [Authentication](https://playwright.dev/docs/auth)

### 프로젝트 문서
- [tests/e2e/fixtures/auth.fixture.ts](tests/e2e/fixtures/auth.fixture.ts) - Fixture 구현
- [tests/e2e/specs/canvas/canvas-basic.spec.ts](tests/e2e/specs/canvas/canvas-basic.spec.ts) - 사용 예시

---

## ✅ 체크리스트

테스트 작성 전 확인:

- [ ] `.env.test`에 실제 계정 설정됨
- [ ] `auth.fixture.ts`에서 import
- [ ] `authenticatedPage` 파라미터 사용
- [ ] 로그인 불필요한 테스트는 일반 `test` 사용

---

## 🎉 완료!

이제 모든 기능 테스트에서 **자동 로그인**을 사용할 수 있습니다!

**테스트 실행:**
```bash
npx playwright test tests/e2e/specs/canvas/canvas-basic.spec.ts --headed
```

**로그 확인:**
```
🔐 로그인 수행 중: test@example.com
✅ 로그인 성공! URL: http://localhost:3000/main
✅ 인증된 상태로 캔버스 테스트 시작
```

**성공!** 🚀
