import { APIRequestContext, APIResponse } from '@playwright/test';

type RequestOptions = Parameters<APIRequestContext['get']>[1];
const logPrefix = '[API]';

class APIError extends Error {
  constructor(message: string, public status: number, public responseBody: string) {
    super(message);
    this.name = 'APIError';
  }
}


export class BaseAPI {
  protected readonly request: APIRequestContext;

  constructor(request: APIRequestContext) {
    this.request = request;
  }

  private log(message: string): void {
    console.log(`${logPrefix} ${message}`);
  }

  private logData(type: string, data: any): void {
    if (!data) {
      this.log(`   ${type}: [Empty]`);
      return;
    }

    const rawLimit = process.env.API_LOG_LIMIT;
    let maxLogLength: number;

    if (rawLimit === '0' || rawLimit?.toLowerCase() === 'false') {
      maxLogLength = Infinity;
    } else {
      maxLogLength = parseInt(rawLimit || '500', 10);
    }

    let logString: string;

    if (type === 'Params') {
      try {
        const params = new URLSearchParams(data as Record<string, string>);
        logString = '?' + params.toString();
      } catch (e) {
        logString = '[Could not serialize params]';
      }
    }

    else if (typeof data === 'string') {
      try {
        logString = JSON.stringify(JSON.parse(data), null, 2);
      } catch (e) {
        logString = data;
      }
    } else {
      try {
        logString = JSON.stringify(data, null, 2);
      } catch (e) {
        this.log(`   ${type}: [Non-serializable data]`);
        return;
      }
    }

    if (logString.length > maxLogLength && maxLogLength !== Infinity) {
      logString = `${logString.substring(0, maxLogLength)}... [TRUNCATED]`;
    }

    this.log(`   ${type}: ${logString}`);
  }

  private async handleResponse(method: string, url: string, response: APIResponse, expectError: boolean = false): Promise<any> {
    const responseBody = await response.text();

    if (response.ok()) {
      this.log(`<< ${response.status()} [${method} ${url}]`);
      this.logData('Response Body', responseBody);

      if (responseBody.length === 0) return undefined;
      try {
        return JSON.parse(responseBody);
      } catch (e: any) {
        this.log(`JSON parse error from [${method} ${url}]: ${e.message}`);
        throw new Error(`Failed to parse JSON response for ${method} ${url}`);
      }
    }

    if (expectError) {
      this.log(`${response.status()} EXPECTED ERROR [${method} ${url}]`);
      this.logData('Error Body', responseBody);
      try {
        return JSON.parse(responseBody);
      } catch (e) {
        return responseBody;
      }
    }

    this.log(`${response.status()} UNEXPECTED ERROR [${method} ${url}]`);
    this.logData('Error Body', responseBody);

    throw new APIError(
      `API Error: ${method} ${url} failed with status ${response.status()}`,
      response.status(),
      responseBody
    );
  }

  async get(url: string, options?: RequestOptions, expectError: boolean = false): Promise<any> {
    this.log(`>> GET ${url}`);
    this.logData('Params', options?.params);
    const response = await this.request.get(url, options);
    return this.handleResponse('GET', url, response, expectError);
  }

  async post(url: string, options?: RequestOptions, expectError: boolean = false): Promise<any> {
    this.log(`>> POST ${url}`);
    this.logData('Payload', options?.data);
    const response = await this.request.post(url, options);
    return this.handleResponse('POST', url, response, expectError);
  }

  async put(url: string, options?: RequestOptions, expectError: boolean = false): Promise<any> {
    this.log(`>> PUT ${url}`);
    this.logData('Payload', options?.data);
    const response = await this.request.put(url, options);
    return this.handleResponse('PUT', url, response, expectError);
  }

  async patch(url: string, options?: RequestOptions, expectError: boolean = false): Promise<any> {
    this.log(`>> PATCH ${url}`);
    this.logData('Payload', options?.data);
    const response = await this.request.patch(url, options);
    return this.handleResponse('PATCH', url, response, expectError);
  }

  async delete(url: string, options?: RequestOptions, expectError: boolean = false): Promise<any> {
    this.log(`>> DELETE ${url}`);
    this.logData('Payload', options?.data);
    this.logData('Params', options?.params);
    const response = await this.request.delete(url, options);
    return this.handleResponse('DELETE', url, response, expectError);
  }
}