const rawSteps = {

    "E2E-REG-1": [
        "1. Открыть страницу регистрации",
        "2. Заполнить Шаг 1 (телефон, email, пароль)",
        "3. Подтвердить номер через SMS-код (0000)",
        "4. Заполнить Шаг 2 (ФИО, пол, дата рождения)",
        "5. Заполнить персональные данные",
        "6. Проверить, что произошел переход на главную страницу (choose)"
    ],

    "E2E-BOOK-1": [
        "1. Открыть страницу записи",
        "2. Выбрать врача",
        "3. Выбрать слот",
        "4. Подтвердить условия, способ связи и 'Оплатить'",
        "5. Проверить, что произошел переход в чат"
    ],

    "API-GEM-REG-1": [
        "1. Регистрация прием через /api/patient/register"
    ],

    "API-GEM-BOOK-1": [
        "1. Запись на прием через /api/schedule/ на платную услугу"
    ],

    "API-GEM-BOOK-2": [
        "1. Запись на прием через /api/schedule/ на бесплатную услугу"
    ],

    "API-GEM-BOOK-3": [
        "1. Интеграция включена",
        "2. Записываемся на прием",
        "3. Выключаем итеграцию",
        "4. Отменяем прием",
        "5. Включаем итеграцию",
        "6. Записываемся снова в это же время"
    ],

    "API-GEM-CANCEL-1": [
        "1. Отмена консультации через /api/appointment/cancel/"
    ]

};

export const descriptions = {
    "E2E-REG-1": rawSteps["E2E-REG-1"].join('\n'),
    "E2E-BOOK-1": rawSteps["E2E-BOOK-1"].join('\n'),
    "API-GEM-REG-1": rawSteps["API-GEM-REG-1"].join('\n'),
    "API-GEM-BOOK-1": rawSteps["API-GEM-BOOK-1"].join('\n'),
    "API-GEM-BOOK-2": rawSteps["API-GEM-BOOK-2"].join('\n'),
    "API-GEM-BOOK-3": rawSteps["API-GEM-BOOK-3"].join('\n'),
    "API-GEM-CANCEL-1": rawSteps["API-GEM-CANCEL-1"].join('\n')
};

export const steps = rawSteps;