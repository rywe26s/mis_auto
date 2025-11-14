import { APIRequestContext } from '@playwright/test';
import { ApiEndpoints } from '../../config/endpoints.config';
import { PatientData } from '../../scripts/generate-patients';
import { mapBirthDateToApiFormat } from '../../utils/data.mappers';
import { BaseAPI } from './BaseAPI';
import { BookingApiResponse } from './types';

export class PatientApi extends BaseAPI {
  constructor(apiContext: APIRequestContext, readonly data: PatientData) {
    super(apiContext);
  }

  async getPatientAppoinment() {
    const responseJson = await this.get(ApiEndpoints.patient.appointments);
    return responseJson;
  }

  async bookAppointment(slotId: string, treatmentId?: string, expectError: boolean = false) {
    const payload = {
      "communicationType": "VIDEO",
      "isChild": false,
      "assistanceId": "1",
      "familyRelationId": null,
      "anonymously": false,
      "recipientPatientId": null,
      "needSaveVideo": true,
      "treatmentId": treatmentId || null
    };

    const responseJson: any = await this.post(`/api/schedule/${slotId}`,
      { data: payload },
      expectError
    );

    return responseJson;
  }

  async signPersonalConsent(citizenship: string = 'рф') {
    console.log(`[PatientApi] Подписываю согласие для ${this.data.phone}...`);
    const apiBDate = mapBirthDateToApiFormat(this.data.birthDate);

    const payload = {
      lastName: this.data.lastName,
      firstName: this.data.firstName,
      middleName: this.data.midName,
      birthDate: apiBDate,
      phone: this.data.phone,
      citizenship: citizenship
    };

    await this.post(`/api/patient/personalConsent`,
      { data: payload }
    );

  }

  async cancelAppointment(appointmentId: string, comment: string = 'Запишусь на другое время') {
    console.log(`[PatientApi] Отменяю запись ${appointmentId} с причиной: ${comment}`);

    const payload = {
      comment: comment
    };

    await this.post(`/api/appointment/cancel/${appointmentId}`, {
      data: payload
    });
  }
}