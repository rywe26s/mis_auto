export const PagePaths = {
    guest: {
        login: '/medline/patient/login',
        registration: '/medline/patient/register',
    },
    patient: {
        appointments: '/medline/patient/lk/appointments',
        doctors: 'medline/patient/1/doctors/all'
    },
};

export const ApiEndpoints = {
    guest: {
        news: '/api/news/actual',
        registration: '/api/patient/register',
        checkCode: '/api/patient/checkcode'
    },
    auth: {
        patient: {
            login: "/api/patient/oauth/login",
            refresh: "/api/patient/oauth/refreshToken",
        },
        staff: {
            login: "/api/auth/oauth/login",
            refresh: "/api/auth/oauth/refresh",
        }
    },
    patient: {
        appointments: '/api/appointment/meeting',
    },
    admin: {
        settings: '/api/admin/settings',
    },
};