import { test as base, Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

type AuthFixtures = {
  authenticatedPage: Page;
  authenticatedContext: {
    page: Page;
    email: string;
  };
};

/**
 * 인증된 페이지 fixture
 * 로그인이 필수인 테스트에서 사용
 */
export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    // 환경변수에서 계정 정보 가져오기
    const email = process.env.TEST_USER_EMAIL || 'test@example.com';
    const password = process.env.TEST_USER_PASSWORD || 'password123';

    console.log('🔐 로그인 수행 중:', email);

    // 로그인 페이지로 이동
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await page.waitForLoadState('networkidle');

    // 로그인 수행
    await loginPage.login(email, password);

    // 로그인 완료 대기
    await page.waitForTimeout(5000);

    // 로그인 성공 확인
    const currentUrl = page.url();
    const isStillOnLoginPage = currentUrl.includes('/login');

    if (isStillOnLoginPage) {
      console.error('❌ 로그인 실패! 테스트를 계속할 수 없습니다.');
      console.error('⚠️ .env.test 파일에서 TEST_USER_EMAIL과 TEST_USER_PASSWORD를 실제 XGEN 계정으로 설정하세요');

      // 스크린샷 저장
      await page.screenshot({
        path: 'test-results/auth-fixture-login-failed.png',
        fullPage: true
      });

      throw new Error('로그인 실패: 실제 XGEN 계정으로 .env.test를 설정하세요');
    }

    console.log('✅ 로그인 성공! URL:', currentUrl);

    // 테스트에서 인증된 페이지 사용
    await use(page);

    // 테스트 완료 후 정리 (선택사항)
    // await page.close();
  },

  authenticatedContext: async ({ page }, use) => {
    // 로그인 정보와 함께 페이지 제공
    const email = process.env.TEST_USER_EMAIL || 'test@example.com';
    const password = process.env.TEST_USER_PASSWORD || 'password123';

    console.log('🔐 로그인 수행 중 (with context):', email);

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await page.waitForLoadState('networkidle');

    // 셀프힐링 로그인 사용
    await loginPage.loginWithSelfHealing(email, password);
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    const isStillOnLoginPage = currentUrl.includes('/login');

    if (isStillOnLoginPage) {
      console.error('❌ 셀프힐링 로그인 실패!');
      await page.screenshot({
        path: 'test-results/auth-fixture-selfhealing-failed.png',
        fullPage: true
      });
      throw new Error('로그인 실패: 실제 XGEN 계정으로 .env.test를 설정하세요');
    }

    console.log('✅ 셀프힐링 로그인 성공! URL:', currentUrl);

    await use({ page, email });
  },
});

export { expect } from '@playwright/test';
