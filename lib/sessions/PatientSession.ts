import { Page, APIRequestContext } from '@playwright/test';
import { PatientApi } from '../api/PatientAPI';
import { PatientAppointmentsPage } from '../../pages/patient/PatientAppointmentsPage';
import { PatientBookingPage } from '../../pages/patient/PatientBookingPage';
import { PatientData } from '../../scripts/generate-patients';


export class PatientSession {
  readonly appointmentsPage: PatientAppointmentsPage;
  readonly bookingPage: PatientBookingPage;

  readonly api: PatientApi;

  constructor(readonly page: Page, apiContext: APIRequestContext, readonly data: PatientData) {
    this.appointmentsPage = new PatientAppointmentsPage(page);
    this.bookingPage = new PatientBookingPage(page);

    this.api = new PatientApi(apiContext, data);
  }

}
