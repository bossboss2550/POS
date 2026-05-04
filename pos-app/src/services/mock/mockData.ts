import type { User, Category, Product, Customer, Order, StockMovement } from "@/types";
import dayjs from "dayjs";

// ─── Users ───────────────────────────────────────────────────────────────────
export const mockUsers: User[] = [
  { id: "u1", name: "Admin User",   email: "admin@pos.com",    role: "admin",    branchId: "b1", createdAt: "2024-01-01T00:00:00Z" },
  { id: "u2", name: "Jane Manager", email: "jane@pos.com",     role: "manager",  branchId: "b1", createdAt: "2024-01-05T00:00:00Z" },
  { id: "u3", name: "Tom Cashier",  email: "tom@pos.com",      role: "cashier",  branchId: "b1", createdAt: "2024-02-01T00:00:00Z" },
  { id: "u4", name: "Amy Cashier",  email: "amy@pos.com",      role: "cashier",  branchId: "b1", createdAt: "2024-02-15T00:00:00Z" },
  { id: "u5", name: "Bob Cashier",  email: "bob@pos.com",      role: "cashier",  branchId: "b1", createdAt: "2024-03-01T00:00:00Z" },
];

// Password is "password" for all mock users
export const mockCredentials: Record<string, string> = {
  "admin@pos.com":   "password",
  "jane@pos.com":    "password",
  "tom@pos.com":     "password",
  "amy@pos.com":     "password",
  "bob@pos.com":     "password",
};

// ─── Categories ──────────────────────────────────────────────────────────────
export const mockCategories: Category[] = [
  { id: "cat1",  name: "Beverages",    color: "#3B82F6", icon: "coffee"    },
  { id: "cat2",  name: "Snacks",       color: "#F59E0B", icon: "cookie"    },
  { id: "cat3",  name: "Dairy",        color: "#10B981", icon: "milk"      },
  { id: "cat4",  name: "Bakery",       color: "#F97316", icon: "bread"     },
  { id: "cat5",  name: "Frozen",       color: "#6366F1", icon: "snowflake" },
  { id: "cat6",  name: "Personal Care",color: "#EC4899", icon: "heart"     },
  { id: "cat7",  name: "Household",    color: "#14B8A6", icon: "home"      },
  { id: "cat8",  name: "Electronics", color: "#8B5CF6", icon: "zap"       },
  { id: "cat9",  name: "Stationery",  color: "#EF4444", icon: "pen"       },
  { id: "cat10", name: "Other",        color: "#6B7280", icon: "package"   },
];

