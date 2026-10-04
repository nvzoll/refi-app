import { describe, expect, it } from "bun:test";
import firebase from "firebase/app";
import "firebase/firestore";
import { ClientDocumentSnapshot } from "@/types/ClientDocumentSnapshot";
import {
  buildTableSubRows,
  convertFirebaseType,
  getAllColumnsRecursive,
  getCollectionPath,
  getIdFromPath,
  getParentPath,
  getRecursivePath,
  getSampleColumn,
  isCollection,
  removeFirebaseSerializeMetaData,
} from "./common";
import { simplify } from "./simplifr";

const doc = (data: Record<string, any>, id = "d") =>
  new ClientDocumentSnapshot(data, id, `/col/${id}`);

const tableRows = (data: Record<string, any>) => {
  const flat = simplify(data, ".");
  return buildTableSubRows(
    Object.keys(flat).map((key) => ({
      field: key.substr("root.".length),
      value: flat[key],
    }))
  );
};

describe("path helpers", () => {
  it.each([
    ["/", false, "/", undefined, "/"],
    ["/users", true, "/", undefined, "/users"],
    ["/users/u1", false, "/users", "u1", "/users"],
    ["/users/u1/posts", true, "/users/u1", undefined, "/users/u1/posts"],
  ])(
    "%s → collection %s, parent %s, id %s, collection path %s",
    (path, collection, parent, id, collectionPath) => {
      expect(isCollection(path)).toBe(collection);
      expect(getParentPath(path)).toBe(parent);
      expect(getIdFromPath(path)).toBe(id);
      expect(getCollectionPath(path)).toBe(collectionPath);
    }
  );

  it("builds the tree's expand chain from root to the node", () => {
    expect(getRecursivePath("/users/u1/posts")).toEqual([
      "/",
      "/",
      "/users",
      "/users/u1",
      "/users/u1/posts",
    ]);
  });

  it("ignores a trailing slash", () => {
    expect(getParentPath("/users/u1/")).toBe("/users");
    expect(getParentPath("/users/")).toBe("/");
  });
});

describe("getAllColumnsRecursive", () => {
  it("lists every nested field as a dotted column, parents included", () => {
    const columns = getAllColumnsRecursive([
      doc({ name: "a", address: { city: "x", geo: { lat: 1 } } }),
      doc({ tags: ["t1", "t2"] }),
    ]);

    expect(columns).toEqual([
      "name",
      "address",
      "address.city",
      "address.geo",
      "address.geo.lat",
      "tags",
      "tags.0",
      "tags.1",
    ]);
  });

  it("descends into Firestore values like any other object", () => {
    const columns = getAllColumnsRecursive([
      doc({ at: new firebase.firestore.Timestamp(1, 2) }),
    ]);

    expect(columns).toEqual(["at", "at.seconds", "at.nanoseconds"]);
  });
});

describe("getSampleColumn", () => {
  it("keeps columns shared within each pair of docs, sorted", () => {
    const columns = getSampleColumn([
      doc({ b: 1, a: 1, onlyFirst: 1 }),
      doc({ a: 1, b: 1 }),
      doc({ c: 1, z: 1 }),
    ]);

    expect(columns).toEqual(["a", "b", "c", "z"]);
  });
});

describe("buildTableSubRows", () => {
  it("nests map and array children under their parent, sorted by field", () => {
    const rows = tableRows({ z: 1, m: { b: 2, a: 1 }, l: ["x"] });

    expect(rows.map((row) => row.field)).toEqual(["l", "m", "z"]);
    expect(rows[0].subRows?.map((row) => row.field)).toEqual(["l.0"]);
    expect(rows[1].subRows?.map((row) => row.field)).toEqual(["m.a", "m.b"]);
    expect(rows[2]).toEqual({ field: "z", value: 1 });
  });

  it.failing("does not nest a sibling whose name starts with the parent's", () => {
    const rows = tableRows({ a: { x: 1 }, ab: { y: 2 } });

    expect(rows[0].subRows?.map((row) => row.field)).toEqual(["a.x"]);
  });
});

describe("removeFirebaseSerializeMetaData", () => {
  it("strips metadata and sorts keys at every level", () => {
    const input = JSON.stringify({
      __id__: "1",
      __path__: "/c/1",
      b: { d: 1, c: 2 },
      a: 1,
    });

    expect(removeFirebaseSerializeMetaData(input)).toBe(
      JSON.stringify({ a: 1, b: { c: 2, d: 1 } }, null, 2)
    );
  });

  it("strips metadata from each doc in an array", () => {
    const input = JSON.stringify([
      { __id__: "1", __path__: "/c/1", a: 1 },
      { __id__: "2", __path__: "/c/2", b: 2 },
    ]);

    expect(JSON.parse(removeFirebaseSerializeMetaData(input))).toEqual([
      { a: 1 },
      { b: 2 },
    ]);
  });

  it("returns invalid JSON unchanged", () => {
    expect(removeFirebaseSerializeMetaData("{oops")).toBe("{oops");
  });
});

describe("convertFirebaseType", () => {
  it("revives persisted timestamps, alone or in a list", () => {
    const single = convertFirebaseType({ seconds: 10, nanoseconds: 5 });
    const list = convertFirebaseType([{ seconds: 10, nanoseconds: 5 }, "x"]);

    expect(single).toBeInstanceOf(firebase.firestore.Timestamp);
    expect(single.isEqual(new firebase.firestore.Timestamp(10, 5))).toBe(true);
    expect(list[0]).toBeInstanceOf(firebase.firestore.Timestamp);
    expect(list[1]).toBe("x");
  });

  it.failing("revives a timestamp with zero nanoseconds", () => {
    expect(
      convertFirebaseType({ seconds: 10, nanoseconds: 0 })
    ).toBeInstanceOf(firebase.firestore.Timestamp);
  });
});
