import { describe, expect, it } from "bun:test";
import firebase from "firebase/app";
import "firebase/firestore";
import { DocRef } from "firestore-serializers";
import { getFirestoreType } from "./simplifr";

describe("getFirestoreType", () => {
  it.each([
    ["timestamp", new firebase.firestore.Timestamp(1, 0)],
    ["geopoint", new firebase.firestore.GeoPoint(1, 2)],
    ["reference", new DocRef("/users/u1")],
    ["map", { seconds: 1, nanoseconds: 0 }],
    ["null", null],
  ])("detects %s", (type, value) => {
    expect(getFirestoreType(value)).toBe(type);
  });
});
