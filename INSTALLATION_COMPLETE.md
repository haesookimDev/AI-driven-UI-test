# ✅ 설치 완료!

## 🎉 축하합니다!

XGEN AI E2E 테스트 자동화 프레임워크가 성공적으로 설치되었습니다!

---

## ✅ 완료된 작업

### 1. 패키지 설치 완료
- ✅ 85개 npm 패키지 설치됨
- ✅ Playwright 브라우저 설치됨 (Chromium, Firefox, Webkit)
- ✅ 모든 의존성 해결됨

### 2. 프로젝트 구조 생성 완료
```
✅ 핵심 설정 파일 (package.json, playwright.config.ts 등)
✅ AI 기능 (ai-client, test-generator, self-healing)
✅ Page Objects (LoginPage, CanvasPage)
✅ 테스트 케이스 (13개 케이스 작성됨)
✅ 문서 (7개 완전 문서화)
```

### 3. 검증 완료
```bash
$ npm run verify

✅ 모든 설정이 완료되었습니다!
```

---

## 🚀 다음 단계 (중요!)

### Step 1: API 키 설정 (필수)

`.env.test` 파일을 열어서 수정하세요:

```bash
# 이 부분을 실제 API 키로 변경
ANTHROPIC_API_KEY=your-anthropic-api-key-here  # ← 여기 수정!

# 나머지는 그대로 두거나 필요시 수정
TEST_BASE_URL=http://localhost:3000
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=password123
```

**API 키 발급 방법:**
1. https://console.anthropic.com/ 접속
2. 계정 생성/로그인
3. API Keys 메뉴에서 "Create Key" 클릭
4. 생성된 키를 복사하여 `.env.test`에 붙여넣기
5. 월 $5 무료 크레딧으로 시작 가능!

### Step 2: XGEN 서버 실행

다른 터미널에서:
```bash
cd xgen-frontend
npm run dev
```

XGEN 서버가 `http://localhost:3000`에서 실행되어야 합니다.

### Step 3: 첫 테스트 실행

```bash
# 방법 1: UI 모드 (가장 추천!)
npm run test:e2e:ui

# 방법 2: 헤드리스 모드 (브라우저 보이기)
npm run test:e2e:headed

# 방법 3: 일반 모드
npm run test:e2e
```

---

## 📝 주요 명령어

### 테스트 실행
```bash
npm run verify              # 설정 검증
npm run test:e2e            # 모든 테스트 (headless)
npm run test:e2e:headed     # 브라우저 보면서 실행
npm run test:e2e:ui         # UI 모드 (추천!)
npm run test:e2e:debug      # 디버그 모드
```

### 특정 테스트만 실행
```bash
npx playwright test login.spec.ts
npx playwright test canvas-basic.spec.ts
npx playwright test -g "로그인"  # 이름으로 필터
```

### 리포트 및 도구
```bash
npm run test:report         # HTML 리포트 보기
npm run test:codegen        # 코드 생성기 (셀렉터 찾기)
```

---

## ⚠️ 실제 환경에 맞게 수정하기

### 1. 셀렉터 수정 (중요!)

현재 테스트의 셀렉터는 **일반적인 형태**입니다. 실제 XGEN DOM 구조에 맞게 수정해야 합니다.

**방법 1: Playwright 코드 생성기 사용 (추천)**
```bash
npm run test:codegen http://localhost:3000/login
```
- 브라우저가 열립니다
- 실제로 클릭/입력하면 코드가 자동 생성됩니다
- 생성된 셀렉터를 복사하여 Page Object에 붙여넣기

**방법 2: Chrome DevTools 사용**
1. 페이지에서 F12 (개발자 도구)
2. Elements 탭에서 요소 검사
3. 셀렉터 복사

**수정할 파일:**
- [tests/e2e/pages/LoginPage.ts](tests/e2e/pages/LoginPage.ts:8-12) - 로그인 페이지 셀렉터
- [tests/e2e/pages/CanvasPage.ts](tests/e2e/pages/CanvasPage.ts:23-27) - 캔버스 페이지 셀렉터

### 2. URL 경로 확인

실제 XGEN 라우팅에 맞게 수정:
```typescript
// tests/e2e/pages/LoginPage.ts 등에서
await page.goto('/login');   // 실제 로그인 경로
await page.goto('/canvas');  // 실제 캔버스 경로
```

### 3. 테스트 계정 생성

XGEN 서버에 테스트 전용 계정을 생성하고 `.env.test`에 입력하세요.

---

## 🤖 AI 기능 사용하기

### 1. 셀프힐링 테스트 (추천)

셀렉터가 변경되어도 자동으로 찾아줍니다:

```typescript
import { LoginPage } from '../pages/LoginPage';

test('셀프힐링 로그인', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();

  // 셀프힐링 기능 사용
  await loginPage.loginWithSelfHealing('test@example.com', 'password123');
});
```

학습된 셀렉터는 `tests/data/self-healing-knowledge.json`에 자동 저장됩니다.

### 2. AI 테스트 생성

