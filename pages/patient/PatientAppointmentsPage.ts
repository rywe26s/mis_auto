import { type Page } from '@playwright/test';
import { PagePaths } from '../../config/endpoints.config';

export class PatientAppointmentsPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto(PagePaths.patient.appointments);
  }
}