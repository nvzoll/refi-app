import { prettifyPath, removeFirebaseSerializeMetaData } from "@/utils/common";
import { FILTER_PREFIX } from "@/utils/contant";
import { encodeSpecialValues } from "@/utils/legacySpecialValues";
import exportFromJSON from "export-from-json";
import {
  serializeDocumentSnapshot,
  serializeQuerySnapshot,
} from "firestore-serializers";
import { uniq, uniqueId } from "lodash";
import { collectionWithQueryAtom, docAtom, queryDocOrder } from "./firestore";
import { actionAddPathExpander } from "./firestore.action";
import {
  IQueryResult,
  navigatorCollectionPathAtom,
  navigatorPathAtom,
  propertyListAtom,
  querierAtom,
  queryHistory,
  queryResultAtom,
  queryVersionAtom,
  sorterAtom,
  WhereFilterOp,
} from "./navigator";
import { store } from "./store";
import { notifyErrorPromise } from "./ui.action";

export const actionGoTo = (path: string): void => {
  store.set(navigatorPathAtom, prettifyPath(path));
};

export const actionRemoveProperty = (
  collectionPath: string,
  property: string
): void => {
  store.set(propertyListAtom(collectionPath), (propertyList) =>
    propertyList.filter((item) => item !== property)
  );
};

export const actionAddProperty = (
  collectionPath: string,
  property: string
): void => {
  store.set(propertyListAtom(collectionPath), (propertyList) =>
    uniq([property, ...propertyList].filter(Boolean))
  );
};

export const actionSetProperty = (
  collectionPath: string,
  properties: string[]
): void => {
  store.set(propertyListAtom(collectionPath), properties);
};

export const actionSubmitQuery = async (
  withQuerier = true,
  option?: {
    startAfter?: string;
    endBefore?: string;
    startAt?: string;
    endAt?: string;
    collectionPath?: string;
  }
): Promise<boolean> => {
  store.set(queryVersionAtom, ({ queryVersion, collectionPath }) => ({
    collectionPath,
    ...option,
    queryVersion: queryVersion + 1,
    withQuerier,
  }));

  if (!withQuerier) {
    const collectionPath = await store.get(navigatorCollectionPathAtom);

    store.set(querierAtom(collectionPath), (querierOptions) =>
      querierOptions.map((option) => ({ ...option, isActive: false }))
    );
  }

  return true;
};

export const actionQueryPage = async (isNext = true): Promise<boolean> => {
  const collectionPath = await store.get(navigatorCollectionPathAtom);
  const lastQuery = queryHistory[queryHistory.length - 2];
  const currentQuery = queryHistory[queryHistory.length - 1];

  const docs = await store.get(queryDocOrder(currentQuery.queryVersion));

  if (
    docs.length === 0 &&
    lastQuery &&
    collectionPath === lastQuery.collectionPath
  ) {
    actionSubmitQuery(true, lastQuery);
    return true;
  }

  if (docs.length > 0) {
    if (isNext) {
      actionSubmitQuery(true, {
        startAfter: docs[docs.length - 1],
      });
      return true;
    } else {
      actionSubmitQuery(true, {
        endBefore: docs[0],
      });
      return true;
    }
  }

  return false;
};

export const actionRemoveSorter = (
  collectionPath: string,
  sorterId: string
): void => {
  store.set(sorterAtom(collectionPath), (sorterList) =>
    sorterList.filter((item) => item.id !== sorterId)
  );
};

export const actionAddSorter = (
  collectionPath: string,
  value: { field: string; sort: "asc" | "desc" }
): void => {
  const newSorter = {
    ...value,
    id: uniqueId("fs.sorter"),
  };
  store.set(sorterAtom(collectionPath), (sorterList) => [
    newSorter,
    ...sorterList.filter((sorter) => sorter.field !== newSorter.field),
  ]);
};

