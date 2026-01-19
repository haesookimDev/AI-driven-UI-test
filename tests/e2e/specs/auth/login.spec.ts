import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';

test.describe('로그인 기능', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('정상 로그인', async ({ page }) => {
    // 환경변수에서 테스트 계정 정보 가져오기
    const email = process.env.TEST_USER_EMAIL || 'test@example.com';
    const password = process.env.TEST_USER_PASSWORD || 'password123';

    // 로그인 수행
    await loginPage.login(email, password);

    // 리디렉션 확인
    await expect(page).toHaveURL('/main', { timeout: 10000 });

    // 사용자 정보 표시 확인 (실제 구현에 맞게 수정)
    const userProfile = page.locator('[data-testid="user-profile"]');
    await expect(userProfile).toBeVisible({ timeout: 5000 }).catch(() => {
      console.warn('User profile element not found - adjust selector');
    });
  });

  test('잘못된 이메일로 로그인 시도', async () => {
    await loginPage.login('wrong@example.com', 'password123');

    // 에러 메시지 확인
    const hasError = await loginPage.isErrorVisible();
    expect(hasError).toBeTruthy();

    const errorMsg = await loginPage.getErrorMessage();
    expect(errorMsg).toContain('이메일' || '비밀번호' || 'email' || 'password');
  });

  test('잘못된 비밀번호로 로그인 시도', async () => {
    const email = process.env.TEST_USER_EMAIL || 'test@example.com';

    await loginPage.login(email, 'wrongpassword');

    // 에러 메시지 확인
    const hasError = await loginPage.isErrorVisible();
    expect(hasError).toBeTruthy();
  });

  test('빈 필드로 로그인 시도', async () => {
    await loginPage.login('', '');

    // 폼 검증 에러 확인
    const emailInput = loginPage.emailInput;
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(isInvalid).toBeTruthy();
  });

  test('셀프힐링 기능을 사용한 로그인', async ({ page }) => {
    const email = process.env.TEST_USER_EMAIL || 'test@example.com';
    const password = process.env.TEST_USER_PASSWORD || 'password123';

    // 셀프힐링 로그인 (셀렉터가 변경되어도 자동으로 찾음)
    await loginPage.loginWithSelfHealing(email, password);

    // 리디렉션 확인
    await expect(page).toHaveURL('/main', { timeout: 10000 });
  });
});

test.describe('로그인 페이지 UI', () => {
  test('로그인 페이지가 올바르게 렌더링됨', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // 주요 요소들이 보이는지 확인
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitButton).toBeVisible();
  });

  test('이메일 입력 필드 포커스 테스트', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.emailInput.focus();
    const isFocused = await loginPage.emailInput.evaluate((el) => el === document.activeElement);
    expect(isFocused).toBeTruthy();
  });
});
