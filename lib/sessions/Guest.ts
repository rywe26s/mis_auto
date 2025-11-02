import { Page, APIRequestContext } from '@playwright/test';
import { PatientRegistrationPage } from '../../pages/patient/PatientRegistrationPage';
import { GuestApi } from '../api/GuestAPI';


export class Guest {
  readonly registrationPage: PatientRegistrationPage;
  readonly api: GuestApi;
  
  constructor(readonly page: Page, apiContext: APIRequestContext) {
    this.registrationPage = new PatientRegistrationPage(page);

    this.api = new GuestApi(apiContext);
  }

}
