import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "@/types";

export interface CartItem {
  id: string;
  product_id: string;
  product: Product;
  quantity: number;
  size: string;
  color: string;
}

interface CartStore {
  items: CartItem[];
  savedItems: CartItem[];
  addItem: (product: Product, quantity: number, size: string, color: string) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getItemCount: () => number;
  getSubtotal: () => number;
  isInCart: (productId: string, size: string, color: string) => boolean;
  saveForLater: (id: string) => void;
  moveToCart: (id: string) => void;
  removeSaved: (id: string) => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      savedItems: [],

      addItem: (product, quantity, size, color) => {
        set((state) => {
          const existingIndex = state.items.findIndex(
            (item) =>
              item.product_id === product.id &&
              item.size === size &&
              item.color === color
          );

          if (existingIndex > -1) {
            const existing = state.items[existingIndex];
            const maxAdd = Math.max(0, product.stock - existing.quantity);
            const addQty = Math.min(quantity, maxAdd);
            if (addQty <= 0) return state;
            const items = state.items.map((item, i) =>
              i === existingIndex ? { ...item, quantity: existing.quantity + addQty } : item
            );
            return { items };
          }

          const addQty = Math.min(quantity, product.stock);
          if (addQty <= 0) return state;

          const newItem: CartItem = {
            id: `${product.id}-${size}-${color}-${Date.now()}`,
            product_id: product.id,
            product,
            quantity: addQty,
            size,
            color,
          };

          return { items: [...state.items, newItem] };
        });
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },

      updateQuantity: (id, quantity) => {
        if (quantity < 1) {
          get().removeItem(id);
          return;
        }
        const maxQuantity = 20;
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, quantity: Math.min(quantity, maxQuantity) } : item
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      getItemCount: () => get().items.reduce((acc, item) => acc + item.quantity, 0),

      getSubtotal: () =>
        get().items.reduce(
          (acc, item) => acc + item.product.price * item.quantity,
          0
        ),

      isInCart: (productId, size, color) => {
        return get().items.some(
          (item) =>
            item.product_id === productId &&
            item.size === size &&
            item.color === color
        );
      },

      saveForLater: (id) => {
        set((state) => {
          const item = state.items.find((i) => i.id === id);
          if (!item) return state;
          const alreadySaved = state.savedItems.some(
            (s) => s.product_id === item.product_id && s.size === item.size && s.color === item.color
          );
          return {
            items: state.items.filter((i) => i.id !== id),
            savedItems: alreadySaved ? state.savedItems : [...state.savedItems, item],
          };
        });
      },

      moveToCart: (id) => {
        set((state) => {
          const item = state.savedItems.find((i) => i.id === id);
          if (!item) return state;
          if (item.product.stock <= 0) return state;
          const existingIndex = state.items.findIndex(
            (i) => i.product_id === item.product_id && i.size === item.size && i.color === item.color
          );
          if (existingIndex > -1) {
            const existing = state.items[existingIndex];
            const maxAdd = Math.max(0, item.product.stock - existing.quantity);
            const addQty = Math.min(item.quantity, maxAdd);
            if (addQty <= 0) {
              return {
                savedItems: state.savedItems.filter((i) => i.id !== id),
              };
            }
            return {
              savedItems: state.savedItems.filter((i) => i.id !== id),
              items: state.items.map((i, idx) =>
                idx === existingIndex ? { ...i, quantity: existing.quantity + addQty } : i
              ),
            };
          }
          return {
            savedItems: state.savedItems.filter((i) => i.id !== id),
            items: [...state.items, item],
          };
        });
      },

      removeSaved: (id) => {
        set((state) => ({
          savedItems: state.savedItems.filter((i) => i.id !== id),
        }));
      },
    }),
    { name: "arconstyle-cart" }
  )
);
