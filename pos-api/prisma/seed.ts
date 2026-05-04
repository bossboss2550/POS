import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seed() {
  const categories = await Promise.all([
    prisma.category.upsert({ where: { name: 'Beverages' }, update: {}, create: { name: 'Beverages' } }),
    prisma.category.upsert({ where: { name: 'Snacks' },    update: {}, create: { name: 'Snacks' } }),
    prisma.category.upsert({ where: { name: 'Dairy' },     update: {}, create: { name: 'Dairy' } }),
    prisma.category.upsert({ where: { name: 'Bakery' },    update: {}, create: { name: 'Bakery' } }),
    prisma.category.upsert({ where: { name: 'Frozen' },    update: {}, create: { name: 'Frozen' } }),
  ]);

  const hash = await bcrypt.hash('password', 10);

  await prisma.user.upsert({
    where: { email: 'admin@pos.com' },
    update: {},
    create: { name: 'Admin', email: 'admin@pos.com', passwordHash: hash, role: 'ADMIN' },
  });
  await prisma.user.upsert({
    where: { email: 'manager@pos.com' },
    update: {},
    create: { name: 'Manager', email: 'manager@pos.com', passwordHash: hash, role: 'MANAGER' },
  });
  await prisma.user.upsert({
    where: { email: 'cashier@pos.com' },
    update: {},
    create: { name: 'Jane Cashier', email: 'cashier@pos.com', passwordHash: hash, role: 'CASHIER' },
  });

  const products = [
    { name: 'Cola 330ml',    barcode: '1000000001', price: 1.5,  cost: 0.8,  cat: 0, stock: 100 },
    { name: 'Water 500ml',   barcode: '1000000002', price: 0.99, cost: 0.3,  cat: 0, stock: 200 },
    { name: 'Orange Juice',  barcode: '1000000003', price: 2.5,  cost: 1.2,  cat: 0, stock: 50  },
    { name: 'Chips 100g',    barcode: '1000000004', price: 1.2,  cost: 0.6,  cat: 1, stock: 80  },
    { name: 'Chocolate Bar', barcode: '1000000005', price: 1.8,  cost: 0.9,  cat: 1, stock: 60  },
    { name: 'Milk 1L',       barcode: '1000000006', price: 1.4,  cost: 0.7,  cat: 2, stock: 40  },
    { name: 'Cheese 200g',   barcode: '1000000007', price: 3.5,  cost: 2.0,  cat: 2, stock: 30  },
    { name: 'Bread Loaf',    barcode: '1000000008', price: 2.2,  cost: 1.1,  cat: 3, stock: 25  },
    { name: 'Croissant',     barcode: '1000000009', price: 1.5,  cost: 0.7,  cat: 3, stock: 20  },
    { name: 'Ice Cream',     barcode: '1000000010', price: 4.0,  cost: 2.0,  cat: 4, stock: 15  },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { barcode: p.barcode },
      update: {},
      create: {
        name: p.name,
        barcode: p.barcode,
        price: p.price,
        cost: p.cost,
        categoryId: categories[p.cat].id,
        stock: { create: { quantity: p.stock, minQuantity: 5 } },
      },
    });
  }

  // Seed coupons
  await prisma.coupon.upsert({
    where: { code: 'SAVE10' },
    update: {},
    create: { code: 'SAVE10', description: '10% off', type: 'percent', value: 10, minAmount: 5 },
  });
  await prisma.coupon.upsert({
    where: { code: 'FLAT50' },
    update: {},
    create: { code: 'FLAT50', description: '$0.50 off', type: 'fixed', value: 0.50, minAmount: 3 },
  });

  console.log('Seed complete');
}

export default seed;

// Run directly: ts-node prisma/seed.ts
if (require.main === module) {
  seed().catch(console.error).finally(() => prisma.$disconnect());
}
