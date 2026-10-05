import firebase from "firebase";
import { SimpleJsonType } from "./types";
import { serialItemIsSpecial } from "./firestore-identifiers";
import { mapDeepWithArrays } from "./map-deep-with-arrays";
import { omit } from "lodash";
import { DocRef } from "./DocRef";
import { DocumentSnapshot, QuerySnapshot } from './index.d';

function objectifyDocumentProperty(
    item: any,
    geoPoint: typeof firebase.firestore.GeoPoint,
    timestamp: typeof firebase.firestore.Timestamp,
    firestore?: (path: string) => any
): any {
    if (!serialItemIsSpecial(item)) {
        return item;
    }

    switch (item.type) {
        case 'DocumentReference':
            if (typeof item.path !== 'string') {
                throw new Error('DocumentReference "path" must be a string');
            }
            return firestore ? firestore(item.path) : new DocRef(item.path);
        case 'GeoPoint':
            if (!isFinite(item.latitude) || !isFinite(item.longitude)
                || typeof item.latitude !== 'number' || typeof item.longitude !== 'number') {
                throw new Error('GeoPoint "latitude" and "longitude" must be finite numbers');
            }
            return new geoPoint(item.latitude, item.longitude);
        case 'Timestamp': {
            const date = new Date(item.iso8601);
            if (typeof item.iso8601 !== 'string' || isNaN(date.getTime())) {
                throw new Error('Timestamp "iso8601" must be a valid date string');
            }
            return timestamp.fromDate(date);
        }
        default:
            throw new Error('Unknown special value type: ' + String(item.type));
    }
}
function objectifyDocument(
    partialObject: {
        [key: string]: SimpleJsonType,
    },
    geoPoint: typeof firebase.firestore.GeoPoint,
    timestamp: typeof firebase.firestore.Timestamp,
    firestore?: (path: string) => any
): DocumentSnapshot {
    const mappedObject = mapDeepWithArrays(partialObject, (item: any) => {
        return objectifyDocumentProperty(item, geoPoint, timestamp, firestore);
    });
    const id = partialObject.__id__ as string;
    const path = partialObject.__path__ as string;
    const mappedObjectToInclude = omit(mappedObject, '__id__', '__path__');

    return {
        id,
        ref: new DocRef(path) as any,
        data: () => mappedObjectToInclude
    };
}

export function deserializeDocumentSnapshotArray(
    string: string,
    geoPoint: typeof firebase.firestore.GeoPoint,
    timestamp: typeof firebase.firestore.Timestamp,
    firestore?: (path: string) => any
): DocumentSnapshot[] {
    const parsedString: any[] = JSON.parse(string);
    return parsedString.map(doc => {
        return objectifyDocument(doc, geoPoint, timestamp, firestore);
    });
}

export function deserializeDocumentSnapshot(
    string: string,
    geoPoint: typeof firebase.firestore.GeoPoint,
    timestamp: typeof firebase.firestore.Timestamp,
    firestore?: (path: string) => any
): DocumentSnapshot {
    return objectifyDocument(JSON.parse(string), geoPoint, timestamp, firestore);
}
