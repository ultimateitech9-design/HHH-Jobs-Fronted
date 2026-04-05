import { create } from 'zustand';
import {
  getCurrentUser,
  getToken,
  setAuthSession,
  clearAuthSession,
  normalizeRole,
  getDashboardPathByRole,
} from '../../utils/auth';

const readStoredAuthState = () => {
  const user = getCurrentUser();
  return {
    user,
    token: user ? getToken() : null
  };
};

const useAuthStore = create((set, get) => ({
  ...readStoredAuthState(),

  setAuthData: (token, user) => {
    setAuthSession(token, user);
    set({ user, token });
  },

  clearAuth: () => {
    clearAuthSession();
    set({ user: null, token: null });
  },

  refreshUser: (updatedUser) => {
    set((state) => ({ user: { ...state.user, ...updatedUser } }));
  },

  // Computed helpers
  isAuthenticated: () => Boolean(get().token && get().user),
  getUserRole: () => normalizeRole(get().user?.role),
  getDashboardPath: () => getDashboardPathByRole(normalizeRole(get().user?.role)),
}));

// Sync with localStorage changes from other tabs or legacy auth events
if (typeof window !== 'undefined') {
  window.addEventListener('auth-changed', () => {
    useAuthStore.setState(readStoredAuthState());
  });

  window.addEventListener('storage', (e) => {
    if (e.key === 'job_portal_token' || e.key === 'job_portal_user' || e.key === 'job_portal_pending_verification') {
      useAuthStore.setState(readStoredAuthState());
    }
  });
}

export default useAuthStore;
