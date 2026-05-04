import { openDB, type IDBPDatabase } from "idb";
import type { Product } from "@/types";

const DB_NAME = "pos-offline-db";
const DB_VERSION = 1;

export interface PosDB {
  products: {
    key: string;
    value: Product;
    indexes: { byBarcode: string; byCategoryId: string };
  };
  settings: {
    key: string;
    value: { key: string; value: unknown };
  };
}

let db: IDBPDatabase<PosDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<PosDB>> {
  if (db) return db;
  db = await openDB<PosDB>(DB_NAME, DB_VERSION, {
    upgrade(database) {
      // Products store
      if (!database.objectStoreNames.contains("products")) {
        const store = database.createObjectStore("products", { keyPath: "id" });
        store.createIndex("byBarcode", "barcode");
        store.createIndex("byCategoryId", "categoryId");
      }
      // General key-value settings
      if (!database.objectStoreNames.contains("settings")) {
        database.createObjectStore("settings", { keyPath: "key" });
      }
    },
  });
  return db;
}

export const productCache = {
  async getAll(): Promise<Product[]> {
    const database = await getDB();
    return database.getAll("products");
  },

  async getByBarcode(barcode: string): Promise<Product | undefined> {
    const database = await getDB();
    return database.getFromIndex("products", "byBarcode", barcode);
  },

  async putAll(products: Product[]): Promise<void> {
    const database = await getDB();
    const tx = database.transaction("products", "readwrite");
    await Promise.all([...products.map(p => tx.store.put(p)), tx.done]);
  },

  async clear(): Promise<void> {
    const database = await getDB();
    await database.clear("products");
  },

  async getLastSynced(): Promise<string | null> {
    const database = await getDB();
    const entry = await database.get("settings", "products_last_synced");
    return (entry?.value as string) ?? null;
  },

  async setLastSynced(isoDate: string): Promise<void> {
    const database = await getDB();
    await database.put("settings", { key: "products_last_synced", value: isoDate });
  },
};
