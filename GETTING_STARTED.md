# 🎯 프로젝트 시작 가이드

XGEN AI E2E 테스트 자동화 프레임워크가 성공적으로 구축되었습니다!

## ✅ 완료된 작업

### 1. 프로젝트 기본 구조 ✅
```
✅ package.json - 의존성 및 스크립트 설정
✅ tsconfig.json - TypeScript 설정
✅ playwright.config.ts - Playwright 설정
✅ .env.test - 환경 변수 템플릿
✅ .gitignore - Git 제외 파일
```

### 2. AI 핵심 기능 구현 ✅
```
✅ tests/ai/core/ai-client.ts - Claude/OpenAI 클라이언트
✅ tests/ai/core/test-generator.ts - AI 테스트 생성기
✅ tests/ai/core/self-healing.ts - 셀프힐링 셀렉터
✅ tests/ai/models/prompts/ - AI 프롬프트 템플릿
✅ tests/config/ai.config.ts - AI 설정
```

### 3. Page Object Models ✅
```
✅ tests/e2e/pages/LoginPage.ts - 로그인 페이지
✅ tests/e2e/pages/CanvasPage.ts - 캔버스 페이지
```

### 4. 테스트 케이스 ✅
```
✅ tests/e2e/specs/auth/login.spec.ts - 로그인 테스트 (7개 케이스)
✅ tests/e2e/specs/canvas/canvas-basic.spec.ts - 캔버스 기본 테스트 (6개 케이스)
```

### 5. 문서 ✅
```
✅ README.md - 프로젝트 메인 문서
✅ QUICK_START.md - 빠른 시작 가이드
✅ QA/README.md - 프로젝트 개요
✅ QA/TEST_SCENARIOS.md - 테스트 시나리오 (50+ 케이스)
✅ QA/DEVELOPMENT_GUIDE.md - 개발 가이드
✅ QA/AI_FEATURES.md - AI 기능 명세
✅ QA/ARCHITECTURE.md - 아키텍처 설계
```

## 🚀 다음 단계

### Step 1: 패키지 설치

```bash
# 의존성 설치
npm install

# Playwright 브라우저 설치
npx playwright install
```

### Step 2: API 키 설정

1. Anthropic API 키 발급
   - https://console.anthropic.com/ 접속
   - API 키 생성
   - 월 $5 크레딧으로 시작 가능

2. `.env.test` 파일 수정
```bash
ANTHROPIC_API_KEY=sk-ant-your-actual-key-here
TEST_BASE_URL=http://localhost:3000
TEST_USER_EMAIL=your-test-email@example.com
TEST_USER_PASSWORD=your-test-password
```

### Step 3: XGEN 서버 실행

```bash
# XGEN 프로젝트 루트에서
cd xgen-frontend
npm run dev
```

### Step 4: 첫 테스트 실행

```bash
# 테스트 프로젝트 디렉토리에서
cd AI-driven-UI-test

# UI 모드로 테스트 (추천)
npm run test:e2e:ui

# 또는 일반 모드
npm run test:e2e:headed
```

## 🔧 실제 환경에 맞게 수정하기

### 1. 셀렉터 수정 (중요!)

현재 테스트의 셀렉터는 일반적인 형태입니다. 실제 XGEN DOM 구조에 맞게 수정해야 합니다.

**방법 1: Playwright 코드 생성기 사용**
```bash
npm run test:codegen http://localhost:3000/login
```

**방법 2: Chrome DevTools로 확인**
1. 페이지에서 우클릭 → 검사
2. Elements 탭에서 요소 확인
3. 셀렉터 복사

**수정할 파일:**
- [tests/e2e/pages/LoginPage.ts](tests/e2e/pages/LoginPage.ts)
- [tests/e2e/pages/CanvasPage.ts](tests/e2e/pages/CanvasPage.ts)

### 2. URL 경로 확인

실제 XGEN 라우팅에 맞게 수정:
```typescript
await page.goto('/login');   // 실제 로그인 경로
await page.goto('/canvas');  // 실제 캔버스 경로
await page.goto('/main');    // 실제 메인 경로
```

### 3. 테스트 계정 생성

XGEN 서버에 테스트 전용 계정을 생성하고 `.env.test`에 입력하세요.

## 📝 추가 테스트 작성

### 우선순위 테스트 (순서대로 구현 권장)

1. **인증 테스트** (80% 완료)
   - ✅ 로그인
   - ⬜ 로그아웃
   - ⬜ 회원가입
   - ⬜ 비밀번호 재설정

2. **캔버스 기본 테스트** (30% 완료)
   - ✅ 페이지 로드
   - ✅ 노드 추가
   - ⬜ 노드 삭제
   - ⬜ 노드 연결
   - ⬜ 워크플로우 저장/로드

