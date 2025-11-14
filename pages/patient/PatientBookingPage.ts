import { Page, Locator, expect } from '@playwright/test';
import { steps } from '../../test-data/test-cases';
import { PagePaths } from '../../config/endpoints.config';
import { step } from 'allure-js-commons';
import { BookingApiResponse } from '../../lib/api/types';
import { SlotData } from '../../fixtures/fixtures';

export class PatientBookingPage {
    readonly searchInput: Locator;
    readonly doctorCard: (doctorName: string) => Locator;
    readonly bookButtonStep1: (doctorName: string) => Locator;
    readonly allDoctorCards: Locator;
    readonly slotModal: Locator;
    readonly slotTimeButton: (time: string) => Locator;
    readonly bookButtonStep2: Locator;

    readonly confirmationScreen: Locator;
    readonly communicationDropdown: Locator;
    readonly termsCheckbox: Locator;
    readonly payButton: Locator;

    constructor(private readonly page: Page) {
        this.searchInput = this.page.getByRole('textbox');
        this.doctorCard = (doctorName: string) => this.page.locator('tm-doctor-info-view').filter({ has: this.page.getByRole('link', { name: doctorName }) });
        this.bookButtonStep1 = (doctorName: string) => this.doctorCard(doctorName).getByRole('button', { name: 'Записаться на приём' });
        this.allDoctorCards = this.page.locator('tm-doctor-info');
        this.slotModal = this.page.locator('tm-choose-slot');
        this.slotTimeButton = (time: string) => this.slotModal.locator('span.slot.available', { hasText: new RegExp(`^${time}$`) });
        this.bookButtonStep2 = this.slotModal.locator('tm-button[secondary]');

        this.confirmationScreen = this.page.locator('div[class*="tm-card-panel"]', { hasText: 'Запись на консультацию' });
        this.communicationDropdown = this.confirmationScreen.getByText('Предпочтительный способ связи')
        this.termsCheckbox = this.confirmationScreen.locator('input[id="termsCheckbox"]');
        this.payButton = this.confirmationScreen.getByRole('button', { name: 'Оплатить' });
    }

    async goto() {
        return step(steps["E2E-BOOK-1"][0], async () => {
            await this.page.goto(PagePaths.patient.doctors);
        });
    }

    async searchDoctor(doctorName: string) {
        return step(`Найти врача по ФИО: ${doctorName}`, async () => {
            await expect(this.searchInput).toBeVisible();
            await this.searchInput.fill(doctorName);
            //const searchTimeout = 10000;
            await expect(this.allDoctorCards, "Ожидание, пока список отфильтруется").toHaveCount(1);
        });
    }

    async selectDoctor(doctorName: string) {
        return step(steps["E2E-BOOK-1"][1], async () => {
            await this.bookButtonStep1(doctorName).click();
        });
    }

    async selectSlotTime(time: string) {
        return step(`Нажать на слот со временем ${time}`, async () => {
            await expect(this.slotModal).toBeVisible();
            const slotButton = this.slotTimeButton(time);
            await expect(slotButton, `Слот на ${time} не найден или недоступен`).toBeVisible();
            await slotButton.click();
            await expect(slotButton).toHaveClass(/active/);
        });
    }

    async clickConfirmSlot() {
        return step(steps["E2E-BOOK-1"][2], async () => {
            await expect(this.slotModal).toBeVisible();
            await this.bookButtonStep2.click();
        });
    }

    async fillAndConfirmBooking(communicationType = 'Видео') {
        return step(steps["E2E-BOOK-1"][3], async () => {
            await expect(this.confirmationScreen).toBeVisible();
            await this.communicationDropdown.click();
            await this.page.getByRole('option', { name: communicationType }).click();
            await this.termsCheckbox.check({ force: true });

            const responsePromise = this.page.waitForResponse(
                response =>
                    response.url().includes('/api/schedule/') &&
                    response.request().method() === 'POST'
            );

            await this.payButton.click();

            const response = await responsePromise;
            const request = response.request();

            expect(response.status(), "API-запрос /api/schedule/... (бронирование) не вернул 200 OK").toBe(200);

            const urlParts = request.url().split('/');
            const slotId = urlParts[urlParts.length - 1];
            const bookingResponse = await response.json() as BookingApiResponse;
            return { bookingResponse, slotId };
        });
    }

    async assertBookingIsSuccessful() {
        return step(steps["E2E-BOOK-1"][4], async () => {
            await expect(this.page).toHaveURL(new RegExp(`/medline/patient/appointment/\\d+$`));
            await expect(this.page.locator('tm-chat-messages')).toBeVisible();
        });
    }

    async bookAppointment(doctorName: string, slotToBook: SlotData) {
        const formattedTime = slotToBook.time.substring(0, 5);

        await this.goto();
        await this.searchDoctor(doctorName);
        await this.selectDoctor(doctorName);
        await this.selectSlotTime(formattedTime);
        await this.clickConfirmSlot();
        const { bookingResponse, slotId } = await this.fillAndConfirmBooking();
        await this.assertBookingIsSuccessful();
        
        expect(slotId, "ID слота из API-ответа не совпадает с ID из фикстуры").toBe(slotToBook.id);
            
        return { bookingResponse, slotId };
    }
}