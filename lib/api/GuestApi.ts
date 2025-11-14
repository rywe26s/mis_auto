import { APIRequestContext, expect } from '@playwright/test';
import { ApiEndpoints } from '../../config/endpoints.config';
import { PatientData } from '../../scripts/generate-patients';
import { monthMap } from '../../utils/data.mappers';
import { BaseAPI } from './BaseAPI';


export class GuestApi extends BaseAPI {
    constructor(apiContext: APIRequestContext) {
        super(apiContext);
     }

    async register(patient: PatientData) {
        const apiSex = patient.sex === 'мужчина' ? 'MALE' : 'FEMALE';
        const monthNumber = monthMap[patient.birthDate.month.toLowerCase()];
        const dayPadded = patient.birthDate.day.padStart(2, '0');
        const apiBDate = `${patient.birthDate.year}-${monthNumber}-${dayPadded}`;

        await this.get(ApiEndpoints.guest.checkCode, {
            params: {
                code: "0000",
                phone: patient.phone
            }
        });

        const payload = {
            signNewsletterConsent: true,
            phone: patient.phone,
            email: patient.email,
            password: patient.password,
            code: "0000",
            lastName: patient.lastName,
            firstName: patient.firstName,
            midName: patient.midName,
            sex: apiSex,
            anonymous: false,
            bDate: apiBDate,
            deviceType: "BROWSER",
            oauthSupported: true
        };

        const response = await this.post(ApiEndpoints.guest.registration, {
            data: payload
        });

        return response;
    }

    async getPublicNews() {
        const response = await this.get(ApiEndpoints.guest.news);
        return response;
    }

}

