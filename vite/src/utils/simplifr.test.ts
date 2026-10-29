import { describe, expect, it } from "bun:test";
import { GeoPoint, Timestamp } from "firebase/firestore";
import { DocRef } from "firestore-serializers";
import { getFirestoreType } from "./simplifr";

describe("getFirestoreType", () => {
  it.each([
    ["timestamp", new Timestamp(1, 0)],
    ["geopoint", new GeoPoint(1, 2)],
    ["reference", new DocRef("/users/u1")],
    ["map", { seconds: 1, nanoseconds: 0 }],
    ["map", { path: "a/b", n: 1 }],
    ["map", { latitude: 1, longitude: 2, label: "home" }],
    ["null", null],
  ])("detects %s", (type, value) => {
    expect(getFirestoreType(value)).toBe(type);
  });
});
