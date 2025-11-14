import { test as base, expect, request } from '@playwright/test';
import { Guest } from '../lib/sessions/Guest';
import { PatientSession } from '../lib/sessions/PatientSession';
import { TokenManager } from '../lib/auth/TokenManager';
import { PatientApi } from '../lib/api/PatientAPI';
import { GuestApi } from '../lib/api/GuestAPI';
import { DatabaseHelper } from '../lib/db/DatabaseHelper';
import { LogsRepository } from '../lib/db/LogsRepository';
import { directDbConfig, sshDbConfig } from '../config/database.config';
import { RoleConfigs } from '../config/auth.config';
import { LogVerifier } from '../utils/log.verifier';
import allPatientsJson from '../test-data/patient-pool.json' assert { type: 'json' };
import { eternalPatient } from '../test-data/eternal-patient';
const allPatients = allPatientsJson as PatientData[];
import { createRequire } from 'module';
import { AdminApi } from '../lib/api/AdminApi';
import { PatientData } from '../scripts/generate-patients';


const require = createRequire(import.meta.url);
const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

interface RegistrationResponse {
    state: string;
    patientId: string;
    accessToken: string;
    refreshToken: string;
}

interface RegisteredPatientSession {
    data: PatientData;
    response: RegistrationResponse;
}

export interface SlotData {
    id: string;
    time: string;
    date: string;
}

type MyFixtures = {
    guest: Guest;
    guestApi: GuestApi;
    patientSession: PatientSession;
    patientApi: PatientApi;
    directLogsRepo: LogsRepository;
    sshLogsRepo: LogsRepository;
    logVerifier: LogVerifier;
    patientData: PatientData;
    registrationResult: RegisteredPatientSession;
    newPatientSession: PatientSession;
    newPatientApi: PatientApi;
    freeSlotGemotest: SlotData;
    eternalPatientData: PatientData;
};

type MyWorkerFixtures = {
    tokenManager: TokenManager;
    directDb: DatabaseHelper;
    sshDb: DatabaseHelper;
    patientPool: PatientData[];
    adminApi: AdminApi;
};

function loadSlotPool(doctorId: string): SlotData[] {
    try {
        return require(`../test-data/slot-pool-${doctorId}.json`) as SlotData[];
    } catch (e) {
        console.warn(`[Fixture] Пул слотов 'slot-pool-${doctorId}.json' не найден
        Убедись, что 'npm run generate:slots:${doctorId}' отработал`);
        return [];
    }
}

const gemotestDoctorId = process.env.GEMOTEST_DOCTOR_ID!;
let allSlotsGemotest = gemotestDoctorId ? loadSlotPool(gemotestDoctorId) : [];

