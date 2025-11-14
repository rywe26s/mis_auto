import { PatientData } from "../scripts/generate-patients";

export const eternalPatient: PatientData = {
    phone: process.env.PATIENT_USERNAME!,
    password: process.env.PATIENT_PASSWORD!,
    patientId: "393165",
    email: 'rywes@yandex.ru',
    lastName: 'Гемотест',
    firstName: 'Автотест',
    midName: 'Пациент',
    sex: 'мужчина',
    birthDate: {
        day: '03',
        month: '10',
        year: '1998',
    }
};