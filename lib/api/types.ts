export interface BookingApiResponse {
    id: string;
    state: string;
    doctor: {
        id: string;
    };
    treatment: {
        id: string;
        name: string;
    };
}

export interface BookingData {
    patientId: string;
    slotId: string;
    doctorId: string;
    treatmentId: string;
    appointmentId: string;
}

export interface ApiErrorResponse {
    type: string;
    code: string;
    message: string;
    additional?: any;
}