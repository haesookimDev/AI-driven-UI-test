# 🔧 문제 해결 가이드

## 발견된 문제와 해결 방법

### ✅ 문제 1: 로케이터를 찾지 못함

**증상:**
```
Error: Locator not found: input[name="email"]
```

**원인:**
- 실제 XGEN의 DOM 구조와 테스트 코드의 셀렉터가 달랐습니다
- XGEN은 `name` 속성 대신 `id` 속성을 사용합니다

**실제 DOM 구조:**
```html
<input type="email" id="email" placeholder="email@example.com">
<input type="password" id="password" placeholder="비밀번호를 입력하세요">
<button type="submit">로그인</button>
```

**해결:**
[tests/e2e/pages/LoginPage.ts](tests/e2e/pages/LoginPage.ts) 수정 완료
```typescript
// 수정 전
this.emailInput = page.locator('input[name="email"]');
this.passwordInput = page.locator('input[name="password"]');

// 수정 후
this.emailInput = page.locator('input#email');
this.passwordInput = page.locator('input#password');
```

---

### ✅ 문제 2: 셀프힐링 후 URL 리디렉션 실패

**증상:**
```
Error: expect(page).toHaveURL(expected) failed
Expected: "http://localhost:3000/main"
Received: "http://localhost:3000/login"
```

**원인:**
1. 로그인이 실제로 성공하지 못함 (계정 정보 또는 백엔드 문제)
2. 리디렉션 URL이 `/main`이 아닐 수 있음

**해결 방법:**

#### 1단계: 실제 계정 정보 확인

`.env.test` 파일에서 실제 XGEN 계정 정보 입력:
```bash
TEST_USER_EMAIL=your-actual-xgen-email@example.com
TEST_USER_PASSWORD=your-actual-xgen-password
```

#### 2단계: 디버그 테스트 실행

```bash
# DOM 구조 확인
npx playwright test tests/e2e/specs/debug/inspect-login.spec.ts --headed

# 수정된 로그인 테스트
npx playwright test tests/e2e/specs/auth/login-fixed.spec.ts --headed
```

#### 3단계: 실제 리디렉션 URL 확인

수정된 테스트 실행 후 콘솔 로그를 확인하세요:
```
로그인 후 URL: http://localhost:3000/actual-redirect-url
```

이 URL을 확인하고 테스트 코드에 반영하세요.

---

### ✅ 문제 3: 셀프힐링 Knowledge를 다음 테스트에 적용

**셀프힐링이 작동하는 방식:**

1. **테스트 실행 중 자동 학습**
   - 원본 셀렉터 실패 → 폴백 셀렉터 시도
   - 성공한 셀렉터를 `tests/data/self-healing-knowledge.json`에 저장

2. **다음 테스트에서 자동 적용**
   - 같은 `description`을 사용하면 학습된 셀렉터를 먼저 시도
   - 자동으로 가장 최근 성공한 셀렉터 사용

**수동으로 Knowledge 추가:**

[tests/data/self-healing-knowledge.json](tests/data/self-healing-knowledge.json) 파일이 이미 생성되었습니다:

```json
{
  "이메일 입력 필드": [
    "input#email",
    "input[type=\"email\"]",
    "input[id=\"email\"]"
  ],
  "비밀번호 입력 필드": [
    "input#password",
    "input[type=\"password\"]"
  ],
  "로그인 버튼": [
    "button[type=\"submit\"]",
    "button:has-text(\"로그인\")"
  ]
}
```

**다음 테스트에서 사용하기:**

```typescript
import { selfHealingLocator } from '../../ai/core/self-healing';

// description만 맞으면 자동으로 학습된 셀렉터 사용
const emailField = await selfHealingLocator.find(page, {
  original: 'input#email',  // 이게 실패해도
  description: '이메일 입력 필드',  // 이 description으로 학습된 셀렉터를 먼저 시도
  fallbacks: [...]
});
```

**Knowledge 파일 위치:**
```
tests/data/self-healing-knowledge.json
```

---

## 테스트 실행 방법

### 1. 디버그 테스트 (DOM 구조 확인)

```bash
npx playwright test tests/e2e/specs/debug/inspect-login.spec.ts --headed
```

