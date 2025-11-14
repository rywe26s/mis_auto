import { faker } from '@faker-js/faker/locale/ru';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface PatientData {
  patientId?: string;
  phone: string;
  email: string;
  password: string;
  lastName: string;
  firstName: string;
  midName: string;
  sex: 'мужчина' | 'женщина';
  birthDate: {
    day: string;
    month: string;
    year: string;
  };
}

function generateNewPatient(i: number): PatientData {
  const uniqueTimestamp = new Date().getTime();
  const uniquePhoneSuffix = (uniqueTimestamp + i).toString().slice(-9);

  const lastName = faker.person.lastName('male');
  const firstName = faker.person.firstName('male');

  const data: PatientData = {
    phone: `79${uniquePhoneSuffix}`,
    email: `test${uniquePhoneSuffix}@test.ru`,
    //email: `${firstName.toLowerCase()}.${uniqueTimestamp + i}@test.ru`,
    password: 'test123!',
    lastName: lastName,
    firstName: firstName,
    midName: 'Тестович',
    sex: 'мужчина',
    birthDate: {
      day: faker.number.int({ min: 1, max: 28 }).toString(),
      month: faker.date.month(),
      year: faker.number.int({ min: 1900, max: 2000 }).toString(),
    },
  };

  return data;
}

export function generateDataPool() {
  const TOTAL_PATIENTS = 10;
  const OUTPUT_FILE = path.join(__dirname, '..', 'test-data', 'patient-pool.json');

  console.log(`[DataGen] Начинаю генерацию ${TOTAL_PATIENTS} пациентов...`);
  
  const patientsPool: PatientData[] = [];
  for (let i = 0; i < TOTAL_PATIENTS; i++) {
    patientsPool.push(generateNewPatient(i));
  }

  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(patientsPool, null, 2));

  console.log(`[DataGen] Готово! Данные сохранены в ${OUTPUT_FILE}`);
}

generateDataPool();