import type { Product, Category } from "@/types";
import type { IProductService } from "../types";
import { mockProducts, mockCategories } from "./mockData";

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));
let products = [...mockProducts];

export const productService: IProductService = {
  async getProducts(params = {}) {
    await delay();
    let filtered = [...products];

    if (params.search) {
      const query = params.search.toLowerCase();
      filtered = filtered.filter((product) => product.name.toLowerCase().includes(query) || product.barcode.includes(query));
    }

    if (params.categoryId) {
      filtered = filtered.filter((product) => product.categoryId === params.categoryId);
    }

    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;
    const total = filtered.length;
    const data = filtered.slice((page - 1) * pageSize, page * pageSize);

    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  },

  async getProductById(id) {
    await delay(200);
    const product = products.find((item) => item.id === id);
    if (!product) {
      throw new Error("Product not found");
    }
    return product;
  },

  async getProductByBarcode(barcode) {
    await delay(200);
    return products.find((product) => product.barcode === barcode) ?? null;
  },

  async createProduct(data) {
    await delay();
    const product: Product = {
      ...data,
      id: `p-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    products = [...products, product];
    return product;
  },

  async updateProduct(id, data) {
    await delay();
    const index = products.findIndex((product) => product.id === id);
    if (index === -1) {
      throw new Error("Product not found");
    }

    const updated: Product = {
      ...products[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    products = products.map((product) => (product.id === id ? updated : product));
    return updated;
  },

  async uploadProductImage(file) {
    await delay(150);
    return URL.createObjectURL(file);
  },

  async deleteProduct(id) {
    await delay();
    products = products.filter((product) => product.id !== id);
  },

  async getCategories(): Promise<Category[]> {
    await delay(200);
    return [...mockCategories];
  },
};
