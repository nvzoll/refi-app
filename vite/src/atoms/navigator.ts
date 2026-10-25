import {
  convertFirebaseType,
  getAllColumns,
  getAllColumnsRecursive,
  getCollectionPath,
} from "@/utils/common";
import produce from "immer";
import { atom, SetStateAction } from "jotai";
import { atomWithDefault } from "jotai/utils";
import { atomFamily } from "jotai-family";
import { isEqual } from "lodash";
import { collectionAtom } from "./firestore";
import {
  atomWithBucketStorage,
  familyKey,
  PROJECT_SETTINGS_BUCKET,
} from "./persistence";
import { resolveUpdate } from "./store";

export const FIELD_TYPES: RefiFS.IFieldType[] = [
  "string",
  "number",
  "boolean",
  "map",
  "array",
  "null",
  "timestamp",
  "geopoint",
  "reference",
];

// TODO: Check if the path exist
export const navigatorPathAtom = atom<string>("/");

export const navigatorCollectionPathAtom = atom<string>((get) => {
  const path = get(navigatorPathAtom);
  return getCollectionPath(path);
});

export type WhereFilterOp =
  | "<"
  | "<="
  | "=="
  | "!="
  | ">="
  | ">"
  | "array-contains"
  | "in"
  | "not-in"
  | "array-contains-any";

type IOperatorValue = string | number | boolean | firebase.firestore.Timestamp;
export interface INormalOperator {
  type: "<" | "<=" | "==" | "!=" | ">=" | ">" | "array-contains";
  values: IOperatorValue;
}

export interface IArrayOperator {
  type: "in" | "not-in" | "array-contains-any";
  values: IOperatorValue[];
}

interface IQueryEntity {
  id: string;
  field: string;
  operator: INormalOperator | IArrayOperator;
  isActive: boolean;
}

export const querierAtom = atomFamily((path: string) =>
  atomWithBucketStorage<IQueryEntity[]>(
    PROJECT_SETTINGS_BUCKET,
    familyKey("fs.querier", path),
    [],
    {
      serialize(input) {
        return JSON.stringify(input);
      },
      deserialize(input) {
        const data = JSON.parse(input);
        if (Array.isArray(data)) {
          const dataWithType = data as IQueryEntity[];
          return dataWithType.map((querier) => {
            // This is not immutable :)
            querier.operator.values = convertFirebaseType(
              querier.operator.values
            );

            return querier;
          });
        }

        return data;
      },
    }
  )
);

export const querierOptionAtom = atomFamily(
  ({ id, path }: { id: string; path: string }) => {
    const anAtom = atom(
      (get) => get(querierAtom(path)).find((query) => query.id === id),
      (get, set, update: SetStateAction<IQueryEntity | undefined>) => {
        const newValue = resolveUpdate(update, get(anAtom));
        const optionIndex = get(querierAtom(path)).findIndex(
          (query) => query.id === id
        );
        if (optionIndex >= 0) {
          set(
            querierAtom(path),
            produce((querier) => {
              querier[optionIndex] = newValue;
            })
          );
        }
      }
    );
    return anAtom;
  },
  isEqual
);

export interface ISorterEntity {
  id: string;
  field: string;
  sort: "asc" | "desc";
}

export const sorterAtom = atomFamily((path: string) =>
  atom<ISorterEntity[]>([])
);

export const sorterItemAtom = atomFamily(
  ({ id, path }: { id: string; path: string }) => {
    const anAtom = atom(
      (get) => get(sorterAtom(path)).find((query) => query.id === id),
      (get, set, update: SetStateAction<ISorterEntity | undefined>) => {
        const newValue = resolveUpdate(update, get(anAtom));
        const optionIndex = get(sorterAtom(path)).findIndex(
          (query) => query.id === id
        );
        if (optionIndex >= 0) {
          set(
            sorterAtom(path),
            produce((sorter) => {
              sorter[optionIndex] = newValue as ISorterEntity;
            })
          );
        }
      }
    );
    return anAtom;
  },
  isEqual
);

export interface IQueryVersion {
  queryVersion: number;
  withQuerier: boolean;
  startAfter?: string;
  endBefore?: string;
  startAt?: string;
  endAt?: string;
  collectionPath: string;
}

export const queryHistory: IQueryVersion[] = [];

export const queryVersionAtom = atom(
  {
    collectionPath: "/",
    queryVersion: 0,
    withQuerier: true,
  } as IQueryVersion,
  (get, set, update: SetStateAction<IQueryVersion>) => {
    const queryVersion = resolveUpdate(update, get(queryVersionAtom));
    set(queryVersionAtom, queryVersion);
    queryHistory.push(queryVersion);
  }
);

export interface IQueryResult {
  start?: string;
  end?: string;
  collectionPath: string;
}

export const queryResultAtom = atomFamily((queryVersion: number) =>
  atomWithDefault<IQueryResult>((get) => ({
    collectionPath: get(navigatorCollectionPathAtom),
  }))
);

export const allColumnsAtom = atom<string[]>((get) => {
  const collectionPath = get(navigatorCollectionPathAtom);
  const collections = get(collectionAtom(collectionPath));

  return getAllColumns(collections);
});

export const allColumnsRecursiveAtom = atom<string[]>((get) => {
  const collectionPath = get(navigatorCollectionPathAtom);
  const collections = get(collectionAtom(collectionPath));

  return getAllColumnsRecursive(collections);
});

export const propertyListCoreAtom = atomFamily((path: string) =>
  atomWithBucketStorage<string[] | null>(
    PROJECT_SETTINGS_BUCKET,
    familyKey("fs/propertyList", path),
    null
  )
);

export const propertyListAtom = atomFamily((path: string) => {
  const anAtom = atom(
    (get): string[] => get(propertyListCoreAtom(path)) || [],
    (get, set, update: SetStateAction<string[]>) => {
      set(propertyListCoreAtom(path), resolveUpdate(update, get(anAtom)));
    }
  );
  return anAtom;
});