3. **캔버스 고급 테스트**
   - ⬜ 워크플로우 실행
   - ⬜ 템플릿 사용
   - ⬜ Undo/Redo
   - ⬜ 줌/패닝

4. **챗봇 테스트**
   - ⬜ 메시지 전송/수신
   - ⬜ 세션 관리

5. **관리자 테스트**
   - ⬜ 사용자 관리
   - ⬜ 통계 확인

전체 테스트 시나리오는 [QA/TEST_SCENARIOS.md](QA/TEST_SCENARIOS.md) 참조

## 🤖 AI 기능 활용

### 테스트 자동 생성 예시

```bash
# AI로 테스트 생성 (예정)
npm run ai:generate-test
```

### 셀프힐링 활용

셀렉터가 변경되어도 자동으로 찾아줍니다:
```typescript
await loginPage.loginWithSelfHealing(email, password);
```

학습된 셀렉터는 `tests/data/self-healing-knowledge.json`에 저장됩니다.

## 📊 개발 워크플로우

### 일반적인 개발 흐름

1. **Page Object 작성**
   ```typescript
   // tests/e2e/pages/NewPage.ts
   export class NewPage {
     constructor(page: Page) { ... }
     async doSomething() { ... }
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
   ```bash
   npm run test:e2e:debug
   ```

5. **셀렉터가 자주 변경되면 셀프힐링 적용**

## 🎓 학습 자료

### Playwright 문서
- [공식 문서](https://playwright.dev/)
- [Best Practices](https://playwright.dev/docs/best-practices)

### 프로젝트 문서
- [빠른 시작](QUICK_START.md) - 5분 만에 시작
- [개발 가이드](QA/DEVELOPMENT_GUIDE.md) - 상세 개발 방법
- [AI 기능](QA/AI_FEATURES.md) - AI 기능 상세 설명

## 💡 팁 & 트릭

### 1. UI 모드 활용
```bash
npm run test:e2e:ui
```
가장 좋은 디버깅 방법입니다. 단계별 실행, 시간 여행, DOM 확인 등이 가능합니다.

### 2. 특정 테스트만 실행
```bash
npx playwright test login.spec.ts
npx playwright test -g "로그인"  # 이름으로 필터링
```

### 3. 코드 생성기로 빠른 시작
```bash
npm run test:codegen http://localhost:3000
```
브라우저 액션을 기록하여 코드를 자동 생성합니다.

### 4. 스크린샷/비디오 확인
테스트 실패 시 자동으로 저장됩니다:
- `test-results/` 디렉토리 확인
- HTML 리포트에서 확인: `npm run test:report`

### 5. 비용 절감
처음에는 꼭 필요한 AI 기능만 활성화:
```bash
ENABLE_SELF_HEALING=true              # 추천
ENABLE_AI_TEST_GENERATION=true        # 테스트 작성 시
ENABLE_AI_VISUAL_VALIDATION=false     # 나중에
ENABLE_ANOMALY_DETECTION=false        # 나중에
```

## 🐛 자주 발생하는 문제

### 문제: "Cannot find module"
```bash
해결: npm install
```

### 문제: "Browser not found"
```bash
해결: npx playwright install
```

### 문제: 테스트가 타임아웃
```bash
해결:
1. XGEN 서버가 실행 중인지 확인
2. TEST_BASE_URL이 올바른지 확인
3. TEST_TIMEOUT을 늘려보세요 (기본 60초)
```

### 문제: 셀렉터를 찾을 수 없음
```bash
해결:
1. 코드 생성기로 올바른 셀렉터 찾기
   npm run test:codegen http://localhost:3000

2. 또는 셀프힐링 사용
   await loginPage.loginWithSelfHealing(...)
```

### 문제: AI 기능이 작동하지 않음
```bash
해결:
1. .env.test에서 ANTHROPIC_API_KEY 확인
2. API 키 유효성 확인
3. 잔액 확인: https://console.anthropic.com/
```

## 📞 도움 받기

- [개발 가이드](QA/DEVELOPMENT_GUIDE.md) 참조
- [Playwright 문서](https://playwright.dev/) 확인
- 팀 멤버에게 문의

## 🎉 성공!

축하합니다! 이제 AI 기반 테스트 자동화 프레임워크를 사용할 준비가 되었습니다.

다음 단계:
1. ✅ 패키지 설치
2. ✅ API 키 설정
3. ✅ 첫 테스트 실행
4. ⬜ 실제 XGEN에 맞게 셀렉터 수정
5. ⬜ 추가 테스트 작성

**[QUICK_START.md](QUICK_START.md)를 읽고 시작하세요!**
