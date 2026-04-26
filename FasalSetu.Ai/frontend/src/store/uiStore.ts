import { create } from 'zustand';

interface UIState {
  isLoading: boolean;
  activeRequests: number;
  loadingTimeout: ReturnType<typeof setTimeout> | null;
  startLoading: () => void;
  stopLoading: () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  isLoading: false,
  activeRequests: 0,
  loadingTimeout: null,

  startLoading: () => {
    const { activeRequests, loadingTimeout } = get();
    const newCount = activeRequests + 1;
    
    // Clear existing timeout if any (though should only be one if activeRequests was 0)
    if (loadingTimeout) clearTimeout(loadingTimeout);

    let newTimeout = null;
    if (newCount === 1) {
      // Small delay before showing loader to avoid flicker for fast actions
      newTimeout = setTimeout(() => {
        if (get().activeRequests > 0) {
          set({ isLoading: true });
        }
      }, 400);
    }

    set({ activeRequests: newCount, loadingTimeout: newTimeout });
  },

  stopLoading: () => {
    const { activeRequests, loadingTimeout, isLoading } = get();
    const newCount = Math.max(0, activeRequests - 1);

    if (newCount === 0) {
      if (loadingTimeout) clearTimeout(loadingTimeout);
      set({ activeRequests: 0, loadingTimeout: null, isLoading: false });
    } else {
      set({ activeRequests: newCount });
    }
  },
}));
