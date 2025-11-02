import { APIRequestContext, expect } from '@playwright/test';

type AdminSettings = {
  enableSuperButton?: boolean;
};

export class AdminApi {
  constructor(private apiContext: APIRequestContext) {}

  async applySettings(settings: AdminSettings): Promise<void> {
    console.log('[AdminApi] Устанавливаю новые настройки:', settings);
    const setResponse = await this.apiContext.post('/api/admin/settings', {
      data: settings,
    });

    expect.soft(setResponse.ok(), 'Запрос на установку настроек должен быть успешным').toBeTruthy();

    console.log('[AdminApi] Применяю настройки...');
    const reloadResponse = await this.apiContext.post('/api/admin/settings/reload');
    expect.soft(reloadResponse.ok(), 'Запрос на применение настроек должен быть успешным').toBeTruthy();
    
    console.log('[AdminApi] Настройки успешно применены.');
  }

}