export const actionExportCollectionJSON = async (collectionPath: string) => {
  return window
    .send("fs.exportCollection", {
      path: collectionPath,
    })
    .then(({ docs }: { docs: string }) => {
      const docsAsString = removeFirebaseSerializeMetaData(
        encodeSpecialValues(docs),
        ["__path__"]
      );
      exportFromJSON({
        data: JSON.parse(docsAsString),
        fileName: collectionPath.replaceAll("/", "_"),
        exportType: "json",
      });

      return true;
    })
    .catch(notifyErrorPromise);
};

export const actionExportCollectionCSV = async (collectionPath: string) => {
  return window
    .send("fs.exportCollection", {
      path: collectionPath,
    })
    .then(({ docs }: { docs: string }) => {
      const docsAsString = removeFirebaseSerializeMetaData(
        encodeSpecialValues(docs),
        ["__path__"]
      );
      exportFromJSON({
        data: JSON.parse(docsAsString),
        fileName: collectionPath.replaceAll("/", "_"),
        exportType: "csv",
      });

      return true;
    })
    .catch(notifyErrorPromise);
};

export const actionExportViewJSON = async (
  allFields = true
): Promise<boolean> => {
  const collectionPath = await store.get(navigatorCollectionPathAtom);
  const docs = await store.get(collectionWithQueryAtom(collectionPath));

  const docsAsString = removeFirebaseSerializeMetaData(
    encodeSpecialValues(
      serializeQuerySnapshot({
        docs,
      })
    ),
    ["__path__"]
  );

  exportFromJSON({
    data: docsAsString,
    fileName: collectionPath.replaceAll("/", "_"),
    exportType: "json",
  });

  return true;
};

export const actionExportViewCSV = async (
  allFields = true
): Promise<boolean> => {
  const collectionPath = await store.get(navigatorCollectionPathAtom);
  const docs = await store.get(collectionWithQueryAtom(collectionPath));

  const docsAsString = removeFirebaseSerializeMetaData(
    encodeSpecialValues(
      serializeQuerySnapshot({
        docs,
      })
    ),
    ["__path__"]
  );

  exportFromJSON({
    data: docsAsString,
    fileName: collectionPath.replaceAll("/", "_"),
    exportType: "csv",
  });

  return true;
};

export const actionExportDocJSON = async (
  docPath: string
): Promise<boolean> => {
  const doc = await store.get(docAtom(docPath));

  if (!doc) {
    // TODO: Get doc local memory not found
    // TODO: Throw error not found

    return false;
  }

  const docsAsString = removeFirebaseSerializeMetaData(
    encodeSpecialValues(serializeDocumentSnapshot(doc)),
    ["__path__"]
  );

  exportFromJSON({
    data: docsAsString,
    fileName: doc.id,
    exportType: "json",
  });

  return true;
};

export const actionExportDocCSV = async (docPath: string): Promise<boolean> => {
  const doc = await store.get(docAtom(docPath));

  if (!doc) {
    // TODO: Throw error not found

    return false;
  }

  const docsAsString = removeFirebaseSerializeMetaData(
    encodeSpecialValues(serializeDocumentSnapshot(doc)),
    ["__path__"]
  );

  exportFromJSON({
    data: [JSON.parse(docsAsString)],
    fileName: doc.id,
    exportType: "csv",
  });

  return true;
};

export const actionAddFilter = (
  field: string,
  type: WhereFilterOp,
  collectionPath: string
): void => {
  store.set(querierAtom(collectionPath), (filters) => [
    ...filters,
    {
      id: uniqueId(FILTER_PREFIX),
      field,
      operator: {
        type: type,
        values: ["in", "not-in", "array-contains-any"].includes(type)
          ? [""]
          : ("" as any),
      },
      isActive: true,
    },
  ]);
};

export const actionPathExpand = (path: string) => {
  window
    .send("fs.pathExpander", { path: prettifyPath(path) })
    .then((response: string[]) => {
      actionAddPathExpander(response);
    })
    .catch(notifyErrorPromise);
};

export const actionSaveQueryResult = (
  queryVersion: number,
  result: IQueryResult
): void => {
  store.set(queryResultAtom(queryVersion), result);
};
