import { create } from 'zustand';
import Cookies from 'js-cookie';

export interface User {
  id: number;
  name: string;
  username: string;
  cabang_id: number;
}

export interface Cabang {
  id: number;
  nama: string;
  alamat: string | null;
  kota_id: number;
  off: number;
  persen_gaji?: number | null;
}

export interface AuthState {
  user: User | null;
  cabang: Cabang | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;

  setAuth: (data: {
    user: User;
    cabang: Cabang;
    accessToken: string;
    refreshToken: string;
  }) => void;
  updateAccessToken: (token: string) => void;
  logout: () => void;
  initAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  cabang: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,

  setAuth: (data) => {
    // Simpan Access Token (1 jam) dan Refresh Token (7 hari) ke Cookies
    Cookies.set('pos_access_token', data.accessToken, { expires: 1 / 24, sameSite: 'lax' });
    Cookies.set('pos_refresh_token', data.refreshToken, { expires: 7, sameSite: 'lax' });

    if (typeof window !== 'undefined') {
      localStorage.setItem('pos_user', JSON.stringify(data.user));
      localStorage.setItem('pos_cabang', JSON.stringify(data.cabang));
    }

    set({
      user: data.user,
      cabang: data.cabang,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      isAuthenticated: true,
    });
  },

  updateAccessToken: (token: string) => {
    Cookies.set('pos_access_token', token, { expires: 1 / 24, sameSite: 'lax' });
    set({ accessToken: token });
  },

  logout: () => {
    Cookies.remove('pos_access_token');
    Cookies.remove('pos_refresh_token');

    if (typeof window !== 'undefined') {
      localStorage.removeItem('pos_user');
      localStorage.removeItem('pos_cabang');
    }

    set({
      user: null,
      cabang: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  },

  initAuth: () => {
    if (typeof window === 'undefined') return;

    const token = Cookies.get('pos_access_token') || null;
    const refreshToken = Cookies.get('pos_refresh_token') || null;
    const savedUser = localStorage.getItem('pos_user');
    const savedCabang = localStorage.getItem('pos_cabang');

    if (token && savedUser) {
      try {
        set({
          user: JSON.parse(savedUser),
          cabang: savedCabang ? JSON.parse(savedCabang) : null,
          accessToken: token,
          refreshToken: refreshToken,
          isAuthenticated: true,
        });
      } catch (e) {
        console.error('Failed to parse cached auth state', e);
      }
    }
  },
}));

export default useAuthStore;
