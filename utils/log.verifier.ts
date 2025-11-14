import { expect } from '@playwright/test';
import { mapSexToLogFormat, mapBirthDateToLogFormat } from './data.mappers';
import { LogsRepository } from '../lib/db/LogsRepository';
import { parseRequestParams } from './parsers';
import { ApiErrorResponse, BookingApiResponse, BookingData } from '../lib/api/types';
import { PatientData } from '../scripts/generate-patients';



export class LogVerifier {
    constructor(private logsRepo: LogsRepository) { }

    async assertSuccessfulRegistration(expectedPatient: PatientData) {
        const logEntry = await this.logsRepo.findLatestLogByParam('registerClient', expectedPatient.phone);
        console.log('Зарегистрированный пациент:', expectedPatient);
        expect(logEntry, 'Запись в логе "registerClient" должна быть найдена').not.toBeNull();

        expect.soft(logEntry!.response_code, 'Response code лога должен быть 200').toBe(200);
        const successMessage = JSON.parse(logEntry!.success_message!);
        expect.soft(successMessage.code, 'Код в success_message должен быть "SUCCESS"').toBe('SUCCESS');
        const externalId = successMessage.external_patient_id;
        console.log('Найден external_patient_id:', externalId);
        expect.soft(externalId, 'external_patient_id должен существовать').toBeDefined();
        const actualParams = parseRequestParams(logEntry!.request_params);
        console.log('Распарсенные параметры для проверки:', actualParams);
        expect.soft(actualParams.lastName).toBe(expectedPatient.lastName);
        expect.soft(actualParams.firstName).toBe(expectedPatient.firstName);
        expect.soft(actualParams.middleName).toBe(expectedPatient.midName);
        expect.soft(actualParams.phone).toContain(expectedPatient.phone);
        expect.soft(actualParams.sex).toBe(mapSexToLogFormat(expectedPatient.sex));
        expect.soft(actualParams.birthday).toContain(mapBirthDateToLogFormat(expectedPatient.birthDate));
    }

    async assertSuccessfulBooking(apiResponse: BookingApiResponse, patientId: string, slotId: string, expectedTreatmentId?: string) {
        expect(apiResponse.id, "Ответ API должен вернуть ID").toBeDefined();
        expect(apiResponse.state).toBe("SCHEDULED");

        if (expectedTreatmentId) {
            expect(apiResponse.treatment.id, "ID услуги в ответе API не совпадает с ожидаемым").toBe(expectedTreatmentId);
        }
        const expectedData: BookingData = {
            patientId: patientId.toString(),
            slotId: slotId,
            doctorId: apiResponse.doctor.id,
            treatmentId: apiResponse.treatment.id,
            appointmentId: apiResponse.id
        };

        console.log('Ожидаемые данные для проверки (book_slot):', expectedData);

        const logEntry = await this.logsRepo.findLatestLogByParam('book_slot', slotId);
        expect(logEntry, 'Запись в логе "book_slot" должна быть найдена').not.toBeNull();

        expect.soft(logEntry!.response_code, 'Response code лога (book_slot) должен быть 200').toBe(200);
        const successMessage = JSON.parse(logEntry!.success_message!);
        expect.soft(successMessage.code, 'Код в success_message (book_slot) должен быть "SUCCESS"').toBe('SUCCESS');

        const actualParams = parseRequestParams(logEntry!.request_params);
        console.log('Распарсенные параметры для проверки (book_slot):', actualParams);
        expect.soft(actualParams.appointmentId, 'ID приема (appointmentId) в логе не совпадает').toBe(expectedData.appointmentId);
        expect.soft(actualParams.doctorId, 'ID доктора (doctorId) в логе не совпадает').toBe(expectedData.doctorId);
        expect.soft(actualParams.patientId, 'ID пациента (patientId) в логе не совпадает').toBe(expectedData.patientId);
        /* expect.soft(actualParams.treatmentId, 'ID услуги (treatmentId) в логе не совпадает').toBe(expectedData.treatmentId); */

        expect.soft(actualParams.slotIds, 'ID слота (slotIds) в логе не содержит ожидаемый').toContain(expectedData.slotId);
    }

    async assertSuccessfulCancellation(appointmentId: string, expectedReason: string = 'ОтказПациента') {
        console.log(`[LogVerifier] Проверяю лог отмены (release_slot) для записи ${appointmentId}...`);

        const logEntry = await this.logsRepo.findLatestLogByParam('release_slot', appointmentId);
        expect(logEntry, `Запись в логе "release_slot" для appointmentId ${appointmentId} должна быть найдена`).not.toBeNull();

        expect.soft(logEntry!.response_code, 'Response code лога (release_slot) должен быть 200').toBe(200);

        const successMessage = JSON.parse(logEntry!.success_message!);
        expect.soft(successMessage.code, 'Код в success_message (release_slot) должен быть "SUCCESS"').toBe('SUCCESS');

        const actualParams = parseRequestParams(logEntry!.request_params);
        console.log('Распарсенные параметры для проверки (release_slot):', actualParams);

        expect.soft(actualParams.appointmentId, 'ID приема (appointmentId) в логе не совпадает').toBe(appointmentId);
        expect.soft(actualParams.cancellationReason, 'Причина отмены (cancellationReason) в логе не совпадает').toBe(expectedReason);
    }

    async assertMisSlotIsBusy(apiErrorResponse: ApiErrorResponse, slotId: string, expectedPatientId: string) {
        console.log(`[LogVerifier] Проверяю API ответ (APPLICATION_ERROR) и лог (SLOT_IS_BUSY) для слота ${slotId}...`);
        expect(apiErrorResponse, "Ответ API не должен быть undefined").toBeDefined();
        expect.soft(apiErrorResponse.type, "Тип ошибки в ответе API").toBe("APPLICATION_ERROR");
        const rawMessage = apiErrorResponse.message;
        const normalizedMessage = rawMessage.replace(/\s/g, '');
        expect.soft(normalizedMessage, "Сообщение об ошибке API (без пробелов)").toContain(slotId);

        const logEntry = await this.logsRepo.findLatestLogByParam('book_slot', slotId);
        expect(logEntry, `Запись в логе "book_slot" для slotId ${slotId} должна быть найдена`).not.toBeNull();
        expect.soft(logEntry!.response_code, 'Response code лога (book_slot)').toBe(500);

        const errorMessage = JSON.parse(logEntry!.error_message!);
        expect.soft(errorMessage.code, 'Код в error_message (БД)').toBe('SLOT_IS_BUSY');

        const actualParams = parseRequestParams(logEntry!.request_params);
        expect.soft(actualParams.patientId, 'ID пациента (patientId) в логе').toBe(expectedPatientId);
    }
}