export const test = base.extend<MyFixtures, MyWorkerFixtures>({

    patientPool: [async ({ }, use, testInfo) => {
        const totalWorkers = testInfo.config.workers;
        const poolSize = allPatients.length;
        const chunkSize = Math.ceil(poolSize / totalWorkers);
        const startIndex = testInfo.workerIndex * chunkSize;
        const endIndex = Math.min((testInfo.workerIndex + 1) * chunkSize, poolSize);
        const workerPool = allPatients.slice(startIndex, endIndex);

        console.log(`[Worker ${testInfo.workerIndex}] Нарезал себе ${workerPool.length} пациентов`);

        await use(workerPool);
    }, { scope: 'worker' }],

    patientData: async ({ patientPool }, use) => {
        const myPatient = patientPool.shift();
        if (!myPatient) {
            throw new Error(`[Worker] В пуле данных закончились пациенты! Увеличь TOTAL_PATIENTS.`);
        }
        await use(myPatient);
    },


    freeSlotGemotest: async ({ }, use) => {
        const slot = allSlotsGemotest.shift();
        if (!slot) {
            throw new Error(`[Fixture] Свободные слоты в пуле 'allSlotsGemotest' закончились!`);
        }
        console.log(`[Fixture] Взят слот: ${slot.date} ${slot.time} (ID: ${slot.id})`);
        await use(slot);
    },

    tokenManager: [async ({ }, use) => {
        const tokenManager = await TokenManager.getInstance(RoleConfigs);
        await use(tokenManager);
        await TokenManager.dispose();
    }, { scope: 'worker' }],

    directDb: [async ({ }, use) => {
        const dbHelper = new DatabaseHelper();
        await dbHelper.connectDirectly(directDbConfig);
        await use(dbHelper);
        await dbHelper.disconnect();
    }, { scope: 'worker' }],

    sshDb: [async ({ }, use) => {
        const dbHelper = new DatabaseHelper();
        await dbHelper.connectViaSsh(sshDbConfig);
        await use(dbHelper);
        await dbHelper.disconnect();
    }, { scope: 'worker' }],

    directLogsRepo: async ({ directDb }, use) => {
        await use(new LogsRepository(directDb));
    },

    sshLogsRepo: async ({ sshDb }, use) => {
        await use(new LogsRepository(sshDb));
    },

    logVerifier: async ({ directLogsRepo }, use) => {
        const verifier = new LogVerifier(directLogsRepo);
        await use(verifier);
    },

    registrationResult: async ({ guestApi, patientData, adminApi }, use) => {
        const newPatient = patientData;
        let apiResponse: RegistrationResponse;
        apiResponse = await guestApi.register(newPatient);
        const newPatientId = apiResponse.patientId;
        await adminApi.updatePatientBalance(newPatientId, 10000);
        await use({ data: newPatient, response: apiResponse });

    },

    newPatientSession: async ({ browser, registrationResult }, use) => {
        const token = registrationResult.response.accessToken;
        const patientData = registrationResult.data;

        const context = await browser.newContext({
            extraHTTPHeaders: { 'Authorization': `Bearer ${token}` },
        });
        const page = await context.newPage();
        const apiContext = context.request;

        await use(new PatientSession(page, apiContext, patientData));

        await context.close();
    },

    eternalPatientData: [async ({ }, use) => {
        await use(eternalPatient);
    }, { scope: 'test' }],

    newPatientApi: async ({ registrationResult }, use) => {
        const token = registrationResult.response.accessToken;
        const patientData = registrationResult.data;


        const apiContext = await request.newContext({
            baseURL: process.env.BASE_URL,
            extraHTTPHeaders: { 'Authorization': `Bearer ${token}` },
        });

        const patientApi = new PatientApi(apiContext, patientData);
        await patientApi.signPersonalConsent();

        await use(patientApi);
        await apiContext.dispose();
    },

    guest: async ({ page, request }, use) => {
        await use(new Guest(page, request));
    },

    guestApi: async ({ }, use) => {
        const apiContext = await request.newContext({
            baseURL: process.env.BASE_URL,
        });
        await use(new GuestApi(apiContext));
        await apiContext.dispose();
    },

    patientSession: async ({ browser, tokenManager, eternalPatientData }, use) => {
        const token = await tokenManager.getToken('patient');

        const context = await browser.newContext({
            extraHTTPHeaders: { 'Authorization': `Bearer ${token}` },
        });
        const page = await context.newPage();
        const apiContext = context.request;
        await use(new PatientSession(page, apiContext, eternalPatientData));
        await context.close();
    },

    patientApi: async ({ tokenManager, eternalPatientData }, use) => {
        const token = await tokenManager.getToken('patient');
        const apiContext = await request.newContext({
            baseURL: process.env.BASE_URL,
            extraHTTPHeaders: { 'Authorization': `Bearer ${token}` },
        });
        await use(new PatientApi(apiContext, eternalPatientData));
        await apiContext.dispose();
    },

    adminApi: [async ({ tokenManager }, use) => {
        const token = await tokenManager.getToken('admin');

        const apiContext = await request.newContext({
            baseURL: process.env.BASE_URL,
            extraHTTPHeaders: { 'Authorization': `Bearer ${token}` },
        });

        await use(new AdminApi(apiContext));
        await apiContext.dispose();
    }, { scope: 'worker' }],

});

export { expect };