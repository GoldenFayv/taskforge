// src/prisma/prisma.service.ts
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { error, log } from 'console';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name)

  constructor() {
    const adapter = new PrismaMariaDb({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    })
    super({ adapter })
  }

  async onModuleInit() {
    await this.$connect().then(() => this.logger.log("Connected to DB")).catch((err) => this.logger.error("Error connecting to DB", err));
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Disconnected from DB');

  }
}
