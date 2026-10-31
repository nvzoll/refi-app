import {
  ClientDocumentSnapshot,
  IFieldValue,
} from "@/types/ClientDocumentSnapshot";
import { getParentPath } from "@/utils/common";
import { difference, isObject, isUndefined } from "lodash";
import * as immutable from "object-path-immutable";
import { atom, SetStateAction } from "jotai";
import { atomFamily } from "jotai-family";
import { queryVersionAtom } from "./navigator";
import { resolveUpdate } from "./store";

type IFirestorePath = string;
interface IPathDetail {
  path: string;
  field: string;
}

export const buildFSUrl = ({ path, field }: IPathDetail): IFirestorePath => {
  return `${path}:${field}`;
};

export const parseFSUrl = (url: string): IPathDetail => {
  // Path convention: {path}:{fieldName}
  const [path, field] = url.split(":");
  return {
    path,
    field,
  };
};

export const projectIdAtom = atom<string>("");

export const deletedDocsAtom = atom<ClientDocumentSnapshot[]>([]);

// TODO: Clean up function for this library
export const docsLibraryAtom = atom<IFirestorePath[]>([]);

export const docAtom = atomFamily((path: IFirestorePath) => {
  const anAtom = atom(
    null as ClientDocumentSnapshot | null,
    (get, set, update: SetStateAction<ClientDocumentSnapshot | null>) => {
      const newDoc = resolveUpdate(update, get(anAtom));
      set(anAtom, newDoc);
      // TODO: Sync the case doc is deleted
      if (newDoc instanceof ClientDocumentSnapshot) {
        set(docsLibraryAtom, (docsLibrary) =>
          docsLibrary.includes(newDoc.ref.path)
            ? docsLibrary
            : [...docsLibrary, newDoc.ref.path]
        );
      }
    }
  );
  return anAtom;
});

// NOTICE: This atom is impact your performance
export const collectionAtom = atomFamily((path: IFirestorePath) =>
  atom<ClientDocumentSnapshot[]>((get) => {
    const docsLibrary = get(docsLibraryAtom);
    return docsLibrary
      .filter((docPath) => getParentPath(docPath) === path)
      .map((docPath) => get(docAtom(docPath)))
      .filter(
        (docValue): docValue is ClientDocumentSnapshot => docValue !== null
      );
  })
);

export const queryDocOrder = atomFamily((queryVersion: number) =>
  atom<string[]>([])
);

// NOTICE: This atom is impact your performance
export const collectionWithQueryAtom = atomFamily((path: IFirestorePath) =>
  atom<ClientDocumentSnapshot[]>((get) => {
    const { queryVersion } = get(queryVersionAtom);
    const docsOrder = get(queryDocOrder(queryVersion));

    const docsLibrary = get(docsLibraryAtom);
    return docsLibrary
      .filter((docPath) => getParentPath(docPath) === path)
      .map((docPath) => get(docAtom(docPath)))
      .filter(
        (docValue): docValue is ClientDocumentSnapshot => docValue !== null
      )
      .filter((docValue) => docValue.queryVersion === queryVersion)
      .sort((a, b) => {
        return (
          docsOrder.findIndex((orderPath) => orderPath === a.ref.path) -
          docsOrder.findIndex((orderPath) => orderPath === b.ref.path)
        );
      });
  })
);

// NOTICE: This atom is impact your performance
export const totalDocsWithQueryAtom = atomFamily((path: IFirestorePath) =>
  atom<number>((get) => {
    const docs = get(collectionWithQueryAtom(path));
    return docs.length;
  })
);

// NOTICE: This atom is impact your performance
export const allDocsAtom = atom<ClientDocumentSnapshot[]>((get) => {
  const docsLibrary = get(docsLibraryAtom);
  return docsLibrary
    .map((docPath) => get(docAtom(docPath)))
    .filter(
      (docValue): docValue is ClientDocumentSnapshot => docValue !== null
    );
});

export const fieldAtom = atomFamily((url: string) => {
  const anAtom = atom(
    (get) => {
      const { path, field } = parseFSUrl(url);
      const doc = get(docAtom(path));

      if (doc) {
        return immutable.get(doc.data(), field) as unknown as IFieldValue;
      }

      return undefined;
    },
    (get, set, update: SetStateAction<IFieldValue | undefined>) => {
      const newValue = resolveUpdate(update, get(anAtom));
      if (isUndefined(newValue)) {
        return;
      }

      const { path, field } = parseFSUrl(url);
      const doc = get(docAtom(path));
      if (doc) {
        const newDoc = doc.clone().setField(field, newValue);
        const oldValue = immutable.get(doc.data(), field);
        if (newValue && isObject(oldValue) && isObject(oldValue)) {
          // Add changes if the object inside changed
          // TODO: Use immer to store field patch
          newDoc.addChange(
            difference(Object.keys(newValue), Object.keys(oldValue)).map(
              (key) => `${field}.${key}`
            )
          );
        }
        set(docAtom(path), newDoc);
      }
    }
  );
  return anAtom;
});

export const fieldChangedAtom = atomFamily((url: string) =>
  atom<boolean>((get) => {
    const { path, field } = parseFSUrl(url);
    const doc = get(docAtom(path));

    if (doc) {
      return doc.changedFields().includes(field);
    }

    return false;
  })
);

// NOTICE: This atom is impact your performance
export const changedDocAtom = atom<ClientDocumentSnapshot[]>((get) => {
  const docs = get(docsLibraryAtom);

  return docs
    .map((docPath) => get(docAtom(docPath)))
    .filter((docValue): docValue is ClientDocumentSnapshot => docValue !== null)
    .filter((doc) => doc.isChanged());
});

export const newDocsAtom = atom<ClientDocumentSnapshot[]>((get) => {
  const docs = get(docsLibraryAtom);

  return docs
    .map((docPath) => get(docAtom(docPath)))
    .filter((docValue): docValue is ClientDocumentSnapshot => docValue !== null)
    .filter((doc) => doc.isNew);
});

export const hasNewDocAtom = atomFamily((path: string) =>
  atom<boolean>((get) => {
    const newDocs = get(newDocsAtom);

    for (let i = 0; i < newDocs.length; i++) {
      const doc = newDocs[i];
      if (doc.ref.path.startsWith(path)) {
        return true;
      }
    }

    return false;
  })
);

// NOTICE: This atom is impact your performance
export const hasModifiedDocAtom = atomFamily((path: string) =>
  atom<boolean>((get) => {
    const docsChange = get(changedDocAtom);

    return docsChange.some((doc) => doc.ref.path.startsWith(path));
  })
);

export const collectionHasBeenDeleteAtom = atom<string[]>([]);

export const pathExpanderPureAtom = atom<string[]>([]);

export const pathExpanderAtom = atom<string[]>((get) => {
  const deletedCollections = get(collectionHasBeenDeleteAtom);

  return get(pathExpanderPureAtom).filter(
    (path) =>
      !deletedCollections.find((collection) => path.startsWith(collection))
  );
});