```typescript
import { testGenerator } from './tests/ai/core/test-generator';

const testCode = await testGenerator.generateTest(
  '로그인 후 캔버스에서 ChatGPT 노드 추가하는 테스트'
);

console.log(testCode);
```

### 3. 비용 관리

처음에는 꼭 필요한 AI 기능만 활성화하세요:

```bash
# .env.test에서
ENABLE_SELF_HEALING=true              # 추천 - 가장 유용
ENABLE_AI_TEST_GENERATION=true        # 테스트 작성 시 유용
ENABLE_AI_VISUAL_VALIDATION=false     # 나중에 필요시
ENABLE_ANOMALY_DETECTION=false        # 나중에 필요시
```

---

## 📚 문서 가이드

### 시작하기
- **처음 시작**: [QUICK_START.md](QUICK_START.md) ← 5분 만에 시작
- **상세 가이드**: [GETTING_STARTED.md](GETTING_STARTED.md)

### 개발하기
- **개발 방법**: [QA/DEVELOPMENT_GUIDE.md](QA/DEVELOPMENT_GUIDE.md) - 전체 코드 포함
- **테스트 시나리오**: [QA/TEST_SCENARIOS.md](QA/TEST_SCENARIOS.md) - 50+ 케이스
- **AI 기능**: [QA/AI_FEATURES.md](QA/AI_FEATURES.md) - AI 상세 설명
- **아키텍처**: [QA/ARCHITECTURE.md](QA/ARCHITECTURE.md) - 시스템 설계

---

## 🎯 추가 구현할 테스트 (우선순위)

현재 13개 테스트 케이스가 작성되어 있습니다. 다음 테스트를 추가로 구현하세요:

### 우선순위 1 - 인증
- ✅ 로그인 (완료)
- ⬜ 로그아웃
- ⬜ 회원가입
- ⬜ 비밀번호 재설정

### 우선순위 2 - 캔버스 기본
- ✅ 페이지 로드 (완료)
- ✅ 노드 추가 (완료)
- ⬜ 노드 삭제
- ⬜ 노드 연결 (부분 완료)
- ⬜ 워크플로우 로드

### 우선순위 3 - 캔버스 고급
- ⬜ 워크플로우 실행
- ⬜ 템플릿 사용
- ⬜ 에러 처리

전체 50+ 시나리오는 [TEST_SCENARIOS.md](QA/TEST_SCENARIOS.md) 참조

---

## 💡 개발 워크플로우

### 일반적인 개발 흐름

1. **Page Object 작성** (또는 기존 것 수정)
   ```typescript
   // tests/e2e/pages/NewPage.ts
   export class NewPage {
     constructor(page: Page) { }
     async doSomething() { }
   }
   ```

2. **테스트 케이스 작성**
   ```typescript
   // tests/e2e/specs/new/feature.spec.ts
   test('새 기능 테스트', async ({ page }) => {
     const newPage = new NewPage(page);
     await newPage.doSomething();
     expect(...).toBeTruthy();
   });
   ```

3. **테스트 실행**
   ```bash
   npm run test:e2e:ui
   ```

4. **실패 시 디버깅**
   - UI 모드에서 단계별 실행
   - 또는 `npm run test:e2e:debug`

5. **셀렉터가 자주 변경되면 셀프힐링 적용**

---

## 🐛 문제 해결

### "Cannot find module" 에러
```bash
npm install
```

### "Browser not found" 에러
```bash
npx playwright install
```

### 테스트가 타임아웃됨
1. XGEN 서버가 실행 중인지 확인
2. `TEST_BASE_URL`이 올바른지 확인
3. `.env.test`에서 `TEST_TIMEOUT=120000` (2분)으로 늘리기

### 셀렉터를 찾을 수 없음
```bash
# 코드 생성기로 올바른 셀렉터 찾기
npm run test:codegen http://localhost:3000
```

### AI 기능이 작동하지 않음
1. `.env.test`에서 `ANTHROPIC_API_KEY` 확인
2. API 키가 유효한지 확인: https://console.anthropic.com/
3. 잔액 확인

---

## 🎓 학습 자료

### Playwright 배우기
- [공식 문서](https://playwright.dev/)
- [Best Practices](https://playwright.dev/docs/best-practices)
- UI 모드로 시작하는 것이 가장 쉽습니다!

### 코드 생성기로 빠른 시작
```bash
npm run test:codegen http://localhost:3000
```
브라우저에서 클릭하면 코드가 자동 생성됩니다.

---

## 📞 도움받기

- 문서 확인: [QUICK_START.md](QUICK_START.md), [GETTING_STARTED.md](GETTING_STARTED.md)
- Playwright 문서: https://playwright.dev/
- 팀 멤버에게 문의

---

## 🎉 다음 단계

### 지금 바로 시작하세요!

```bash
# 1. API 키 설정
# .env.test 파일 수정

# 2. XGEN 서버 실행 (다른 터미널)
cd xgen-frontend && npm run dev

# 3. 첫 테스트 실행
npm run test:e2e:ui
```

**[QUICK_START.md](QUICK_START.md)를 열어 5분 안에 시작하세요!**

---

행운을 빕니다! 🚀
