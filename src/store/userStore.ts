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
  setUser: (user: User | null) => void;
  setWeights: (newWeights: Weights) => void; // New action to set weights
  clearUser: () => void;
}

const useUserStore = create<UserState>((set) => ({
  user: null,
  weights: initialWeights, // Initialize with default weights
  setUser: (user) => set({ user }),
  setWeights: (newWeights) => set({ weights: newWeights }),
  clearUser: () => set({ user: null, weights: initialWeights }), // Clear weights on logout
}));

export default useUserStore;
