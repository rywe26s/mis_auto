import { Page, APIRequestContext } from '@playwright/test';
import { PatientAppointmentsPage } from '../../pages/patient/PatientAppointmentsPage';
import { PatientApi } from '../api/PatientAPI';


export class PatientSession {
  readonly appointmentsPage: PatientAppointmentsPage;

  readonly api: PatientApi;
  
  constructor(readonly page: Page, apiContext: APIRequestContext) {
    this.appointmentsPage = new PatientAppointmentsPage(page);
    
    this.api = new PatientApi(apiContext);
  }

}
