import { describe, expect, it } from "bun:test";
import firebase from "firebase";
import "firebase/firestore";
import { DocRef } from "./DocRef";
import { deserializeDocumentSnapshot, deserializeDocumentSnapshotArray } from "./Deserialize";
import { serializeDocumentSnapshot, serializeQuerySnapshot } from "./Serialize";

const { GeoPoint, Timestamp } = firebase.firestore;

function snapshot(data: any): any {
    return { id: "doc1", ref: { path: "col/doc1" }, data: () => data };
}

function roundTrip(data: any, firestore?: (path: string) => any): any {
    const json = serializeDocumentSnapshot(snapshot(data));
    return deserializeDocumentSnapshot(json, GeoPoint, Timestamp, firestore).data();
}

function deserializeData(data: any): any {
    const json = JSON.stringify({ __id__: "doc1", __path__: "col/doc1", ...data });
    return deserializeDocumentSnapshot(json, GeoPoint, Timestamp).data();
}

const special = { __fsSerializer__: "special" };

describe("special values", () => {
    const original = {
        list: [{
            ref: new DocRef("users/u1"),
            point: new GeoPoint(-12.5, -0.25),
            time: new Timestamp(1609459200, 0),
        }],
    };

    it("serializes to tagged objects", () => {
        const json = JSON.parse(serializeDocumentSnapshot(snapshot(original)));

        expect(json).toEqual({
            __id__: "doc1",
            __path__: "col/doc1",
            list: [{
                ref: { ...special, type: "DocumentReference", path: "users/u1" },
                point: { ...special, type: "GeoPoint", latitude: -12.5, longitude: -0.25 },
                time: { ...special, type: "Timestamp", iso8601: "2021-01-01T00:00:00.000Z" },
            }],
        });
    });

    it("round trips references, geopoints and timestamps nested in arrays and maps", () => {
        const result = roundTrip(original);

        expect(result.list[0].ref).toBeInstanceOf(DocRef);
        expect(result.list[0].ref.path).toBe("users/u1");
        expect(result.list[0].point).toBeInstanceOf(GeoPoint);
        expect(result.list[0].point.isEqual(original.list[0].point)).toBe(true);
        expect(result.list[0].time).toBeInstanceOf(Timestamp);
        expect(result.list[0].time.toMillis()).toBe(original.list[0].time.toMillis());
    });

    it("builds references through the firestore callback", () => {
        const result = roundTrip(original, (path) => ({ built: path }));

        expect(result.list[0].ref).toEqual({ built: "users/u1" });
    });

    it("serializes and deserializes query snapshots", () => {
        const json = serializeQuerySnapshot({ docs: [snapshot(original)] } as any);
        const docs = deserializeDocumentSnapshotArray(json, GeoPoint, Timestamp);

        expect(docs).toHaveLength(1);
        expect(docs[0].id).toBe("doc1");
        expect((docs[0].data() as any).list[0].ref.path).toBe("users/u1");
    });
});

describe("plain values", () => {
    it("keeps a map with a path key as a map", () => {
        const data = { nested: { path: "a/b", n: 1 } };

        expect(roundTrip(data)).toEqual(data);
    });

    it("keeps a map with latitude and longitude keys as a map", () => {
        const data = { nested: { latitude: 1, longitude: 2, label: "home" } };

        expect(roundTrip(data)).toEqual(data);
    });

    it("keeps strings that look like old encodings as strings", () => {
        const data = {
            geo: "__GeoPoint__1###2",
            time: "__Timestamp__2021-01-01T00:00:00.000Z",
            ref: "__DocumentReference__a/b",
        };

        expect(roundTrip(data)).toEqual(data);
    });
});

describe("malformed special values", () => {
    it.each([
        ["an unknown type", { ...special, type: "Nope" }],
        ["a non-string path", { ...special, type: "DocumentReference", path: 1 }],
        ["a non-numeric latitude", { ...special, type: "GeoPoint", latitude: "1", longitude: 2 }],
        ["a non-finite longitude", { ...special, type: "GeoPoint", latitude: 1, longitude: null }],
        ["an unparsable iso8601", { ...special, type: "Timestamp", iso8601: "x" }],
        ["a non-string iso8601", { ...special, type: "Timestamp", iso8601: 0 }],
    ])("throws for %s", (_, value) => {
        expect(() => deserializeData({ field: value })).toThrow();
    });
});
