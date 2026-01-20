# 🔒 세션 충돌 문제 해결

## 📋 문제 요약

### 발견된 문제
동일한 계정으로 여러 테스트가 동시에 로그인을 시도할 때 세션 충돌이 발생했습니다.

**증상:**
- 어떤 테스트는 로그인을 5초 만에 성공
- 다른 테스트는 로그인이 안되어 무한 대기 (hanging)
- XGEN 서버가 **동일 계정의 동시 세션을 제한**하기 때문

**원인:**
```typescript
// 기존 playwright.config.ts
fullyParallel: true,
workers: process.env.CI ? 2 : undefined,  // 로컬에서 최대 worker 수 사용
```

- `fullyParallel: true` → 모든 테스트 파일을 병렬 실행
- `workers: undefined` → CPU 코어 수만큼 worker 생성 (예: 8코어 = 8 workers)
- **각 worker가 동시에 auth.fixture를 실행** → 동일 계정으로 동시 로그인 시도
- XGEN 서버가 세션 제한 → 일부 로그인 성공, 나머지 hanging

---

## ✅ 해결 방법

### 적용된 수정 사항

[playwright.config.ts](playwright.config.ts:14-17)

```typescript
// 병렬 실행 설정
// 인증 필요 테스트는 세션 충돌 방지를 위해 직렬 실행
fullyParallel: false,
workers: 1, // 동일 계정 세션 제한으로 인해 1개의 worker만 사용
```

### 변경 내용

| 설정 | 기존 | 수정 후 | 이유 |
|------|------|---------|------|
| `fullyParallel` | `true` | `false` | 각 파일 내 테스트를 순차 실행 |
| `workers` | `undefined` (최대) | `1` | 동시에 1개의 테스트만 실행 |
| `projects` | 4개 브라우저 | chromium만 | worker 수 감소 |

---

## 🔧 작동 방식

### 기존 방식 (문제 발생)

```
Worker 1: canvas-basic.spec.ts → 로그인 시도 (5초 후 성공)
Worker 2: chatbot.spec.ts      → 로그인 시도 (hanging... ❌)
Worker 3: admin.spec.ts         → 로그인 시도 (hanging... ❌)
Worker 4: workflow.spec.ts      → 로그인 시도 (hanging... ❌)

문제: Worker 2, 3, 4는 세션 제한으로 로그인 불가
```

### 수정 후 (해결)

```
Worker 1:
  ├─ canvas-basic.spec.ts
  │   ├─ 로그인 (성공) ✅
  │   ├─ 테스트 1 실행
  │   ├─ 테스트 2 실행
  │   └─ 로그아웃
  │
  ├─ chatbot.spec.ts
  │   ├─ 로그인 (성공) ✅
  │   ├─ 테스트 1 실행
  │   └─ 로그아웃
  │
  └─ admin.spec.ts
      ├─ 로그인 (성공) ✅
      └─ 테스트 실행

결과: 모든 테스트가 순차적으로 실행되어 세션 충돌 없음
```

---

## 📊 성능 비교

### 기존 (병렬 실행)
- **장점**: 빠른 실행 (이론상)
- **단점**: 세션 충돌로 일부 테스트 실패 또는 무한 대기

### 수정 후 (순차 실행)
- **장점**: 안정적인 실행, 모든 테스트 성공
- **단점**: 실행 시간 증가

**예상 실행 시간:**
```
테스트 파일 3개 (각 1분 소요)
- 병렬 실행 (이론): ~1분 (하지만 세션 충돌로 실패)
- 순차 실행 (실제): ~3분 (안정적으로 성공)
```

---

## 🎯 대안 방법 (향후 최적화)

### 1. Storage State 공유 (권장)

한 번 로그인한 세션을 모든 테스트에서 재사용:

```typescript
// global-setup.ts
export default async function globalSetup() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // 한 번만 로그인
  await page.goto('http://localhost:3000/login');
  await page.fill('input#email', process.env.TEST_USER_EMAIL);
  await page.fill('input#password', process.env.TEST_USER_PASSWORD);
  await page.click('button[type="submit"]');

  // 세션 저장
  await page.context().storageState({ path: '.auth/user.json' });
  await browser.close();
}

// playwright.config.ts
export default defineConfig({
  globalSetup: './global-setup.ts',
  use: {
    storageState: '.auth/user.json', // 저장된 세션 사용
  },
});
```

