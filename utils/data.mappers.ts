import { PatientData } from "../test-data/DataGenerator";

export const monthMap: { [key: string]: string } = {
    'январь': '01',
    'февраль': '02',
    'март': '03',
    'апрель': '04',
    'май': '05',
    'июнь': '06',
    'июль': '07',
    'август': '08',
    'сентябрь': '09',
    'октябрь': '10',
    'ноябрь': '11',
    'декабрь': '12'
};


export function mapSexToLogFormat(sex: 'мужчина' | 'женщина'): 'm' | 'f' {
    return sex === 'мужчина' ? 'm' : 'f';
}

export function mapBirthDateToLogFormat(birthDate: PatientData['birthDate']): string {
    const month = monthMap[birthDate.month.toLowerCase()];

    if (!month) {
        throw new Error(`Неизвестное название месяца: ${birthDate.month}`);
    }
    const day = birthDate.day.padStart(2, '0');
    const uiDateString = `${birthDate.year}-${month}-${day}`;
    const uiDateObj = new Date(uiDateString + 'T12:00:00Z');

    uiDateObj.setUTCDate(uiDateObj.getUTCDate() - 1);

    return uiDateObj.toISOString().split('T')[0]; // '1988-12-23'
}

export function mapSexToApiFormat(sex: 'мужчина' | 'женщина'): 'MALE' | 'FEMALE' {
    return sex === 'мужчина' ? 'MALE' : 'FEMALE';
}

export function mapBirthDateToApiFormat(birthDate: PatientData['birthDate']): string {
    const month = monthMap[birthDate.month.toLowerCase()];
    if (!month) {
        throw new Error(`Неизвестное название месяца: ${birthDate.month}`);
    }
    const day = birthDate.day.padStart(2, '0');
    return `${birthDate.year}-${month}-${day}`;
}