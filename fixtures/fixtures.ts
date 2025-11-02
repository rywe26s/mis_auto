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


type MyFixtures = {
    guest: Guest;
    guestApi: GuestApi;
    patientSession: PatientSession;
    patientApi: PatientApi;
    directLogsRepo: LogsRepository;
    sshLogsRepo: LogsRepository;
};

type MyWorkerFixtures = {
    tokenManager: TokenManager;
    directDb: DatabaseHelper;
    sshDb: DatabaseHelper;
};

export const test = base.extend<MyFixtures, MyWorkerFixtures>({

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

    patientSession: async ({ browser, tokenManager }, use) => {
        const token = await tokenManager.getToken('patient');
        const context = await browser.newContext({
            extraHTTPHeaders: { 'Authorization': `Bearer ${token}` },
        });
        const page = await context.newPage();
        const apiContext = context.request;
        await use(new PatientSession(page, apiContext));
        await context.close();
    },

    patientApi: async ({ tokenManager }, use) => {
        const token = await tokenManager.getToken('patient');
        const apiContext = await request.newContext({
            baseURL: process.env.BASE_URL,
            extraHTTPHeaders: { 'Authorization': `Bearer ${token}` },
        });
        await use(new PatientApi(apiContext));
        await apiContext.dispose();
    },

});

export { expect };