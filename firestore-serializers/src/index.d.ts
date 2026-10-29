import type { DocumentReference, GeoPoint, Timestamp } from "firebase/firestore";

type DocumentData = { [field: string]: any };
type GeoPointClass = new (latitude: number, longitude: number) => unknown;
type TimestampClass = { fromDate(date: Date): unknown };
declare class IDocRef {
    public path: string;
    public constructor(path: string);
}
declare class DocumentSnapshot<T = DocumentData> {
    readonly ref: IDocRef
    readonly id: string;
    data(): T | undefined;
}

declare class QuerySnapshot<T = DocumentSnapshot> {
    readonly docs: Array<T>;
}

declare function serializeDocumentSnapshot(
    documentSnapshot: DocumentSnapshot
): string;

declare function serializeQuerySnapshot(
    querySnapshot: QuerySnapshot
): string;

declare function deserializeDocumentSnapshot<
    T = DocumentData
>(
    input: string,
    geoPoint: GeoPointClass,
    timestamp: TimestampClass,
    firestore?: (path: string) => any
): DocumentSnapshot<T>;

declare function deserializeDocumentSnapshotArray<
    T = DocumentData
>(
    input: string,
    geoPoint: GeoPointClass,
    timestamp: TimestampClass,
    firestore?: (path: string) => any
): DocumentSnapshot<T>[];


declare function itemIsInternalDocumentReference(item: any): item is IDocRef

declare function itemIsFSDocumentReference(item: any): item is DocumentReference

declare function itemIsDocumentReference(item: any): item is DocumentReference | IDocRef

declare function itemIsGeoPoint(item: any): item is GeoPoint

declare function itemIsTimestamp(item: any): item is Timestamp

declare function serialItemIsSpecial(item: any): boolean

declare class DocRef {
    public path: string;
    public constructor(path: string);
}