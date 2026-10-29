import { describe, expect, it } from "bun:test";
import { createStore } from "jotai";
import { Timestamp } from "firebase/firestore";

const storage = new Map<string, string>();
Object.assign(globalThis, {
  window: {},
  localStorage: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, String(value)),
    removeItem: (key: string) => storage.delete(key),
  },
});

const storedFilters = [
  {
    id: "filter_1",
    field: "createdAt",
    operator: {
      type: ">=",
      values: { seconds: 1700000000, nanoseconds: 500 },
    },
    isActive: true,
  },
];

storage.set(
  "user-settings",
  JSON.stringify({
    "ui/defaultEditor": "basic",
    "ui/appTheme": false,
    "ui/emulator-project": "my-project",
  })
);
storage.set(
  "undefined",
  JSON.stringify({
    'fs/propertyList__"/users"': ["name", "age"],
    'fs.querier__"/users"': JSON.stringify(storedFilters),
    'fs/propertyList__"/other"': ["title"],
  })
);

const { ClientDocumentSnapshot } = await import(
  "@/types/ClientDocumentSnapshot"
);
const { collectionAtom, docAtom, docsLibraryAtom } = await import(
  "./firestore"
);
const { propertyListAtom, propertyListCoreAtom, querierAtom } = await import(
  "./navigator"
);
const { defaultEditorAtom, emulatorProjectId } = await import("./ui");
const { appThemeAtom } = await import("./ui.action");

const bucket = (key: string) => JSON.parse(storage.get(key) ?? "{}");

describe("persisted settings", () => {
  it("reads the stored values in their existing format", () => {
    const store = createStore();

    expect(store.get(defaultEditorAtom)).toBe("basic");
    expect(store.get(appThemeAtom)).toBe(false);
    expect(store.get(emulatorProjectId)).toBe("my-project");
    expect(store.get(propertyListCoreAtom("/users"))).toEqual(["name", "age"]);

    const [filter] = store.get(querierAtom("/users"));
    expect(filter.field).toBe("createdAt");
    expect(filter.operator.values).toBeInstanceOf(Timestamp);
    expect(filter.operator.values).toMatchObject({
      seconds: 1700000000,
      nanoseconds: 500,
    });
  });

  it("writes the same format and keeps the other entries", () => {
    const store = createStore();

    store.set(defaultEditorAtom, "advantage");
    store.set(appThemeAtom, true);
    store.set(propertyListAtom("/users"), (list) => [...list, "email"]);
    store.set(querierAtom("/users"), (filters) =>
      filters.map((filter) => ({ ...filter, isActive: false }))
    );

    expect(bucket("user-settings")).toEqual({
      "ui/defaultEditor": "advantage",
      "ui/appTheme": true,
      "ui/emulator-project": "my-project",
    });

    const projectSettings = bucket("undefined");
    expect(projectSettings['fs/propertyList__"/users"']).toEqual([
      "name",
      "age",
      "email",
    ]);
    expect(projectSettings['fs/propertyList__"/other"']).toEqual(["title"]);
    expect(typeof projectSettings['fs.querier__"/users"']).toBe("string");
    expect(JSON.parse(projectSettings['fs.querier__"/users"'])).toEqual([
      { ...storedFilters[0], isActive: false },
    ]);
  });
});

describe("docAtom", () => {
  it("adds a stored document to the library its collection reads", () => {
    const store = createStore();
    const doc = new ClientDocumentSnapshot({ name: "a" }, "d", "/c/d");

    store.set(docAtom("/c/d"), (current) => current ?? doc);

    expect(store.get(docsLibraryAtom)).toEqual(["/c/d"]);
    expect(store.get(collectionAtom("/c"))).toEqual([doc]);
  });
});
