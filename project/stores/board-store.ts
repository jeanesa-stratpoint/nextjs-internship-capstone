import { create } from "zustand";
import { DbList, DbTask } from "@/types";

export type StoreTask = Omit<DbTask, "createdAt" | "updatedAt" | "dueDate"> & {
  createdAt?: string | Date;
  updatedAt?: string | Date;
  dueDate?: string | Date | null;
};

export type StoreList = Omit<DbList, "createdAt" | "updatedAt"> & {
  createdAt?: string | Date;
  updatedAt?: string | Date;
};

interface BoardState {
  lists: StoreList[];
  tasks: StoreTask[];
  isLoading: boolean;
  setBoardData: (lists: StoreList[], tasks: StoreTask[]) => void;
  setLists: (lists: StoreList[]) => void;
  setTasks: (tasks: StoreTask[]) => void;
}

export const useBoardStore = create<BoardState>((set) => ({
  lists: [],
  tasks: [],
  isLoading: false,

  setBoardData: (lists, tasks) => set({ lists, tasks }),
  setLists: (lists) => set({ lists }),
  setTasks: (tasks) => set({ tasks }),
}));