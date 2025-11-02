import { Pool, QueryResult } from 'pg';
import { createTunnel } from 'tunnel-ssh';
import 'dotenv/config';


export type DirectDBConfig = {
    type: 'direct';
    host?: string;
    port?: number;
    database?: string;
    user?: string;
    password?: string;
};

export type SshDBConfig = {
    type: 'ssh';
    ssh: {
        host: string;
        port?: number;
        username: string;
        password?: string;
    };
    db: {
        host: string;
        port: number;
        database: string;
        user: string;
        password?: string;
    };
};


export class DatabaseHelper {
    private pool: Pool | null = null;
    private sshTunnel: any = null;

    constructor() { }

    public async connectDirectly(config: DirectDBConfig): Promise<void> {
        if (this.pool) {
            console.warn('[DatabaseHelper] Попытка повторного подключения. Соединение уже существует.');
            return;
        }
        console.log(`[DatabaseHelper] Устанавливаю прямое подключение к ${config.host}...`);
        this.pool = new Pool(config);
        this.pool.on('error', (err, _client) => {
            console.error('Неожиданная ошибка в пуле соединений с БД', err);
        });
    }

    public async connectViaSsh(config: SshDBConfig): Promise<void> {
        if (this.pool) return;
        console.log(`[DatabaseHelper] Устанавливаю SSH-туннель к ${config.ssh.host}...`);

        const sshOptions = {
            host: config.ssh.host,
            port: config.ssh.port || 22,
            username: config.ssh.username,
            password: config.ssh.password,
        };

        const forwardOptions = {
            srcAddr: '127.0.0.1',
            srcPort: 0,
            dstAddr: config.db.host,
            dstPort: config.db.port,
        };

        try {
            const [server, _connection] = await createTunnel({ autoClose: true, reconnectOnError: true }, {}, sshOptions, forwardOptions);
            this.sshTunnel = server;
        } catch (error) {
            console.error('[DatabaseHelper] КРИТИЧЕСКАЯ ОШИБКА: Не удалось создать SSH-туннель!', error);
            throw error;
        }

        const actualTunnelPort = this.sshTunnel.address().port;
        console.log(`[DatabaseHelper] SSH-туннель успешно создан и слушает на порту: ${actualTunnelPort}`);

        console.log('[DatabaseHelper] Создаю пул соединений с БД через туннель...');
        this.pool = new Pool({
            ...config.db,
            host: '127.0.0.1',
            port: actualTunnelPort,
        });

        try {
            const client = await this.pool.connect();
            console.log('[DatabaseHelper] Тестовое подключение к БД через пул прошло успешно.');
            client.release();
        } catch (error) {
            console.error('[DatabaseHelper] ОШИБКА: Не удалось подключиться к БД через созданный пул!', error);
            throw error;
        }
    }

    public async query<T extends Record<string, any>>(queryText: string, params: any[] = []): Promise<QueryResult<T>> {
        if (!this.pool) {
            throw new Error('Подключение к БД не установлено. Вызовите connectDirectly() или connectViaSsh() перед выполнением запроса.');
        }

        const client = await this.pool.connect();
        try {
            const result = await client.query<T>(queryText, params);
            return result;
        } finally {
            client.release();
        }
    }

    public async disconnect(): Promise<void> {
        if (this.pool) {
            await this.pool.end();
            this.pool = null;
            console.log('[DatabaseHelper] Пул соединений с БД закрыт.');
        }
        if (this.sshTunnel && typeof this.sshTunnel.close === 'function') {
            this.sshTunnel.close();
            this.sshTunnel = null;
            console.log('[DatabaseHelper] SSH-туннель закрыт.');
        }
    }
}