import {
  ClientDocumentSnapshot,
  IFieldValue,
} from "@/types/ClientDocumentSnapshot";
import { getParentPath, newId, prettifyPath } from "@/utils/common";
import {
  deserializeDocumentSnapshotArray,
  serializeQuerySnapshot,
} from "firestore-serializers";
import { atom } from "jotai";
import { differenceBy, uniq, uniqBy, uniqueId } from "lodash";
import {
  changedDocAtom,
  collectionAtom,
  deletedDocsAtom,
  docAtom,
  collectionHasBeenDeleteAtom,
  newDocsAtom,
  parseFSUrl,
  pathExpanderPureAtom,
  fieldAtom,
  buildFSUrl,
} from "./firestore";
import { store } from "./store";
import * as immutable from "object-path-immutable";
import { navigatorPathAtom, queryVersionAtom } from "./navigator";
import { actionGoTo } from "./navigator.action";
import { notifyErrorPromise } from "./ui.action";
import { convertFSValue } from "@/utils/fieldConverter";
import { GeoPoint, Timestamp } from "firebase/firestore";

interface IStoreDocsUpdate {
  added: ClientDocumentSnapshot[];
  modified: ClientDocumentSnapshot[];
  removed: ClientDocumentSnapshot[];
  override: boolean;
}

const storeDocsAtom = atom(
  null,
  (get, set, { added, modified, removed, override }: IStoreDocsUpdate) => {
    added.forEach((doc) => {
      if (override) {
        set(docAtom(doc.ref.path), doc);
      } else {
        set(docAtom(doc.ref.path), (curDoc) => {
          if (curDoc?.isChanged()) {
            return curDoc;
          }

          return doc;
        });
      }
    });

    modified.forEach((doc) => {
      set(docAtom(doc.ref.path), doc);
    });

    removed.forEach((doc) => {
      set(docAtom(doc.ref.path), null);
    });
  }
);

export const actionStoreDocs = (
  {
    added = [],
    modified = [],
    removed = [],
  }: {
    added?: ClientDocumentSnapshot[];
    modified?: ClientDocumentSnapshot[];
    removed?: ClientDocumentSnapshot[];
  },
  override = false
): void => {
  store.set(storeDocsAtom, { added, modified, removed, override });
};

// This is trigger from user
export const actionDeleteDoc = async (docPath: string) => {
  const doc = await store.get(docAtom(docPath));
  if (doc) {
    store.set(docAtom(docPath), null);
    if (doc.isNew) {
      // Ignore if the doc is new and haven't commit to db
      return true;
    }
    store.set(deletedDocsAtom, (docs) =>
      uniqBy([...docs, doc], (doc) => doc.ref.path)
    );
  }

  return true;
};

// This is trigger from server. It will irevertable
export const actionRemoveDocs = (
  docs: ClientDocumentSnapshot[],
  override = false
): void => {
  docs.forEach(async (doc) => {
    // TODO: What if user already modified the deleted one
    store.set(docAtom(doc.ref.path), null);
    store.set(deletedDocsAtom, (deletedDocs) =>
      differenceBy(deletedDocs, docs, (doc) => doc.ref.path)
    );
  });
};

const deleteCollectionAtom = atom(
  null,
  (
    get,
    set,
    {
      path,
      docsInCollection,
    }: { path: string; docsInCollection: ClientDocumentSnapshot[] }
  ) => {
    docsInCollection.forEach((doc) => {
      set(docAtom(doc.ref.path), null);
    });
    set(deletedDocsAtom, (docs) =>
      uniqBy([...docs, ...docsInCollection], (doc) => doc.ref.path)
    );
    set(collectionHasBeenDeleteAtom, (paths) => uniq([...paths, path]));
  }
);

// This is trigger from user
export const actionDeleteCollection = async (path: string): Promise<void> => {
  console.log(`start delete collection ${path}`);
  // Marks all docs as delete
  const docsInCollection = await store.get(collectionAtom(path));

  requestAnimationFrame(() => {
    store.set(deleteCollectionAtom, { path, docsInCollection });
  });
};

export const actionUpdateDoc = (doc: ClientDocumentSnapshot): void => {
  store.set(docAtom(doc.ref.path), doc);
};

export const actionUpdateFieldKey = async (
  oldPath: string,
  newField: string
): Promise<void> => {
  const { path, field: oldField } = parseFSUrl(oldPath);
  const curDocAtom = docAtom(path);
  const doc = await store.get(curDocAtom);
  if (doc) {
    const docData = immutable.wrap(doc.data());
    const oldFieldData = immutable.get(doc.data(), oldField);
    const newData = docData.del(oldField).set(newField, oldFieldData);

    const newDoc = doc.clone(newData.value());
    newDoc.addChange([oldField, newField]);
    store.set(docAtom(path), newDoc);
  }
};

export const actionRemoveFieldKey = async (oldPath: string): Promise<void> => {
  const { path, field: oldField } = parseFSUrl(oldPath);
  const curDocAtom = docAtom(path);
  const doc = await store.get(curDocAtom);
  if (doc) {
    const newDoc = doc.clone().removeField(oldField);
    store.set(docAtom(path), newDoc);
  }
};

