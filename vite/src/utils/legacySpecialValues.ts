import { serialItemIsSpecial } from "firestore-serializers";

const REFERENCE_PREFIX = "__DocumentReference__";
const GEO_POINT_PREFIX = "__GeoPoint__";
const TIMESTAMP_PREFIX = "__Timestamp__";

const mapValues = (value: any, convert: (item: any) => any): any => {
  if (Array.isArray(value)) {
    return value.map((item) => mapValues(item, convert));
  }
  const converted = convert(value);
  if (converted !== value) {
    return converted;
  }
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        mapValues(item, convert),
      ])
    );
  }
  return value;
};

const encodeSpecialValue = (item: any): any => {
  if (!serialItemIsSpecial(item)) {
    return item;
  }
  switch (item.type) {
    case "DocumentReference":
      return REFERENCE_PREFIX + item.path;
    case "GeoPoint":
      return `${GEO_POINT_PREFIX}${item.latitude}###${item.longitude}`;
    case "Timestamp":
      return TIMESTAMP_PREFIX + item.iso8601;
    default:
      return item;
  }
};

const decodeSpecialValue = (item: any): any => {
  if (typeof item !== "string") {
    return item;
  }
  if (item.startsWith(REFERENCE_PREFIX)) {
    return {
      __fsSerializer__: "special",
      type: "DocumentReference",
      path: item.slice(REFERENCE_PREFIX.length),
    };
  }
  if (item.startsWith(TIMESTAMP_PREFIX)) {
    const date = new Date(item.slice(TIMESTAMP_PREFIX.length));
    return isNaN(date.getTime())
      ? item
      : {
          __fsSerializer__: "special",
          type: "Timestamp",
          iso8601: date.toISOString(),
        };
  }
  if (item.startsWith(GEO_POINT_PREFIX)) {
    const [latitude, longitude] = item
      .slice(GEO_POINT_PREFIX.length)
      .split("###");
    return {
      __fsSerializer__: "special",
      type: "GeoPoint",
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
    };
  }
  return item;
};

export const encodeSpecialValues = (json: string): string =>
  JSON.stringify(mapValues(JSON.parse(json), encodeSpecialValue));

export const decodeSpecialValues = (json: string): string =>
  JSON.stringify(mapValues(JSON.parse(json), decodeSpecialValue));
