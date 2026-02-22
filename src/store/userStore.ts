import { create } from 'zustand';
import { User } from 'firebase/auth';

// Define the structure for weights
interface Weights {
  cuisine: Record<string, number>;
  food_group: Record<string, number>;
  food_category: Record<string, number>;
}

// Initial weights for new users
const initialWeights: Weights = {
  cuisine: {}, // Will be populated with 1.0 for all cuisines
  food_group: {}, // Will be populated with 1.0 for all food_groups
  food_category: {}, // Will be populated with 1.0 for all food_categories
};

interface UserState {
  user: User | null;
  weights: Weights; // Add weights to user state
  showMobileMenu: boolean; // 모바일 메뉴 표시 상태
  setUser: (user: User | null) => void;
  setWeights: (newWeights: Weights) => void; // New action to set weights
  toggleMobileMenu: () => void; // 모바일 메뉴 토글
  setMobileMenu: (show: boolean) => void; // 모바일 메뉴 상태 설정
  clearUser: () => void;
}

const useUserStore = create<UserState>((set) => ({
  user: null,
  weights: initialWeights, // Initialize with default weights
  showMobileMenu: false, // 기본값: 숨김
  setUser: (user) => set({ user }),
  setWeights: (newWeights) => set({ weights: newWeights }),
  toggleMobileMenu: () => set((state) => ({ showMobileMenu: !state.showMobileMenu })),
  setMobileMenu: (show) => set({ showMobileMenu: show }),
  clearUser: () => set({ user: null, weights: initialWeights }), // Clear weights on logout
}));

export default useUserStore;
