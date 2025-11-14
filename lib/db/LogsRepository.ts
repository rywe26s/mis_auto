import { DatabaseHelper } from './DatabaseHelper';


export interface LogEntry {
    id: number;
    timestamp_: Date;
    request_type: string;
    request_params: string;
    response_timestamp: Date;
    response_code: number;
    error_message: string | null;
    success_message: string | null;
}

export class LogsRepository {
    constructor(private db: DatabaseHelper) { }

    async findLatestLogByParam(requestType: string, paramValue: string): Promise<LogEntry | null> {
        const query = `
        SELECT * FROM mis_log
        WHERE request_type = $1
        AND request_params LIKE $2
        ORDER BY timestamp_ DESC
        LIMIT 1`;

        const result = await this.db.query<LogEntry>(query, [requestType, `%${paramValue}%`]);

        if (result.rowCount === 0) {
            return null;
        }
        return result.rows[0];
    }
}