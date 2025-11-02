import { APIRequestContext, expect } from '@playwright/test';
import { PagePaths } from '../../config/endpoints.config';


export class GuestApi {
    constructor(private apiContext: APIRequestContext) { }

    async getPublicNews() {
        const response = await this.apiContext.get(PagePaths.guest.news);
        expect(response.ok()).toBeTruthy();
        return response.json();
    }

}

