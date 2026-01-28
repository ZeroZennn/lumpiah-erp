import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy {
  constructor() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    super({
      datasource: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    } as ConstructorParameters<typeof PrismaClient>[0]);
  }
  async onModuleInit() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    await this.$connect();
  }

  async onModuleDestroy() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    await this.$disconnect();
  }
}
