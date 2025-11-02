import 'dotenv/config';
import { DirectDBConfig, SshDBConfig } from '../lib/db/DatabaseHelper';


export const directDbConfig: DirectDBConfig = {
  type: 'direct',
  host: process.env.DB_DIRECT_HOST!,
  port: Number(process.env.DB_DIRECT_PORT!),
  database: process.env.DB_DIRECT_NAME!,
  user: process.env.DB_DIRECT_USER!,
  password: process.env.DB_DIRECT_PASSWORD!,
};

export const sshDbConfig: SshDBConfig = {
  type: 'ssh',
  ssh: {
    host: process.env.SSH_HOST!,
    username: process.env.SSH_USER!,
    password: process.env.SSH_PASSWORD!,
    port: 22,
  },
  db: {
    host: process.env.DB_SSH_HOST!,
    port: Number(process.env.DB_SSH_PORT!),
    database: process.env.DB_SSH_NAME!,
    user: process.env.DB_SSH_USER!,
    password: process.env.DB_SSH_PASSWORD!,
  },
};