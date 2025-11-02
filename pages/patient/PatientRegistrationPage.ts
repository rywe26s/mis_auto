import { expect, Locator, type Page } from '@playwright/test';
import { PagePaths } from '../../config/endpoints.config';

export interface PatientData {
  phone: string;
  email: string;
  password: string;
  lastName: string;
  firstName: string;
  midName: string;
  sex: 'мужчина' | 'женщина';
  birthDate: {
    day: string;
    month: string;
    year: string;
  };
}

export class PatientRegistrationPage {
  readonly phoneInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly agreementCheckbox: Locator;
  readonly agreementPersonalCheckbox: Locator;
  readonly createButton: Locator;

  readonly codeInput: Locator;
  readonly verifyButton: Locator;

  readonly lastNameInput: Locator;
  readonly firstNameInput: Locator;
  readonly midNameInput: Locator;
  readonly genderButton: (gender: 'мужчина' | 'женщина') => Locator;
  readonly dayDropdown: Locator;
  readonly monthDropdown: Locator;
  readonly yearDropdown: Locator;
  readonly finishButton: Locator;

  constructor(private readonly page: Page) {
    this.phoneInput = page.locator('input[name="phone"]');
    this.emailInput = page.locator('input[name="email"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.agreementCheckbox = page.locator('input[name="agreement"]');
    this.agreementPersonalCheckbox = page.locator('input[name="agreementPersonal"]');
    this.createButton = page.locator('button[type="submit"]');

    this.codeInput = page.locator('input[name="code"]');
    this.verifyButton = page.locator('button[type="submit"]');

    this.lastNameInput = page.locator('input[name="lastName"]');
    this.firstNameInput = page.locator('input[name="firstName"]');
    this.midNameInput = page.locator('input[name="midName"]');
    this.genderButton = (gender: 'мужчина' | 'женщина') => this.page.getByRole('button', { name: gender, exact: true });
    this.dayDropdown = page.locator('p-dropdown[name="day"]');
    this.monthDropdown = page.locator('p-dropdown[name="month"]');
    this.yearDropdown = page.locator('p-dropdown[name="year"]');
    this.finishButton = page.locator('button[type="submit"]');
  }

  async goto() {
    await this.page.goto(PagePaths.guest.registration);
  }

  async fillRegistrationStep1(userData: Pick<PatientData, 'phone' | 'email' | 'password'>) {
    await this.phoneInput.fill(userData.phone)
    await this.emailInput.fill(userData.email);
    await this.passwordInput.fill(userData.password);
    await this.agreementCheckbox.check();
    await this.agreementPersonalCheckbox.check();
    await this.createButton.click();
  }

  async verifySmsCode(code = '0000') {
    await this.codeInput.fill(code);
    await this.verifyButton.click();
  }

  async fillRegistrationStep2(userData: Pick<PatientData, 'lastName' | 'firstName' | 'midName' | 'sex' | 'birthDate'>) {
    await this.lastNameInput.fill(userData.lastName);
    await this.firstNameInput.fill(userData.firstName);
    await this.midNameInput.fill(userData.midName);
    await this.genderButton(userData.sex).click();
    //await this.page.getByRole('button', { name: 'Мужчина', exact: true }).click();
    await this.dayDropdown.click();
    await this.page.getByRole('option', { name: userData.birthDate.day, exact: true }).click();
    await this.monthDropdown.click();
    await this.page.getByRole('option', { name: userData.birthDate.month }).click();
    await this.yearDropdown.click();
    await this.page.getByRole('option', { name: userData.birthDate.year, exact: true }).click();
    await this.finishButton.click();
  }

  async registerNewPatient(patientData: PatientData) {
    await this.goto();
    await this.fillRegistrationStep1(patientData);
    await expect(this.codeInput).toBeVisible();
    await this.verifySmsCode();
    await expect(this.lastNameInput).toBeVisible();
    await this.fillRegistrationStep2(patientData);
  }
}