// ─── Products ─────────────────────────────────────────────────────────────────
export const mockProducts: Product[] = [
  // Beverages
  { id: "p1",  name: "Coca-Cola 330ml",       barcode: "5000112637922", categoryId: "cat1",  price: 25,   cost: 15,   stock: 120, minStock: 20, unit: "can",   isActive: true, createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-01-01T00:00:00Z" },
  { id: "p2",  name: "Pepsi 330ml",            barcode: "4890008100309", categoryId: "cat1",  price: 25,   cost: 14,   stock: 80,  minStock: 20, unit: "can",   isActive: true, createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-01-01T00:00:00Z" },
  { id: "p3",  name: "Green Tea 500ml",        barcode: "8850329101012", categoryId: "cat1",  price: 15,   cost: 8,    stock: 200, minStock: 30, unit: "bottle",isActive: true, createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-01-01T00:00:00Z" },
  { id: "p4",  name: "Orange Juice 1L",        barcode: "8851932010017", categoryId: "cat1",  price: 55,   cost: 35,   stock: 60,  minStock: 10, unit: "bottle",isActive: true, createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-01-01T00:00:00Z" },
  { id: "p5",  name: "Mineral Water 600ml",    barcode: "8850093101019", categoryId: "cat1",  price: 10,   cost: 5,    stock: 300, minStock: 50, unit: "bottle",isActive: true, createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-01-01T00:00:00Z" },
  // Snacks
  { id: "p6",  name: "Lay's Original 50g",     barcode: "8850018101016", categoryId: "cat2",  price: 20,   cost: 12,   stock: 150, minStock: 30, unit: "pack",  isActive: true, createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-01-01T00:00:00Z" },
  { id: "p7",  name: "Pringles Original",       barcode: "5053990108561", categoryId: "cat2",  price: 89,   cost: 55,   stock: 45,  minStock: 10, unit: "can",   isActive: true, createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-01-01T00:00:00Z" },
  { id: "p8",  name: "Oreo Cookies",            barcode: "8719128063867", categoryId: "cat2",  price: 35,   cost: 22,   stock: 90,  minStock: 15, unit: "pack",  isActive: true, createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-01-01T00:00:00Z" },
  { id: "p9",  name: "KitKat 4-finger",         barcode: "5000159484695", categoryId: "cat2",  price: 25,   cost: 16,   stock: 120, minStock: 20, unit: "bar",   isActive: true, createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-01-01T00:00:00Z" },
  { id: "p10", name: "Pocky Chocolate",          barcode: "4901005510809", categoryId: "cat2",  price: 30,   cost: 18,   stock: 100, minStock: 20, unit: "box",   isActive: true, createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-01-01T00:00:00Z" },
  // Dairy
  { id: "p11", name: "Meiji Milk 1L",           barcode: "4902112063867", categoryId: "cat3",  price: 65,   cost: 50,   stock: 40,  minStock: 10, unit: "carton",isActive: true, createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-01-01T00:00:00Z" },
  { id: "p12", name: "Yogurt Strawberry 150g",  barcode: "8856008101019", categoryId: "cat3",  price: 18,   cost: 12,   stock: 60,  minStock: 12, unit: "cup",   isActive: true, createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-01-01T00:00:00Z" },
  { id: "p13", name: "Cheese Slices 150g",       barcode: "8718114010016", categoryId: "cat3",  price: 85,   cost: 65,   stock: 5,   minStock: 8,  unit: "pack",  isActive: true, createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-01-01T00:00:00Z" },
  // Bakery
  { id: "p14", name: "Sandwich Bread",           barcode: "8850112010016", categoryId: "cat4",  price: 40,   cost: 28,   stock: 25,  minStock: 5,  unit: "loaf",  isActive: true, createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-01-01T00:00:00Z" },
  { id: "p15", name: "Croissant",                barcode: "8852345010019", categoryId: "cat4",  price: 25,   cost: 15,   stock: 30,  minStock: 5,  unit: "pcs",   isActive: true, createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-01-01T00:00:00Z" },
  // Personal Care
  { id: "p16", name: "Dove Soap 100g",           barcode: "8710447206843", categoryId: "cat6",  price: 35,   cost: 22,   stock: 80,  minStock: 15, unit: "bar",   isActive: true, createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-01-01T00:00:00Z" },
  { id: "p17", name: "Pantene Shampoo 400ml",    barcode: "8001090145697", categoryId: "cat6",  price: 125,  cost: 88,   stock: 35,  minStock: 8,  unit: "bottle",isActive: true, createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-01-01T00:00:00Z" },
  { id: "p18", name: "Colgate Toothpaste",        barcode: "8850006543870", categoryId: "cat6",  price: 55,   cost: 38,   stock: 60,  minStock: 10, unit: "tube",  isActive: true, createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-01-01T00:00:00Z" },
  // Household
  { id: "p19", name: "Fairy Dish Soap 500ml",    barcode: "8006540517468", categoryId: "cat7",  price: 69,   cost: 48,   stock: 45,  minStock: 10, unit: "bottle",isActive: true, createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-01-01T00:00:00Z" },
  { id: "p20", name: "Tissue 200 sheets",         barcode: "8851234010015", categoryId: "cat7",  price: 45,   cost: 30,   stock: 100, minStock: 20, unit: "pack",  isActive: true, createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-01-01T00:00:00Z" },
  // Stationery
  { id: "p21", name: "Ballpoint Pen Blue",        barcode: "4902778101018", categoryId: "cat9",  price: 10,   cost: 5,    stock: 200, minStock: 30, unit: "pcs",   isActive: true, createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-01-01T00:00:00Z" },
  { id: "p22", name: "A4 Notebook 100pg",         barcode: "8857234010019", categoryId: "cat9",  price: 45,   cost: 28,   stock: 75,  minStock: 10, unit: "book",  isActive: true, createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-01-01T00:00:00Z" },
  // Low stock examples
  { id: "p23", name: "Red Bull 250ml",            barcode: "9002490100070", categoryId: "cat1",  price: 35,   cost: 22,   stock: 3,   minStock: 10, unit: "can",   isActive: true, createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-01-01T00:00:00Z" },
  { id: "p24", name: "Protein Bar Chocolate",     barcode: "0722252335967", categoryId: "cat2",  price: 75,   cost: 50,   stock: 2,   minStock: 5,  unit: "bar",   isActive: true, createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-01-01T00:00:00Z" },
  { id: "p25", name: "Instant Noodles",           barcode: "8850024100137", categoryId: "cat10", price: 6,    cost: 3,    stock: 500, minStock: 50, unit: "pack",  isActive: true, createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-01-01T00:00:00Z" },
];

// ─── Customers ────────────────────────────────────────────────────────────────
export const mockCustomers: Customer[] = [
  { id: "c1",  name: "Somchai Jaidee",    phone: "0812345678", email: "somchai@email.com",  loyaltyPoints: 1250, totalSpent: 12500, memberTier: "silver",   createdAt: "2024-01-10T00:00:00Z" },
  { id: "c2",  name: "Ploy Rakdee",       phone: "0823456789", email: "ploy@email.com",     loyaltyPoints: 3800, totalSpent: 38000, memberTier: "gold",     createdAt: "2024-01-15T00:00:00Z" },
  { id: "c3",  name: "Nattapong Srirak",  phone: "0834567890",                              loyaltyPoints: 450,  totalSpent: 4500,  memberTier: "bronze",   createdAt: "2024-02-01T00:00:00Z" },
  { id: "c4",  name: "Siriporn Wongdee",  phone: "0845678901", email: "siri@email.com",     loyaltyPoints: 9200, totalSpent: 92000, memberTier: "platinum", createdAt: "2024-01-01T00:00:00Z" },
  { id: "c5",  name: "Anon Thongdee",     phone: "0856789012",                              loyaltyPoints: 200,  totalSpent: 2000,  memberTier: "bronze",   createdAt: "2024-03-01T00:00:00Z" },
  { id: "c6",  name: "Malee Suksai",      phone: "0867890123", email: "malee@email.com",    loyaltyPoints: 2100, totalSpent: 21000, memberTier: "silver",   createdAt: "2024-02-10T00:00:00Z" },
  { id: "c7",  name: "Krit Janedee",      phone: "0878901234",                              loyaltyPoints: 5500, totalSpent: 55000, memberTier: "gold",     createdAt: "2024-01-20T00:00:00Z" },
  { id: "c8",  name: "Dao Phakdee",       phone: "0889012345", email: "dao@email.com",      loyaltyPoints: 800,  totalSpent: 8000,  memberTier: "bronze",   createdAt: "2024-02-20T00:00:00Z" },
];

// ─── Generate realistic orders ────────────────────────────────────────────────
function generateOrders(): Order[] {
  const orders: Order[] = [];
  const cashiers = mockUsers.filter(u => u.role === "cashier" || u.role === "manager");

  for (let i = 0; i < 80; i++) {
    const date = dayjs().subtract(Math.floor(Math.random() * 30), "day")
                        .subtract(Math.floor(Math.random() * 12), "hour");
    const itemCount = Math.floor(Math.random() * 5) + 1;
    const selectedProducts = [...mockProducts].sort(() => 0.5 - Math.random()).slice(0, itemCount);
    const cashier = cashiers[Math.floor(Math.random() * cashiers.length)];
    const customer = Math.random() > 0.5 ? mockCustomers[Math.floor(Math.random() * mockCustomers.length)] : undefined;

    const items = selectedProducts.map(p => {
      const qty = Math.floor(Math.random() * 3) + 1;
      const discount = Math.random() > 0.8 ? 10 : 0;
      const total = p.price * qty * (1 - discount / 100);
      return { productId: p.id, productName: p.name, barcode: p.barcode, quantity: qty, unitPrice: p.price, discount, total };
    });

    const subtotal = items.reduce((s, it) => s + it.total, 0);
    const discountAmount = subtotal * (Math.random() > 0.9 ? 0.05 : 0);
    const taxAmount = (subtotal - discountAmount) * 0.07;
    const total = subtotal - discountAmount + taxAmount;

    orders.push({
      id: `ord-${(i + 1).toString().padStart(4, "0")}`,
      orderNumber: `INV-${date.format("YYYYMMDD")}-${(i + 1).toString().padStart(3, "0")}`,
      items, customerId: customer?.id, customerName: customer?.name,
      cashierId: cashier.id, cashierName: cashier.name,
      subtotal, discountAmount, taxAmount, total,
      payment: {
        id: `pay-${i + 1}`, orderId: `ord-${(i + 1).toString().padStart(4, "0")}`,
        splits: [{ method: Math.random() > 0.4 ? "cash" : "card", amount: total }],
        total, change: Math.random() > 0.4 ? Math.floor(Math.random() * 50) : 0,
        createdAt: date.toISOString(),
      },
      status: Math.random() > 0.05 ? "paid" : "cancelled",
      createdAt: date.toISOString(), updatedAt: date.toISOString(),
    });
  }
  return orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export const mockOrders: Order[] = generateOrders();

// ─── Stock Movements ──────────────────────────────────────────────────────────
export const mockStockMovements: StockMovement[] = mockProducts.slice(0, 10).map((p, i) => ({
  id: `sm-${i + 1}`,
  productId: p.id, productName: p.name,
  type: i % 3 === 0 ? "in" : "adjustment",
  quantity: i % 3 === 0 ? 50 : -5,
  beforeStock: p.stock + (i % 3 === 0 ? -50 : 5),
  afterStock: p.stock,
  reason: i % 3 === 0 ? "Restock from supplier" : "Stock count adjustment",
  userId: "u1",
  createdAt: dayjs().subtract(i, "day").toISOString(),
}));
