export interface LoginDto {
  username?: string;
  password?: string;
}

export interface AuthJwtPayload {
  id: number;
  name: string;
  username: string;
  cabang_id: number;
  cabang_nama?: string;
}

export interface UserSessionData {
  user: {
    id: number;
    name: string;
    username: string;
    cabang_id: number;
  };
  cabang: {
    id: number;
    nama: string;
    alamat: string | null;
    kota_id: number;
    off: number;
  };
}