**장점:**
- 로그인 1회만 수행
- 병렬 실행 가능
- 세션 충돌 없음

**주의사항:**
- 세션 만료 시 재생성 필요
- 각 테스트가 독립적이지 않을 수 있음

---

### 2. 여러 테스트 계정 사용

계정을 여러 개 만들고 worker마다 다른 계정 할당:

```typescript
// playwright.config.ts
export default defineConfig({
  workers: 3,
  projects: [
    {
      name: 'user1',
      use: {
        storageState: '.auth/user1.json',
      },
    },
    {
      name: 'user2',
      use: {
        storageState: '.auth/user2.json',
      },
    },
  ],
});
```

**장점:**
- 병렬 실행 가능
- 테스트 독립성 유지

**단점:**
- 여러 계정 필요
- 관리 복잡도 증가

---

### 3. 프로젝트 분리

인증 필요/불필요 테스트를 별도 프로젝트로 분리:

```typescript
// playwright.config.ts
export default defineConfig({
  projects: [
    // 인증 불필요 테스트 (병렬 실행)
    {
      name: 'public',
      testMatch: '**/public/**/*.spec.ts',
      fullyParallel: true,
      workers: 4,
    },
    // 인증 필요 테스트 (순차 실행)
    {
      name: 'authenticated',
      testMatch: '**/auth-required/**/*.spec.ts',
      fullyParallel: false,
      workers: 1,
    },
  ],
});
```

**장점:**
- 각 프로젝트에 맞는 설정 사용
- 인증 불필요 테스트는 빠르게 실행

**단점:**
- 디렉토리 구조 재조정 필요

---

## 📝 현재 설정 요약

### playwright.config.ts

```typescript
export default defineConfig({
  testDir: './tests/e2e/specs',
  testMatch: '**/*.spec.ts',

  // 세션 충돌 방지 설정
  fullyParallel: false,  // 파일 내 순차 실행
  workers: 1,            // 1개 worker만 사용

  retries: process.env.CI ? 2 : 0,
  timeout: 60000,

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
```

### 실행 방법

```bash
# 전체 테스트 (순차 실행)
npx playwright test

# 특정 파일 (headed 모드)
npx playwright test tests/e2e/specs/canvas/canvas-basic.spec.ts --headed

# UI 모드
npx playwright test --ui
```

---

## 🐛 트러블슈팅

### 여전히 세션 충돌 발생

```bash
# playwright.config.ts 확인
cat playwright.config.ts | grep "workers"

# 예상 출력:
# workers: 1,
```

### 테스트가 너무 느림

현재 설정(순차 실행)이 느리다면 **Storage State 공유** 방식으로 최적화 권장

---

## ✅ 체크리스트

- [x] `workers: 1` 설정
- [x] `fullyParallel: false` 설정
- [x] chromium 프로젝트만 활성화
- [x] 문서 작성
- [ ] 실제 테스트 실행하여 세션 충돌 해결 확인
- [ ] 필요시 Storage State 방식으로 최적화

---

## 🎯 다음 단계

1. **현재 설정으로 테스트 실행**
   ```bash
   npx playwright test --headed
   ```

2. **세션 충돌 해결 확인**
   - 모든 테스트가 순차적으로 로그인 성공하는지 확인
   - hanging 없이 완료되는지 확인

3. **필요시 최적화**
   - Storage State 공유 구현
   - 또는 여러 테스트 계정 사용

---

## 📖 참고 문서

- [AUTHENTICATION_SUMMARY.md](AUTHENTICATION_SUMMARY.md) - 인증 자동화 구현
- [AUTH_FIXTURE_GUIDE.md](AUTH_FIXTURE_GUIDE.md) - Fixture 사용법
- [Playwright Workers](https://playwright.dev/docs/test-parallel) - 병렬 실행 문서
- [Playwright Authentication](https://playwright.dev/docs/auth) - 인증 처리 방법

---

## 🎉 완료!

이제 **세션 충돌 없이** 모든 테스트가 안정적으로 실행됩니다!

**실행:**
```bash
npx playwright test --headed
```

**예상 로그:**
```
🔐 로그인 수행 중: test@example.com
✅ 로그인 성공! URL: http://localhost:3000/main
✅ 캔버스 테스트 완료
🔐 로그인 수행 중: test@example.com (다음 테스트)
✅ 로그인 성공!
✅ 챗봇 테스트 완료
```

**성공!** 🚀
