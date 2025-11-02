import 'dotenv/config';

export type Role = 'patient' | 'doctor' | 'admin';

export interface RoleConfig {
    username: string;
    password: string;
}

export const RoleConfigs: Record<Role, RoleConfig> = {
    patient: {
        username: process.env.PATIENT_USERNAME!,
        password: process.env.PATIENT_PASSWORD!,
    },
    doctor: {
        username: process.env.DOCTOR_USERNAME!,
        password: process.env.DOCTOR_PASSWORD!,
    },
    admin: {
        username: process.env.ADMIN_USERNAME!,
        password: process.env.ADMIN_PASSWORD!,
    },
};