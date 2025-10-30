import { create } from 'zustand';

export const usePostStore = create((set) => ({
    selectedPost: null,
    setSelectedPost: (post: any) => set({ selectedPost: post},)
}));

// export const usePostStore = create((set) => ({
//   postStack: [] as any[],
//   pushPost: (post) => set((state) => ({ postStack: [...state.postStack, post] })),
//   popPost: () =>
//     set((state) => {
//       const newStack = [...state.postStack];
//       newStack.pop();
//       return { postStack: newStack };
//     }),
//   currentPost: () => get().postStack.at(-1),
// }));