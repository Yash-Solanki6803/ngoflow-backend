import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: Number(process.env.DATABASE_PORT) || 5432,
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'admin',
  database: process.env.DATABASE_NAME || 'ngoflow',
  entities: [__dirname + '/../**/*.entity{.js, .ts}'],
  migrations: [__dirname + '/../db/migrations/*{.ts,.js}'],
  logging: false,
  synchronize: false,
}));
