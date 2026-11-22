import { describe, expect, it } from "bun:test";
import { createStore } from "jotai";
import { GeoPoint } from "firebase/firestore";
import { ClientDocumentSnapshot } from "@/types/ClientDocumentSnapshot";
import { docAtom, fieldAtom } from "./firestore";

const makeStore = () => {
  const store = createStore();
  store.set(
    docAtom("/c/d"),
    new ClientDocumentSnapshot({ m: { a: 1 } }, "d", "/c/d")
  );
  return store;
};

describe("fieldAtom changed fields", () => {
  it("records only the field itself when a map becomes a string", () => {
    const store = makeStore();

    store.set(fieldAtom("/c/d:m"), "hello");

    expect(store.get(docAtom("/c/d"))!.changedFields()).toEqual(["m"]);
  });

  it("records only the field itself when a map becomes a geopoint", () => {
    const store = makeStore();

    store.set(fieldAtom("/c/d:m"), new GeoPoint(1, 2));

    expect(store.get(docAtom("/c/d"))!.changedFields()).toEqual(["m"]);
  });

  it("records the new child when a key is added to a map", () => {
    const store = makeStore();

    store.set(fieldAtom("/c/d:m"), (current: any) => ({
      ...current,
      b: 2,
    }));

    expect(store.get(docAtom("/c/d"))!.changedFields()).toEqual(["m", "m.b"]);
  });
});
