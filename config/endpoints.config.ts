export const PagePaths = {
    guest: {
        login: '/medline/patient/login',
        registration: '/medline/patient/register',
        news: '/api/news/actual'
    },
    patient: {
        appointments: '/medline/patient/lk/appointments',
    },
};

export const ApiEndpoints = {
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