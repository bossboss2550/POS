import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const DEFAULTS: Record<string, string> = {
  storeName: 'My POS Store',
  storeAddress: '',
  storePhone: '',
  taxRate: '0.07',
  currency: 'USD',
  receiptFooter: 'Thank you for shopping with us!',
};

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getAll() {
    const rows = await this.prisma.setting.findMany();
    const map: Record<string, string> = { ...DEFAULTS };
    for (const r of rows) map[r.key] = r.value;
    return map;
  }

  async update(data: Record<string, string>) {
    await Promise.all(
      Object.entries(data).map(([key, value]) =>
        this.prisma.setting.upsert({
          where: { key },
          create: { key, value },
          update: { value },
        }),
      ),
    );
    return this.getAll();
  }
}
