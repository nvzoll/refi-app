import { mapDeepWithArrays } from "./map-deep-with-arrays";
import { itemIsDocumentReference, itemIsGeoPoint, itemIsTimestamp } from "./firestore-identifiers";
import { DocumentSnapshot, QuerySnapshot } from './index.d';
import { SerializedFirestoreValue } from "./types";

function stringifyDocumentProperty(item: any): any {
    let modifiedItem: any = item;

    if (itemIsDocumentReference(item)) {
        const value: SerializedFirestoreValue = {
            __fsSerializer__: 'special', type: 'DocumentReference', path: item.path
        };
        modifiedItem = value;
    }

    if (itemIsGeoPoint(item)) {
        const value: SerializedFirestoreValue = {
            __fsSerializer__: 'special', type: 'GeoPoint', latitude: item.latitude, longitude: item.longitude
        };
        modifiedItem = value;
    }

    if (itemIsTimestamp(item)) {
        const value: SerializedFirestoreValue = {
            __fsSerializer__: 'special', type: 'Timestamp', iso8601: item.toDate().toISOString()
        };
        modifiedItem = value;
    }

    return modifiedItem;
}

function stringifyDocument(document: DocumentSnapshot): any {
    const data = document.data();

    const dataToStringify = mapDeepWithArrays(data, stringifyDocumentProperty);
    return {
        __id__: document.id,
        __path__: document.ref.path,
        ...dataToStringify
    };
}

export function serializeQuerySnapshot(querySnapshot: QuerySnapshot): string {
    const stringifiedDocs = querySnapshot.docs.map((doc: DocumentSnapshot) => {
        return stringifyDocument(doc);
    });

    return JSON.stringify(stringifiedDocs);
}

export function serializeDocumentSnapshot(documentSnapshot: DocumentSnapshot) {
    return JSON.stringify(stringifyDocument(documentSnapshot));
}