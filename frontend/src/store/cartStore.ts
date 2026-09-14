import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface SelectedVarian {
  id: number;
  nm_varian: string;
  harga: number;
}

export interface CartItem {
  id: string; // Unique cart item ID
  produk_id: number;
  nm_produk: string;
  foto: string;
  harga: number; // Harga satuan sesuai delivery_id aktif
  qty: number;
  catatan: string;
  varian: SelectedVarian[];
  resep_info?: string;
}

export interface BukaTokoData {
  buka_toko_id?: number | null;
  id?: number | null;
  kode?: string | null;
  tgl?: string | Date | null;
  tgl_jurnal?: string | Date | null;
  cabang_id?: number;
  persen_gaji?: number;
  kota_id?: number;
  nm_karyawan?: string | null;
  is_open?: boolean;
}

interface CartState {
  cart: CartItem[];
  delivery_id: number; // Default: 1 (Normal)
  buka_toko_data: BukaTokoData | null;

  // Actions
  addToCart: (item: Omit<CartItem, 'id'>) => void;
  updateQty: (itemId: string, delta: number) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  setDeliveryId: (deliveryId: number) => void;
  changeDeliveryType: (
    newDeliveryId: number,
    getHargaFn?: (produkId: number, deliveryId: number) => number | undefined
  ) => void;
  setBukaTokoData: (data: BukaTokoData) => void;

  // Selectors / Helpers
  getTotalBelanja: () => number;
  getTotalItems: () => number;
}

// Helper untuk mengecek apakah varian sama persis
const isVarianSame = (v1: SelectedVarian[] = [], v2: SelectedVarian[] = []): boolean => {
  if (v1.length !== v2.length) return false;
  const ids1 = v1.map((v) => v.id).sort((a, b) => a - b);
  const ids2 = v2.map((v) => v.id).sort((a, b) => a - b);
  return ids1.every((id, idx) => id === ids2[idx]);
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cart: [],
      delivery_id: 1, // Default delivery: 1 (Normal)
      buka_toko_data: null,

      /**
       * Logika WAJIB addToCart:
       * Jika produk_id, varian, dan catatan SAMA -> Tambah qty.
       * Jika ada yang beda -> Jadikan baris baru di keranjang.
       */
      addToCart: (newItem) => {
        set((state) => {
          const currentCart = [...state.cart];
          const catatanClean = (newItem.catatan || '').trim();

          const existingIndex = currentCart.findIndex((item) => {
            const sameProduk = item.produk_id === newItem.produk_id;
            const sameCatatan = (item.catatan || '').trim() === catatanClean;
            const sameVarian = isVarianSame(item.varian, newItem.varian);
            return sameProduk && sameCatatan && sameVarian;
          });

          if (existingIndex !== -1) {
            // Sama persis: tambah qty
            currentCart[existingIndex] = {
              ...currentCart[existingIndex],
              qty: currentCart[existingIndex].qty + newItem.qty,
            };
            return { cart: currentCart };
          }

          // Ada yang beda: baris baru
          const newCartItem: CartItem = {
            ...newItem,
            id: `item-${newItem.produk_id}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            catatan: catatanClean,
          };

          return { cart: [...currentCart, newCartItem] };
        });
      },

      /**
       * Update kuantitas item di keranjang (+1 atau -1)
       */
      updateQty: (itemId, delta) => {
        set((state) => {
          const currentCart = state.cart
            .map((item) => {
              if (item.id === itemId) {
                const newQty = item.qty + delta;
                return newQty > 0 ? { ...item, qty: newQty } : null;
              }
              return item;
            })
            .filter(Boolean) as CartItem[];

          return { cart: currentCart };
        });
      },

      /**
       * Hapus satu item dari keranjang
       */
      removeFromCart: (itemId) => {
        set((state) => ({
          cart: state.cart.filter((item) => item.id !== itemId),
        }));
      },

      /**
       * Bersihkan seluruh isi keranjang
       */
      clearCart: () => {
        set({ cart: [] });
      },

      /**
       * Set delivery id langsung
       */
      setDeliveryId: (deliveryId) => {
        set({ delivery_id: deliveryId });
      },

      /**
       * Logika WAJIB changeDeliveryType:
       * Jika delivery_id berubah, sistem harus otomatis mengambil harga baru
       * untuk seluruh item di keranjang berdasarkan tabel harga (produk_id & delivery_id).
       */
      changeDeliveryType: (newDeliveryId, getHargaFn) => {
        set((state) => {
          let updatedCart = state.cart;
          if (getHargaFn) {
            updatedCart = state.cart.map((item) => {
              const newPrice = getHargaFn(item.produk_id, newDeliveryId);
              return newPrice !== undefined ? { ...item, harga: newPrice } : item;
            });
          }

          return {
            delivery_id: newDeliveryId,
            cart: updatedCart,
          };
        });
      },

      /**
       * Simpan data sesi Buka Toko (kode, buka_toko_id, tgl_jurnal, cabang_id, dll)
       */
      setBukaTokoData: (data) => {
        set({ buka_toko_data: data });
      },

      /**
       * Total belanja: Total harga produk + varian dikalikan qty
       */
      getTotalBelanja: () => {
        const { cart } = get();
        return cart.reduce((total, item) => {
          const varianTotal = (item.varian || []).reduce((acc, v) => acc + (v.harga || 0), 0);
          return total + (item.harga + varianTotal) * item.qty;
        }, 0);
      },

      /**
       * Total seluruh item di keranjang
       */
      getTotalItems: () => {
        const { cart } = get();
        return cart.reduce((total, item) => total + item.qty, 0);
      },
    }),
    {
      name: 'pos_kebab_cart_storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        cart: state.cart,
        delivery_id: state.delivery_id,
        buka_toko_data: state.buka_toko_data,
      }),
    }
  )
);

export default useCartStore;
