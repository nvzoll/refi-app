import { mapValues, omit, pickBy } from "es-toolkit/compat";

export async function convertDocumentRef(docRef: any) {
  const docCollections = await docRef.listCollections();

  return {
    ...docRef,
    _collections: docCollections,
  };
}

export function getDocMetaData(snapshot: any) {
  const objData = snapshot.data();

  const docTypes = Object.keys(objData).reduce(
    (prev, key) => ({
      ...prev,
      [key]: objData?.[key]?.constructor?.name || "Object",
    }),
    {}
  );

  return {
    ref: {
      id: snapshot.ref.id,
      path: snapshot.ref.path,
    },
    time: {
      createTime: snapshot.createTime,
      updateTime: snapshot.updateTime,
      readTime: snapshot.readTime,
    },
    type: docTypes,
  };
}

export function convertSnapshotToDoc(snapshot: any) {
  const objData = snapshot.data();

  const docTypes: Record<string, any> = Object.keys(objData).reduce(
    (prev, key) => ({
      ...prev,
      [key]: objData?.[key]?.constructor?.name || "Object",
    }),
    {}
  );

  const refFields = pickBy(
    objData,
    (value: any, key: string) => docTypes[key] === "DocumentReference"
  );
  const resFieldsValue = mapValues(refFields, (value: any) => value.path);

  return {
    ...objData,
    ...resFieldsValue,
    __METADATA: {
      ref: {
        id: snapshot.ref.id,
        path: snapshot.ref.path,
      },
      time: {
        createTime: snapshot.createTime,
        updateTime: snapshot.updateTime,
        readTime: snapshot.readTime,
      },
      type: docTypes,
    },
  };
}

export const postConverter = {
  toFirestore(doc: any) {
    return omit(doc, ["__METADATA"]);
  },
  fromFirestore(snapshot: any) {
    return convertSnapshotToDoc(snapshot);
  },
};

module.exports = {
  convertDocumentRef,
  convertSnapshotToDoc,
  postConverter,
  getDocMetaData,
};
