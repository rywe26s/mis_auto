import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';


interface DaySchedule {
  id: string;
  date: string;
  vacantSlots: number;
}

interface Slot {
  id: string;
  time: string;
  vacant: boolean;
}

interface DaySlots {
  id: string;
  date: string;
  slots: Slot[];
}

const BASE_URL = process.env.BASE_URL;
const USERNAME = process.env.PATIENT_USERNAME;
const PASSWORD = process.env.PATIENT_PASSWORD;

const DOCTOR_ID = process.env.DOCTOR_ID;
if (!DOCTOR_ID) {
  console.error('[SlotGen] ОШИБКА: DOCTOR_ID не задан! (Запусти через "npm run generate:slots:gemotest")');
  process.exit(1);
}

const ASSISTANCE_ID = process.env.ASSISTANCE_ID;
if (!ASSISTANCE_ID) {
  console.error(`[SlotGen] ОШИБКА: ASSISTANCE_ID не задан для доктора ${DOCTOR_ID}!`);
  process.exit(1);
}

const IS_FREE = process.env.IS_FREE === 'true' || false;

const LOGIN_PATH = '/api/patient/oauth/login';
const SCHEDULE_PATH = `/api/doctor/${DOCTOR_ID}/schedules`;
const SLOT_PATH = '/api/schedule/';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUTPUT_FILE = path.join(__dirname, '..', 'test-data', `slot-pool-${DOCTOR_ID}.json`);


async function getAuthToken(api: any): Promise<string> {
  console.log(`[SlotGen] Логинюсь вечным пациентом (${USERNAME})...`);
  const response = await api.post(LOGIN_PATH, {
    username: USERNAME,
    password: PASSWORD,
    deviceType: 'BROWSER',
  });
  if (!response.data || !response.data.accessToken) {
    throw new Error('[SlotGen] Не удалось залогиниться!');
  }
  return response.data.accessToken;
}

async function generateSlotPool() {
  console.log(`[SlotGen] Начинаю сбор слотов для врача ${DOCTOR_ID}...`);
  const allFreeSlots: { id: string, time: string, date: string }[] = []; 

  const api = axios.create({ baseURL: BASE_URL });
  
  try {
    const token = await getAuthToken(api);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    const schedulesResponse = await api.get(SCHEDULE_PATH, {
      params: {
        start: '2025-11-01', // todo сделать динамическими
        end: '2025-11-30',
        assistanceId: ASSISTANCE_ID,
        isFree: IS_FREE,
      },
    });

    const days = schedulesResponse.data as DaySchedule[];
    const sortedDays = days.sort((a, b) => a.date.localeCompare(b.date));

    for (const day of sortedDays) {
      if (day.vacantSlots === 0) continue;

      console.log(`[SlotGen]... Обрабатываю день ${day.date} (ID: ${day.id})`);

      const slotsResponse = await api.get(`${SLOT_PATH}${day.id}`);
      const schedule = slotsResponse.data as DaySlots;

      const sortedVacantSlots = schedule.slots
        .filter(slot => slot.vacant)
        .sort((a, b) => a.time.localeCompare(b.time));
      
      for (const slot of sortedVacantSlots) {
        allFreeSlots.push({
            id: slot.id,
            time: slot.time,
            date: schedule.date
        });
      }
    }

    const outputDir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allFreeSlots, null, 2));
    
    console.log(`[SlotGen] Готово! Найдено ${allFreeSlots.length} слотов (отсортировано). Сохранено в ${OUTPUT_FILE}`);

  } catch (error) {
    const err = error as any;
    if (err.response) {
      console.error(`[SlotGen] Ошибка API (врач: ${DOCTOR_ID}):`, err.response.status, err.response.data);
    } else {
      console.error(`[SlotGen] Ошибка при сборе слотов (врач: ${DOCTOR_ID}):`, err.message);
    }
    process.exit(1);
  }
}

generateSlotPool();