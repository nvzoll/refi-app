import { describe, expect, it } from "bun:test";
import firebase from "firebase/app";
import "firebase/firestore";
import { convertFSValue } from "./fieldConverter";

const { GeoPoint, Timestamp } = firebase.firestore;

describe("convertFSValue from string", () => {
  it.each([
    ["12.5", 12.5],
    ["abc", 0],
  ])("%s → number %s", (input, expected) => {
    expect(convertFSValue(input, "number")).toBe(expected);
  });

  it.each([
    ["yes", true],
    ["TRUE", true],
    ["no", false],
  ])("%s → boolean %s", (input, expected) => {
    expect(convertFSValue(input, "boolean")).toBe(expected);
  });

  it("parses a lat,long pair into a geopoint", () => {
    expect(convertFSValue("1.5, 2", "geopoint")).toEqual(new GeoPoint(1.5, 2));
    expect(convertFSValue("north", "geopoint")).toEqual(new GeoPoint(0, 0));
  });

  it("falls back to an empty map on invalid JSON", () => {
    expect(convertFSValue("{oops", "map")).toEqual({});
  });

  it("parses an ISO date into that instant", () => {
    const iso = "2021-03-04T05:06:07.000Z";

    expect(convertFSValue(iso, "timestamp").toDate().toISOString()).toBe(iso);
  });
});

describe("convertFSValue from Firestore types", () => {
  const at = Timestamp.fromDate(new Date("2021-03-04T05:06:07.000Z"));

  it("turns a timestamp into an ISO string or epoch millis", () => {
    expect(convertFSValue(at, "string")).toBe("2021-03-04T05:06:07.000Z");
    expect(convertFSValue(at, "number")).toBe(at.toMillis());
  });

  it("turns a geopoint into a lat,long string or a coordinate map", () => {
    expect(convertFSValue(new GeoPoint(1.5, 2), "string")).toBe("1.5,2");
    expect(convertFSValue(new GeoPoint(1.5, 2), "map")).toEqual({
      latitude: 1.5,
      longitude: 2,
    });
  });

  it("uses the target type's default for unsupported pairs", () => {
    expect(convertFSValue(42, "geopoint")).toEqual(new GeoPoint(0, 0));
    expect(convertFSValue(true, "map")).toEqual({});
  });
});

describe("convertFSValue from map", () => {
  it("turns coordinate maps into geopoints", () => {
    expect(convertFSValue({ latitude: 1.5, longitude: 2 }, "geopoint")).toEqual(
      new GeoPoint(1.5, 2)
    );
    expect(
      convertFSValue({ _latitude: 1.5, _longitude: 2 }, "geopoint")
    ).toEqual(new GeoPoint(1.5, 2));
    expect(convertFSValue({ latitude: 0, longitude: 0 }, "geopoint")).toEqual(
      new GeoPoint(0, 0)
    );
  });
});

describe("convertFSValue from array", () => {
  it("turns an array into an index-keyed map", () => {
    expect(convertFSValue(["a", "b"], "map")).toEqual({ 0: "a", 1: "b" });
  });
});
