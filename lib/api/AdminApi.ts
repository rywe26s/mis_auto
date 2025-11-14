import { APIRequestContext } from '@playwright/test';
import { BaseAPI } from './BaseAPI';

interface ApiSetting {
  key: string;
  value: string;
}

interface SettingsPayload {
  settings: ApiSetting[];
}

export class AdminApi extends BaseAPI {
  constructor(apiContext: APIRequestContext) {
    super(apiContext);
  }

  async getAllSettings(): Promise<ApiSetting[]> {
    const responseJson = await this.get('/api/setting');
    return responseJson as ApiSetting[];
  }

  async updateAllSettings(settingsArray: ApiSetting[]): Promise<void> {
    const payload: SettingsPayload = {
      settings: settingsArray
    };
    await this.put('/api/setting', {
      data: payload
    });
  }

  async setIntegrationType(newType: 'GEMOTEST' | 'DEFAULT' | string) {
    console.log(`[AdminApi] Меняю INTEGRATION_TYPE на "${newType}"...`);
    const currentSettingsArray = await this.getAllSettings();

    const settingToChange = currentSettingsArray.find(
      s => s.key === 'INTEGRATION_TYPE'
    );

    if (!settingToChange) {
      throw new Error('[AdminApi] Не удалось найти ключ "INTEGRATION_TYPE" в настройках');
    }

    settingToChange.value = newType;
    await this.updateAllSettings(currentSettingsArray);
    console.log(`[AdminApi] INTEGRATION_TYPE успешно установлен`);
  }

  async updatePatientBalance(patientId: string, amount: number, comment: string = "пополнение для автотестов") {
    const payload = {
      amount: amount,
      comment: comment
    };

    console.log(`[AdminApi] Пополняю баланс (${amount}) для пациента ${patientId}...`);

    const responseJson = await this.post(`/api/admin/patient/${patientId}/updateBalance`,
      { data: payload }
    );

    return responseJson;
  }
}