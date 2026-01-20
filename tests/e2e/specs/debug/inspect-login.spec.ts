import { test } from '@playwright/test';

/**
 * 디버그용 테스트: 로그인 페이지의 실제 DOM 구조 확인
 */
test.describe('로그인 페이지 구조 확인', () => {
  test('페이지 HTML 구조 출력', async ({ page }) => {
    await page.goto('http://localhost:3000/login');

    // 페이지가 로드될 때까지 대기
    await page.waitForLoadState('networkidle');

    // 전체 HTML 구조 확인
    const html = await page.content();
    console.log('\n=== 전체 HTML (처음 1000자) ===');
    console.log(html.slice(0, 1000));

    // Form 요소 찾기
    console.log('\n=== Form 요소 ===');
    const forms = await page.locator('form').all();
    console.log(`Form 개수: ${forms.length}`);

    // Input 요소 찾기
    console.log('\n=== Input 요소 ===');
    const inputs = await page.locator('input').all();
    console.log(`Input 개수: ${inputs.length}`);

    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      const type = await input.getAttribute('type');
      const name = await input.getAttribute('name');
      const id = await input.getAttribute('id');
      const placeholder = await input.getAttribute('placeholder');
      const className = await input.getAttribute('class');

      console.log(`\nInput ${i + 1}:`);
      console.log(`  type: ${type}`);
      console.log(`  name: ${name}`);
      console.log(`  id: ${id}`);
      console.log(`  placeholder: ${placeholder}`);
      console.log(`  class: ${className}`);
    }

    // Button 요소 찾기
    console.log('\n=== Button 요소 ===');
    const buttons = await page.locator('button').all();
    console.log(`Button 개수: ${buttons.length}`);

    for (let i = 0; i < buttons.length; i++) {
      const button = buttons[i];
      const type = await button.getAttribute('type');
      const text = await button.textContent();
      const className = await button.getAttribute('class');

      console.log(`\nButton ${i + 1}:`);
      console.log(`  type: ${type}`);
      console.log(`  text: ${text}`);
      console.log(`  class: ${className}`);
    }

    // data-testid 찾기
    console.log('\n=== data-testid 요소 ===');
    const testIds = await page.locator('[data-testid]').all();
    console.log(`data-testid 개수: ${testIds.length}`);

    for (const el of testIds) {
      const testId = await el.getAttribute('data-testid');
      console.log(`  - ${testId}`);
    }

    // 스크린샷 저장
    await page.screenshot({
      path: 'test-results/login-page-debug.png',
      fullPage: true
    });
    console.log('\n스크린샷 저장: test-results/login-page-debug.png');
  });

  test('이메일 입력 필드 찾기 시도', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');

    console.log('\n=== 이메일 입력 필드 찾기 시도 ===');

    // 여러 방법으로 이메일 필드 찾기 시도
    const selectors = [
      'input[name="email"]',
      'input[type="email"]',
      'input[placeholder*="이메일"]',
      'input[placeholder*="Email"]',
      'input[placeholder*="email"]',
      'input[id*="email"]',
      'input[id*="Email"]',
      '[data-testid="email-input"]',
      '[data-testid="email"]',
      'form input:nth-child(1)',
      'form input:first-child',
    ];

    for (const selector of selectors) {
      try {
        const element = page.locator(selector).first();
        const count = await page.locator(selector).count();

        if (count > 0) {
          const isVisible = await element.isVisible({ timeout: 1000 });
          console.log(`✅ ${selector}: 발견 (${count}개), 보임: ${isVisible}`);

          // 요소 정보 출력
          const attrs = {
            type: await element.getAttribute('type'),
            name: await element.getAttribute('name'),
            id: await element.getAttribute('id'),
            placeholder: await element.getAttribute('placeholder'),
          };
          console.log(`   속성:`, attrs);
        } else {
          console.log(`❌ ${selector}: 없음`);
        }
      } catch (error) {
        console.log(`❌ ${selector}: 에러`);
      }
    }
  });

  test('로그인 버튼 찾기 시도', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');

    console.log('\n=== 로그인 버튼 찾기 시도 ===');

    const selectors = [
      'button[type="submit"]',
      'button:has-text("로그인")',
      'button:has-text("Login")',
      'button:has-text("login")',
      'button:has-text("Sign in")',
      'button:has-text("signin")',
      '[data-testid="login-button"]',
      '[data-testid="submit-button"]',
      'form button',
      'button[type="button"]',
    ];

    for (const selector of selectors) {
      try {
        const element = page.locator(selector).first();
        const count = await page.locator(selector).count();

        if (count > 0) {
          const isVisible = await element.isVisible({ timeout: 1000 });
          const text = await element.textContent();
          console.log(`✅ ${selector}: 발견 (${count}개), 보임: ${isVisible}, 텍스트: "${text}"`);
        } else {
          console.log(`❌ ${selector}: 없음`);
        }
      } catch (error) {
        console.log(`❌ ${selector}: 에러`);
      }
    }
  });
});
