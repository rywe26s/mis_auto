import { request, APIRequestContext } from "@playwright/test";
import { Role, RoleConfig } from '../../config/auth.config';
import { ApiEndpoints } from "../../config/endpoints.config";
import 'dotenv/config';

interface TokenState {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
}

export class TokenManager {
    private static instance: TokenManager;
    private static requestContext: APIRequestContext;
    private tokenCache = new Map<Role, TokenState>();
    private configs: Record<Role, RoleConfig>;

    private constructor(configs: Record<Role, RoleConfig>) {
        this.configs = configs;
    }

    public static async getInstance(configs: Record<Role, RoleConfig>): Promise<TokenManager> {
        if (!TokenManager.instance) {
            TokenManager.instance = new TokenManager(configs);
            TokenManager.requestContext = await request.newContext();
        }
        return TokenManager.instance;
    }

    public async getTokenData(role: Role): Promise<TokenState> {
        const cachedToken = this.tokenCache.get(role);

        if (!cachedToken) {
            console.log(`[TokenManager] Кэш для роли '${role}' пуст. Выполняю логин...`);
            const newState = await this._login(role);
            this.tokenCache.set(role, newState);
            return newState;
        }

        const isExpired = new Date().getTime() > cachedToken.expiresAt - 30000;
        if (isExpired) {
            console.log(`[TokenManager] Токен для роли '${role}' протух. Обновляю...`);
            const newState = await this._refreshToken(role, cachedToken.refreshToken);
            this.tokenCache.set(role, newState);
            return newState;
        }

        console.log(`[TokenManager] Возвращаю токен для роли '${role}' из кэша`);
        return cachedToken;
    }
    
    public async getToken(role: Role): Promise<string> {
        const tokenState = await this.getTokenData(role);
        return tokenState.accessToken;
    }

    private async _login(role: Role): Promise<TokenState> {
        const config = this.configs[role];
        const loginPath = ApiEndpoints.auth[role]?.login || ApiEndpoints.auth.staff.login;

        const response = await TokenManager.requestContext.post(`${process.env.BASE_URL}${loginPath}`, {
            data: { username: config.username, password: config.password, deviceType: 'BROWSER' },
        });

        if (!response.ok()) {
            throw new Error(`[TokenManager] Логин для '${role}' провалился со статусом ${response.status()}`);
        }

        const body = await response.json();
        return {
            accessToken: body.accessToken,
            refreshToken: body.refreshToken,
            expiresAt: new Date().getTime() + (body.accessTokenExpiresIn * 1000),
        };
    }
    
    private async _refreshToken(role: Role, refreshToken: string): Promise<TokenState> {
        const refreshPath = ApiEndpoints.auth[role]?.refresh || ApiEndpoints.auth.staff.refresh;

        const response = await TokenManager.requestContext.post(`${process.env.BASE_URL}${refreshPath}`, {
            data: { refreshToken },
        });

        if (!response.ok()) {
            console.warn(`[TokenManager] Не удалось обновить токен для '${role}'. Пробую залогиниться заново`);
            return this._login(role);
        }
        
        const body = await response.json();
        return {
            accessToken: body.accessToken,
            refreshToken: body.refreshToken,
            expiresAt: new Date().getTime() + (body.accessTokenExpiresIn * 1000),
        };
    }
    
    public static async dispose() {
        if (TokenManager.instance) {
            await TokenManager.requestContext.dispose();
            console.log('[TokenManager] Ресурсы очищены');
        }
    }
}