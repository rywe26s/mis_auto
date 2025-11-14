import { expect, Locator, type Page } from '@playwright/test';
import { PagePaths } from '../../config/endpoints.config';
import { steps } from '../../test-data/test-cases';
import { step } from 'allure-js-commons';
import { PatientData } from '../../scripts/generate-patients';


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
  readonly bookAfterRegButton: Locator;
  readonly citizenshipInput: Locator;
  readonly saveCitizenshipButton: Locator;

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

    this.bookAfterRegButton = page.getByRole('button', { name: 'Записаться к врачу' });
    this.citizenshipInput = page.locator('input[name="citizenship"]');
    this.saveCitizenshipButton = page.getByRole('button', { name: 'Сохранить' });
  }

  async goto() {
    return step(steps["E2E-REG-1"][0], async () => {
      await this.page.goto(PagePaths.guest.registration);
    });
  }

  async fillRegistrationStep1(userData: Pick<PatientData, 'phone' | 'email' | 'password'>) {
    return step(steps["E2E-REG-1"][1], async () => {
      await this.phoneInput.fill(userData.phone);
      await this.emailInput.fill(userData.email);
      await this.passwordInput.fill(userData.password);
      await this.agreementCheckbox.check();
      await this.agreementPersonalCheckbox.check();
      await this.createButton.click();
    });
  }

  async verifySmsCode(code = '0000') {
    return step(steps["E2E-REG-1"][2], async () => {
      await this.codeInput.fill(code);
      await this.verifyButton.click();
    });
  }

  async fillRegistrationStep2(userData: Pick<PatientData, 'lastName' | 'firstName' | 'midName' | 'sex' | 'birthDate'>) {
    return step(steps["E2E-REG-1"][3], async () => {
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
      await this.bookAfterRegButton.click();
    });
  }

  async fillPersonalData(citizenship = 'РФ') {
    return step(steps["E2E-REG-1"][4], async () => {
      await this.citizenshipInput.fill(citizenship);
      await this.saveCitizenshipButton.click();
    });
  }

  async assertRedirectedToChoosePage() {
    return step(steps["E2E-REG-1"][5], async () => {
      await expect(this.page).toHaveURL(new RegExp(`/medline/patient/choose$`));
    });
  }

  async register(patientData: PatientData) {
    await this.goto();
    await this.fillRegistrationStep1(patientData);
    await this.verifySmsCode();
    await this.fillRegistrationStep2(patientData);
    await this.fillPersonalData();
    await this.assertRedirectedToChoosePage();
  }
}