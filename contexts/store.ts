import { create } from 'zustand';

// export const usePostStore = create((set) => ({
//     selectedPost: null,
//     setSelectedPost: (post: any) => set({ selectedPost: post},)
// }));

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

interface PostStore {
  postMap: Record<string, any>;
  setPost: (post: any) => void;
  deletedItem: string | null;
  setDeletedItem: (id: string | null) => void;
  getPost: (postId: string) => any | null;
  removePost: (postId: string) => void;
  clearPosts: () => void;
}

export const usePostStore = create<PostStore>((set, get) => ({
  postMap: {},

  // ajoute ou remplace un post
  setPost: (post) =>
    set((state) => ({
      postMap: { ...state.postMap, [post.post_id]: post },
    })),

  deletedItem:null,
  setDeletedItem: (id) => set({deletedItem: id}),

  // récupère un post via son id
  getPost: (postId) => {
    const map = get().postMap;
    return map[postId] || null;
  },

  // supprime un post du map
  removePost: (postId) =>
    set((state) => {
      const newMap = { ...state.postMap };
      delete newMap[postId];
      return { postMap: newMap };
  }),

  // vide le cache
  clearPosts: () => set({ postMap: {} }),
}));