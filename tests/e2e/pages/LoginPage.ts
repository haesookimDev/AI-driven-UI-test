import { Page, Locator } from '@playwright/test';
import { selfHealingLocator } from '../../ai/core/self-healing';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('input[name="email"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.submitButton = page.locator('button[type="submit"]');
    this.errorMessage = page.locator('.error-message');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  /**
   * 셀프힐링 기능을 사용한 로그인
   */
  async loginWithSelfHealing(email: string, password: string) {
    const emailField = await selfHealingLocator.find(this.page, {
      original: 'input[name="email"]',
      description: '이메일 입력 필드',
      fallbacks: [
        'input[type="email"]',
        'input[placeholder*="이메일"]',
        'input[placeholder*="Email"]',
        'form input:nth-child(1)',
      ],
    });

    const passwordField = await selfHealingLocator.find(this.page, {
      original: 'input[name="password"]',
      description: '비밀번호 입력 필드',
      fallbacks: [
        'input[type="password"]',
        'input[placeholder*="비밀번호"]',
        'input[placeholder*="Password"]',
        'form input:nth-child(2)',
      ],
    });

    const submitBtn = await selfHealingLocator.find(this.page, {
      original: 'button[type="submit"]',
      description: '로그인 버튼',
      fallbacks: [
        'button:has-text("로그인")',
        'button:has-text("Login")',
        '.login-button',
        '[data-testid="login-button"]',
      ],
    });

    await emailField.fill(email);
    await passwordField.fill(password);
    await submitBtn.click();
  }

  async getErrorMessage(): Promise<string> {
    return (await this.errorMessage.textContent()) || '';
  }

  async isErrorVisible(): Promise<boolean> {
    return await this.errorMessage.isVisible({ timeout: 3000 }).catch(() => false);
  }

  async waitForRedirect(expectedUrl: string = '/main', timeout: number = 10000) {
    await this.page.waitForURL(expectedUrl, { timeout });
  }
}
