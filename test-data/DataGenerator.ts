import { fakerRU as faker } from '@faker-js/faker';


export interface PatientData {
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

function generateNewPatient(): PatientData {

    const uniqueTimestamp = new Date().getTime();
    const uniquePhoneSuffix = uniqueTimestamp.toString().slice(-9);

    const data: PatientData = {
        phone: `79${uniquePhoneSuffix}`,
        email: 'test@test.ru',
        password: 'test123!',
        lastName: faker.person.lastName('male'),
        firstName: faker.person.firstName('male'),
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

export const DataGenerator = {
    generateNewPatient,
};