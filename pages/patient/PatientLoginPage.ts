import { type Page, type Locator } from '@playwright/test';
import { PagePaths } from '../../config/endpoints.config';

export class LoginPage {
  readonly page: Page;
  readonly loginButton: Locator;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.loginButton = page.getByText('Ввести логин и пароль');
    this.usernameInput = page.locator('input[name="username"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.submitButton = page.getByRole('button', { name: 'Продолжить' });
  }

  async goto() {
    await this.page.goto(PagePaths.guest.login);
  }

  async login(username: string, password: string) {
    await this.loginButton.click();
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}

