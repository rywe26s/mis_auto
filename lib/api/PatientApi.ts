import { APIRequestContext, expect } from '@playwright/test';
import { ApiEndpoints } from '../../config/endpoints.config';

export class PatientApi {
  constructor(private apiContext: APIRequestContext) {}

  async getPatientAppoinment() {
    const response = await this.apiContext.get(ApiEndpoints.patient.appointments);
    expect(response.ok()).toBeTruthy();
    return response.json();
  }

}