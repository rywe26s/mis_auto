import { test } from "../../fixtures/fixtures";
import { description } from 'allure-js-commons';
import { descriptions } from '../../test-data/test-cases';
import { ApiErrorResponse, BookingApiResponse } from "../../lib/api/types";

const doctorName = process.env.GEMOTEST_DOCTOR_NAME!;
const freeTreatmentId = process.env.GEMOTEST_FREE_TREATMENT_ID!;
const paidTreatmentId = process.env.GEMOTEST_PAID_TREATMENT_ID;


test.describe('Гемотест', () => {
  test.describe.configure({ mode: 'serial' });
  let appointmentIdForCancel: string;
  let appointmentIdForMisTest: string;
  let slotIdForMisTest: string;

  test.beforeAll(async ({ adminApi }) => {
    await adminApi.setIntegrationType('GEMOTEST');
  });

  
  test('E2E-REG-1: Успешная регистрация', async ({ guest, patientData, logVerifier }) => {
    description(descriptions["E2E-REG-1"]);
    await guest.registrationPage.register(patientData);
    await logVerifier.assertSuccessfulRegistration(patientData);
  });

  test('API-GEM-REG-1: Успешная регистрация', async ({ guestApi, patientData, logVerifier }) => {
    description(descriptions["API-GEM-REG-1"]);
    await guestApi.register(patientData)
    await logVerifier.assertSuccessfulRegistration(patientData);
  });

  test('E2E-BOOK-1: Успешная запись на прием', async ({ patientSession, freeSlotGemotest, logVerifier, eternalPatientData }) => {
    description(descriptions["E2E-BOOK-1"]);
    const patientId = eternalPatientData.patientId!;
    const { bookingResponse, slotId } = await patientSession.bookingPage.bookAppointment(doctorName, freeSlotGemotest);
    await logVerifier.assertSuccessfulBooking(bookingResponse, patientId, slotId, freeTreatmentId);
  });

  test('API-GEM-BOOK-1: Успешная запись на платный прием', async ({ patientApi, eternalPatientData, freeSlotGemotest, logVerifier }) => {
    description(descriptions["API-GEM-BOOK-1"]);
    const patientId = eternalPatientData.patientId!;
    const bookingResponse = await patientApi.bookAppointment(freeSlotGemotest.id, paidTreatmentId) as BookingApiResponse;
    await logVerifier.assertSuccessfulBooking(bookingResponse, patientId, freeSlotGemotest.id, paidTreatmentId);
    appointmentIdForCancel = bookingResponse.id;
  });

  test('API-GEM-BOOK-2: Успешная запись на бесплатный прием', async ({ patientApi, eternalPatientData, freeSlotGemotest, logVerifier }) => {
    description(descriptions["API-GEM-BOOK-2"]);
    const patientId = eternalPatientData.patientId!;
    const bookingResponse = await patientApi.bookAppointment(freeSlotGemotest.id, freeTreatmentId) as BookingApiResponse;
    await logVerifier.assertSuccessfulBooking(bookingResponse, patientId, freeSlotGemotest.id, freeTreatmentId);
    appointmentIdForMisTest = bookingResponse.id;
    slotIdForMisTest = freeSlotGemotest.id;
  });

  test('API-GEM-CANCEL-1: Успешная отмена приема пациентом', async ({ patientApi, logVerifier }) => {
    description(descriptions["API-GEM-CANCEL-1"]);
    await patientApi.cancelAppointment(appointmentIdForCancel, "Запишусь на другое время");
    await logVerifier.assertSuccessfulCancellation(appointmentIdForCancel, "ОтказПациента");
  });

  test('API-GEM-BOOK-3: Слот уже занят в МИС', async ({ adminApi, patientApi, eternalPatientData, logVerifier }) => {
    description("Проверка ошибки, когда слот свободен у нас, но занят в МИС");
    await adminApi.setIntegrationType('DEFAULT');
    await patientApi.cancelAppointment(appointmentIdForMisTest, 'Запишусь на другое время');
    await adminApi.setIntegrationType('GEMOTEST');
    const errorResponse = await patientApi.bookAppointment(slotIdForMisTest, freeTreatmentId, true) as ApiErrorResponse;
    await logVerifier.assertMisSlotIsBusy(errorResponse, slotIdForMisTest, eternalPatientData.patientId!);
  });

  /*   test.afterAll(async ({ adminApi }) => {
      await adminApi.setIntegrationType('DEFAULT');
    });
   */
});