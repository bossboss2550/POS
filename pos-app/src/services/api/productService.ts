import type { IProductService, ProductUpsertInput } from "../types";
import { apiGet, apiPost, apiPatch, apiDelete, axiosInstance } from "@/lib/axios";
import type { Product, Category, PaginationParams, PaginatedResponse } from "@/types";

function toApiParams(params: PaginationParams & Record<string, unknown>) {
  const { pageSize, ...rest } = params as PaginationParams & Record<string, unknown>;
  if (pageSize !== undefined) {
    rest.limit = pageSize;
  }
  return rest;
}

function sanitizeProductPayload(data: Partial<ProductUpsertInput>) {
  const { unit: _unit, image: _image, ...rest } = data as Partial<ProductUpsertInput> & { image?: string };
  return {
    ...rest,
    ...(rest.imageUrl !== undefined ? { imageUrl: rest.imageUrl || "" } : {}),
  };
}

const CATEGORY_COLORS = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6",
  "#EC4899", "#06B6D4", "#84CC16", "#F97316", "#6366F1",
];
const CATEGORY_ICONS = ["📦", "🍔", "🥤", "🧃", "🍰", "🛒", "💊", "🧴", "📱", "🏠"];
let colorIdx = 0;
const categoryCache = new Map<string, { color: string; icon: string }>();

function mapCategory(category: { id: string; name: string }) {
  if (!categoryCache.has(category.id)) {
    const index = colorIdx++ % CATEGORY_COLORS.length;
    categoryCache.set(category.id, { color: CATEGORY_COLORS[index], icon: CATEGORY_ICONS[index] });
  }

  return { ...category, ...categoryCache.get(category.id)! } satisfies Category;
}

export const productService: IProductService = {
  async getProducts(params = {}) {
    return apiGet<PaginatedResponse<Product>>("/products", toApiParams(params as PaginationParams & Record<string, unknown>));
  },

  async getProductById(id) {
    return apiGet<Product>(`/products/${id}`);
  },

  async getProductByBarcode(barcode) {
    try {
      return await apiGet<Product>(`/products/barcode/${barcode}`);
    } catch {
      return null;
    }
  },

  async createProduct(data) {
    return apiPost<Product>("/products", sanitizeProductPayload(data));
  },

  async updateProduct(id, data) {
    return apiPatch<Product>(`/products/${id}`, sanitizeProductPayload(data));
  },

  async uploadProductImage(file) {
    const formData = new FormData();
    formData.append("image", file);

    const { data } = await axiosInstance.post<{ data: { imageUrl: string }; success: boolean }>(
      "/products/images",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return data.data.imageUrl;
  },

  async deleteProduct(id) {
    return apiDelete(`/products/${id}`);
  },

  async getCategories() {
    const categories = await apiGet<Array<{ id: string; name: string }>>("/products/categories");
    return categories.map(mapCategory);
  },
};
