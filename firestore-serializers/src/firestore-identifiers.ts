import firebase from "firebase";
import { hasIn } from "lodash";
import { DocRef } from "./DocRef";

export function itemIsInternalDocumentReference(item: any): item is DocRef {
    return item instanceof DocRef;
}

export function itemIsFSDocumentReference(item: any): item is firebase.firestore.DocumentReference {
    return typeof item?.path === 'string' && typeof item.get === 'function';
}

export function itemIsDocumentReference(item: any): item is firebase.firestore.DocumentReference | DocRef {
    return itemIsInternalDocumentReference(item) || itemIsFSDocumentReference(item);
}

export function itemIsGeoPoint(item: any): item is firebase.firestore.GeoPoint {
    return [
        hasIn(item, 'latitude'),
        hasIn(item, 'longitude'),
        typeof item?.isEqual === 'function'
    ].every(e => e === true);
}

export function itemIsTimestamp(item: any): item is firebase.firestore.Timestamp {
    return [
        hasIn(item, 'seconds'),
        hasIn(item, 'nanoseconds'),
        hasIn(item, 'toDate')
    ].every(e => e === true)
}

export function serialItemIsSpecial(item: any): boolean {
    return item?.__fsSerializer__ === 'special';
}
