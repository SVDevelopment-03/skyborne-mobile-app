import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';


type OnboardingState = {
  inspiration?: number; // 1-6
  firstGoal?: number; // 1-5
  fitnessLevel?: number; // 1-3
  habits?: {
    waterIntake?: number; // 1-2 (Yes/No)
    sleepQuality?: number; // 1-3 (Poor/Okay/Good)
    exerciseFrequency?: number; // 1-3 (Rarely/Weekly/Regular)
  };
  pricingPlan?: string; // 'gold-1', 'gold-2', 'gold-3', 'diamond', 'platinum'
  setInspiration: (v: number) => void;
  setFirstGoal: (v: number) => void;
  setFitnessLevel: (v: number) => void;
  setHabits: (v: { waterIntake?: number; sleepQuality?: number; exerciseFrequency?: number }) => void;
  setPricingPlan: (v: string) => void;
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    set => ({
      inspiration: 1,
      firstGoal: 1,
      fitnessLevel: 1,
      habits: undefined,
      pricingPlan: undefined,
      setInspiration: (v) => set({ inspiration: v }),
      setFirstGoal: (v) => set({ firstGoal: v }),
      setFitnessLevel: (v) => set({ fitnessLevel: v }),
      setHabits: (v) => set({ habits: v }),
      setPricingPlan: (v) => set({ pricingPlan: v }),
    }),
    {
      name: 'onboarding',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