export const actionCommitChange = async (): Promise<boolean> => {
  const docsChange = await store.get(changedDocAtom);

  const newDocs = await store.get(newDocsAtom);
  const allDeletedDocs = await store.get(deletedDocsAtom);

  const deletedCollections = await store.get(collectionHasBeenDeleteAtom);

  const deletedDocs = allDeletedDocs.filter(
    (doc) =>
      !deletedCollections.find((collection) =>
        doc.ref.path.startsWith(collection)
      )
  );

  window
    .send("fs.updateDocs", {
      docs: serializeQuerySnapshot({ docs: docsChange }),
    })
    .catch(notifyErrorPromise);

  window
    .send("fs.addDocs", {
      docs: serializeQuerySnapshot({ docs: newDocs }),
    })
    .catch(notifyErrorPromise);

  window
    .send("fs.deleteDocs", {
      docs: deletedDocs.map((doc) => doc.ref.path),
    })
    .then(() => {
      store.set(deletedDocsAtom, []);
    })
    .catch(notifyErrorPromise);

  window
    .send("fs.deleteCollections", {
      collections: deletedCollections,
    })
    .then(() => {
      store.set(collectionHasBeenDeleteAtom, []);
      store.set(pathExpanderPureAtom, (paths) =>
        paths.filter(
          (path) =>
            !deletedCollections.find((collection) =>
              path.startsWith(collection)
            )
        )
      );
    })
    .catch(notifyErrorPromise);
  return true;
};

export const actionReverseChange = async (): Promise<any> => {
  // TODO: Confirm box to reload
  window.location.reload();
  // const docsChange = await store.get(//   changedDocAtom
  //);

  // return window
  //   .send("fs.getDocs", {
  //     docs: docsChange.map((doc) => doc.ref.path),
  //   })
  //   .then((response) => {
  //     const data = deserializeDocumentSnapshotArray(
  //       response,
  //       GeoPoint,
  //       Timestamp
  //     );

  //     actionStoreDocs(ClientDocumentSnapshot.transformFromFirebase(data), true);
  //   });
};

export const actionReverseDocChange = async (
  docPath: string,
  type: "new" | "modified" | "deleted"
): Promise<any> => {
  const { queryVersion } = await store.get(queryVersionAtom);
  // TODO: Do we really need to fetch the data again?

  if (type === "new") {
    store.set(docAtom(docPath), null);
    return;
  }

  return window
    .send("fs.getDocs", {
      docs: [docPath],
    })
    .then((response) => {
      const data = deserializeDocumentSnapshotArray(
        response,
        GeoPoint,
        Timestamp
      );

      actionStoreDocs(
        {
          added: ClientDocumentSnapshot.transformFromFirebase(
            data,
            queryVersion
          ),
        },
        true
      );

      store.set(deletedDocsAtom, (docs) =>
        docs.filter((doc) => doc.ref.path !== docPath)
      );
    })
    .catch(notifyErrorPromise);
};

export const actionGetDocs = async (paths: string[]) => {
  const { queryVersion } = await store.get(queryVersionAtom);

  return window
    .send("fs.getDocs", {
      docs: paths,
    })
    .then((response) => {
      const data = deserializeDocumentSnapshotArray(
        response,
        GeoPoint,
        Timestamp
      );

      actionStoreDocs(
        {
          added: ClientDocumentSnapshot.transformFromFirebase(
            data,
            queryVersion
          ),
        },
        false
      );
    });
};

export const actionAddPathExpander = (paths: string[]) => {
  store.set(pathExpanderPureAtom, (currentValue) =>
    uniq([...currentValue, ...paths.map((path) => prettifyPath(path))])
  );
};

export const actionDuplicateDoc = async (path: string) => {
  const doc = await store.get(docAtom(path));

  if (!doc) {
    // TODO: Throw error here
    return;
  }

  const newDocId = newId();
  const newDoc = doc.clone(doc.data(), newDocId);
  store.set(docAtom(newDoc.ref.path), newDoc);
  actionGoTo(newDoc.ref.path);
};

interface IActionImportDocsOption {
  idField?: string;
  autoParseJSON?: boolean;
}

export const actionImportDocs = async (
  path: string,
  docs: any[],
  option: IActionImportDocsOption
) => {
  console.log({
    docs,
    path,
    option,
  });
  // TODO: Check if path is collection
  return window.send("fs.importDocs", {
    docs,
    path,
    option,
  });
};

export const actionNewDocument = async (
  collectionPath: string,
  id?: string
) => {
  // const newDocId = uniqueId(NEW_DOC_PREFIX);
  // TODO: Sort new document to the bottom of table
  const newDocId = id || newId();
  const newPath = prettifyPath(`${collectionPath}/${newDocId}`);

  const { queryVersion } = await store.get(queryVersionAtom);
  store.set(
    docAtom(newPath),
    new ClientDocumentSnapshot({}, newDocId, newPath, queryVersion, true)
  );

  store.set(navigatorPathAtom, newPath);
};

export const actionSetFieldValue = async (
  docPath: string,
  field: string,
  fieldType: RefiFS.IFieldType
) => {
  const fieldPath = buildFSUrl({ path: docPath, field });
  const instanceValue = await store.get(fieldAtom(fieldPath));
  const newValue = convertFSValue(instanceValue, fieldType);
  store.set(fieldAtom(fieldPath), newValue);
};