**출력 예시:**
```
✅ input[type="email"]: 발견 (1개), 보임: true
   속성: { type: 'email', id: 'email', placeholder: 'email@example.com' }

✅ button[type="submit"]: 발견 (1개), 보임: true, 텍스트: "로그인"
```

### 2. 수정된 로그인 테스트

```bash
# Headed 모드 (브라우저 보면서)
npx playwright test tests/e2e/specs/auth/login-fixed.spec.ts --headed

# UI 모드 (단계별 실행)
npx playwright test tests/e2e/specs/auth/login-fixed.spec.ts --ui
```

### 3. 기존 로그인 테스트 (수정 후)

```bash
npx playwright test tests/e2e/specs/auth/login.spec.ts --headed
```

---

## 셀프힐링 동작 확인

### 테스트 실행 시 로그 확인:

```
[SelfHealing] ✅ 원본 셀렉터 성공: input#email
[SelfHealing] ✅ 학습된 셀렉터 성공: input#password
[SelfHealing] 💾 학습 데이터 저장됨
```

### Knowledge 파일 확인:

```bash
cat tests/data/self-healing-knowledge.json
```

**자동으로 추가된 내용:**
```json
{
  "이메일 입력 필드": [
    "input#email",
    "input[type=\"email\"]"
  ]
}
```

---

## 다음 단계

### 1. 실제 로그인 리디렉션 URL 확인

```bash
npx playwright test tests/e2e/specs/auth/login-fixed.spec.ts:84 --headed
```

콘솔에서 출력되는 URL을 확인:
```
로그인 후 URL: http://localhost:3000/dashboard  # 예시
```

### 2. LoginPage.ts 리디렉션 URL 수정

```typescript
async waitForRedirect(expectedUrl: string = '/dashboard', timeout: number = 10000) {
  //                                      ^^^^^^^^^^^ 실제 URL로 수정
  await this.page.waitForURL(expectedUrl, { timeout });
}
```

### 3. 테스트 케이스 업데이트

```typescript
test('정상 로그인', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(email, password);

  // 실제 리디렉션 URL로 수정
  await expect(page).toHaveURL('/dashboard'); // 또는 실제 URL
});
```

---

## 추가 디버깅 팁

### 스크린샷 확인

테스트 실행 후 생성된 스크린샷 확인:
```
test-results/before-login.png
test-results/after-login.png
test-results/selfhealing-after-login.png
test-results/real-login.png
```

### 브라우저 콘솔 에러 확인

```typescript
page.on('console', msg => console.log('브라우저 콘솔:', msg.text()));
page.on('pageerror', error => console.log('페이지 에러:', error));
```

### 네트워크 요청 확인

```typescript
page.on('request', request => {
  if (request.url().includes('login')) {
    console.log('로그인 요청:', request.method(), request.url());
  }
});

page.on('response', response => {
  if (response.url().includes('login')) {
    console.log('로그인 응답:', response.status());
  }
});
```

---

## 요약

### ✅ 완료된 수정사항

1. **LoginPage.ts 셀렉터 수정**
   - `input[name="email"]` → `input#email`
   - `input[name="password"]` → `input#password`

2. **셀프힐링 Knowledge 생성**
   - `tests/data/self-healing-knowledge.json` 파일 생성
   - 학습된 셀렉터 사전 등록

3. **디버그 테스트 추가**
   - `tests/e2e/specs/debug/inspect-login.spec.ts`
   - `tests/e2e/specs/auth/login-fixed.spec.ts`

### ⚠️ 확인 필요

1. **실제 계정 정보** - `.env.test`에 설정
2. **로그인 후 리디렉션 URL** - 실제 URL 확인 후 테스트 수정
3. **백엔드 서버 상태** - XGEN 서버가 정상 작동하는지 확인

### 📝 다음 테스트 작성 시

```typescript
import { selfHealingLocator } from '../../ai/core/self-healing';

// 이미 학습된 description 사용
const element = await selfHealingLocator.find(page, {
  original: 'current-selector',
  description: '이메일 입력 필드',  // 이미 학습됨!
  fallbacks: [...]
});
```

**knowledge 파일에 이미 학습된 셀렉터가 있으면 자동으로 사용됩니다!**

---

## 도움이 필요하면

1. 스크린샷 확인
2. 콘솔 로그 확인
3. Knowledge 파일 확인
4. 이 문서 참조

**성공을 기원합니다! 🚀**
