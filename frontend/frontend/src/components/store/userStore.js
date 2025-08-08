
import { create } from 'zustand';

export const useUserStore = create((set) => ({
  studyPlans: [],

  setStudyPlans: (plans) => set({ studyPlans: plans }),

  addStudyPlan: (plan) =>
    set((state) => ({
      studyPlans: [...state.studyPlans, plan],
    })),

  removeStudyPlan: (id) =>
    set((state) => ({
      studyPlans: state.studyPlans.filter((plan) => plan.id !== id),
    })),
}));
