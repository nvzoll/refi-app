import { createStore, SetStateAction } from "jotai";

export const store = createStore();

export const resolveUpdate = <T>(update: SetStateAction<T>, current: T): T =>
  typeof update === "function" ? (update as (prev: T) => T)(current) : update;
