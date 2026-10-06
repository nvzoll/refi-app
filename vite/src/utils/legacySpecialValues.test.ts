import { describe, expect, it } from "bun:test";
import {
  decodeSpecialValues,
  encodeSpecialValues,
} from "./legacySpecialValues";

const special = (fields: object) => ({
  __fsSerializer__: "special",
  ...fields,
});

const tagged = JSON.stringify([
  {
    __id__: "d1",
    nested: {
      ref: special({ type: "DocumentReference", path: "users/u1" }),
      place: special({ type: "GeoPoint", latitude: -12.5, longitude: -0.25 }),
      at: special({ type: "Timestamp", iso8601: "2021-01-01T00:00:00.000Z" }),
    },
  },
]);

const legacy = JSON.stringify([
  {
    __id__: "d1",
    nested: {
      ref: "__DocumentReference__users/u1",
      place: "__GeoPoint__-12.5###-0.25",
      at: "__Timestamp__2021-01-01T00:00:00.000Z",
    },
  },
]);

describe("legacy special values", () => {
  it("encodes tagged values nested in a map inside an array", () => {
    expect(encodeSpecialValues(tagged)).toBe(legacy);
  });

  it("decodes prefixed strings back to tagged values", () => {
    expect(JSON.parse(decodeSpecialValues(legacy))).toEqual(JSON.parse(tagged));
  });

  it("keeps a string with an unparsable timestamp", () => {
    const json = JSON.stringify({ value: "__Timestamp__x" });
    expect(decodeSpecialValues(json)).toBe(json);
  });
});
