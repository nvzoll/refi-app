export type SimpleJsonType = string | number | boolean | SimpleJsonType[] | {
    [key: string]: SimpleJsonType
};

export type SerializedFirestoreValue =
    | { __fsSerializer__: 'special', type: 'DocumentReference', path: string }
    | { __fsSerializer__: 'special', type: 'GeoPoint', latitude: number, longitude: number }
    | { __fsSerializer__: 'special', type: 'Timestamp', iso8601: string };
