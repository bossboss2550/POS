import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface FavoriteProduct {
  productId: string;
  order: number; // for custom ordering
  addedAt: string;
}

interface FavoritesStore {
  favorites: FavoriteProduct[];
  
  // queries
  isFavorite: (productId: string) => boolean;
  getFavoriteOrder: (productId: string) => number;
  getSortedFavoriteIds: () => string[];
  
  // actions
  addFavorite: (productId: string) => void;
  removeFavorite: (productId: string) => void;
  toggleFavorite: (productId: string) => void;
  reorderFavorites: (productIds: string[]) => void;
  moveFavoriteUp: (productId: string) => void;
  moveFavoriteDown: (productId: string) => void;
}

export const useFavoritesStore = create<FavoritesStore>()(
  persist(
    (set, get) => ({
      favorites: [],

      isFavorite: (productId) => 
        get().favorites.some(f => f.productId === productId),

      getFavoriteOrder: (productId) =>
        get().favorites.find(f => f.productId === productId)?.order ?? 999,

      getSortedFavoriteIds: () =>
        [...get().favorites]
          .sort((a, b) => a.order - b.order)
          .map(f => f.productId),

      addFavorite: (productId) => {
        if (get().isFavorite(productId)) return;
        const maxOrder = Math.max(...get().favorites.map(f => f.order), -1);
        const newFav: FavoriteProduct = {
          productId,
          order: maxOrder + 1,
          addedAt: new Date().toISOString(),
        };
        set(s => ({ favorites: [...s.favorites, newFav] }));
      },

      removeFavorite: (productId) =>
        set(s => ({ favorites: s.favorites.filter(f => f.productId !== productId) })),

      toggleFavorite: (productId) => {
        if (get().isFavorite(productId)) {
          get().removeFavorite(productId);
        } else {
          get().addFavorite(productId);
        }
      },

      reorderFavorites: (productIds) => {
        const updated = productIds.map((id, index) => {
          const existing = get().favorites.find(f => f.productId === id);
          return existing ? { ...existing, order: index } : null;
        }).filter(Boolean) as FavoriteProduct[];
        set({ favorites: updated });
      },

      moveFavoriteUp: (productId) => {
        const sorted = get().getSortedFavoriteIds();
        const index = sorted.indexOf(productId);
        if (index <= 0) return; // already at top
        [sorted[index], sorted[index - 1]] = [sorted[index - 1], sorted[index]];
        get().reorderFavorites(sorted);
      },

      moveFavoriteDown: (productId) => {
        const sorted = get().getSortedFavoriteIds();
        const index = sorted.indexOf(productId);
        if (index === -1 || index >= sorted.length - 1) return; // at bottom
        [sorted[index], sorted[index + 1]] = [sorted[index + 1], sorted[index]];
        get().reorderFavorites(sorted);
      },
    }),
    { name: "pos-favorites" }
  )
);
