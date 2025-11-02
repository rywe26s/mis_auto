import { expect, test } from "../../fixtures/fixtures";
import { DataGenerator } from "../../test-data/DataGenerator";
import { parseRequestParams } from "../../utils/parsers";
import { step, description, tags, severity, owner, attachment } from 'allure-js-commons';


test.describe('Пациент', () => {

  test.only('Консультации', async ({ patientSession }) => {

    await description('Этот тест проверяет что-то');
    await owner('Иван Иванов');
    await tags('smoke', 'auth');
    await severity('critical');

    await step('1. Авторизоваться и перейти в список консультаций', async () => {
      await patientSession.appointmentsPage.goto();
    })

    await step('2. Получается список консультаций через api', async () => {
      const response = await patientSession.api.getPatientAppoinment();
      console.log(response)
    })

  });

  test('Гость видит публичные новости', async ({ sshLogsRepo }) => {
    const someData = await sshLogsRepo.findLatestLogByRequestType('patCreate');
    console.log('Запись из SSH БД:', someData);

  });

  test('Проверяем логи в основной (прямой) БД', async ({ directLogsRepo }) => {

    const patientData = {
      firstName: 'Иван',
      lastName: 'Лютиков',
      middleName: 'Владимрович',
      birthDate: '1982-11-03',
      sex: 'm',
      phone: '79827521415'
    };

    const logEntry = await directLogsRepo.findLatestLogByRequestType('registerClient');

    expect(logEntry, 'Запись в логе должна быть найдена').not.toBeNull();

    expect(logEntry!.response_code).toBe(200);

    const successMessage = JSON.parse(logEntry!.success_message!);
    expect(successMessage.code).toBe('SUCCESS');

    const externalId = successMessage.external_patient_id;
    console.log('Найден external_patient_id:', externalId);

    expect(externalId).toBeDefined();

    const actualParams = parseRequestParams(logEntry!.request_params);
    console.log('Распарсенные параметры:', actualParams);

    expect(actualParams.lastName).toBe(patientData.lastName);
    expect(actualParams.firstName).toBe(patientData.firstName);
    expect(actualParams.middleName).toBe(patientData.middleName);
    expect(actualParams.phone).toContain(patientData.phone);
    expect(actualParams.sex).toContain(patientData.sex);
    expect(actualParams.birthday).toContain(patientData.birthDate);
  });
});