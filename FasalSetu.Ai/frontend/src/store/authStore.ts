import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  fullName: string;
  email: string;
  role: 'FARMER' | 'AGENT';
  isEmailVerified: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  registrationEmail: string | null;
  setAuth: (user: User, token: string) => void;
  setRegistrationEmail: (email: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      registrationEmail: null,
      
      setAuth: (user, token) => {
        localStorage.setItem('fasalsetu_token', token);
        set({ user, token, isAuthenticated: true });
      },
      
      setRegistrationEmail: (email) => set({ registrationEmail: email }),
      
      logout: () => {
        localStorage.removeItem('fasalsetu_token');
        set({ user: null, token: null, isAuthenticated: false, registrationEmail: null });
      },
    }),
    {
      name: 'fasalsetu-auth',
    }
  )
);
