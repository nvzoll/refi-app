import { atom, SetStateAction } from "jotai";
import { atomFamily } from "jotai-family";
import { atom as recoilAtom } from "recoil";
import { changedDocAtom, deletedDocsAtom, newDocsAtom } from "./firestore";
import { atomWithBucketStorage, USER_SETTINGS_BUCKET } from "./persistence";
import { resolveUpdate } from "./store";

export const isShowPreviewChangeModalAtom = atom<boolean>(false);

export const isShowDocFinderModalCommandAtom = atom<boolean>(false);

export const isModalCommandAtom = atom<boolean>(false);

export const isModalNewsAtom = atom(
  Number(localStorage.getItem("version")) <
    Number(import.meta.env.VITE_APP_VERSION),
  (get, set, update: SetStateAction<boolean>) => {
    const isShown = resolveUpdate(update, get(isModalNewsAtom));
    set(isModalNewsAtom, isShown);
    if (!isShown) {
      localStorage.setItem(
        "version",
        import.meta.env.VITE_APP_VERSION as string
      );
    }
  }
);

export const isModalFeedbackAtom = atom<boolean>(false);

export const isModalPickProperty = atom<boolean>(false);

export const isModalSorter = atom<boolean>(false);

export const isImportModalAtom = atom<boolean>(false);

export const importFileAtom = atom<File | undefined>(undefined);

export const defaultEditorAtom = atomWithBucketStorage<"basic" | "advantage">(
  USER_SETTINGS_BUCKET,
  "ui/defaultEditor",
  "advantage"
);

interface IParsingLargeDataAtom {
  totalDocs: number;
}

export const isParsingLargeDataAtom = atom<IParsingLargeDataAtom>({
  totalDocs: 0,
});

export const largeDataAtom = atom((get) => {
  const { totalDocs } = get(isParsingLargeDataAtom);
  return new Promise((resolve) => {
    setTimeout(() => {
      requestAnimationFrame(() => {
        resolve(true);
      });
    }, 100);
  });
});

export const isCommittableAtom = atom<boolean>((get) => {
  const changedDocs = get(changedDocAtom);
  const newDocs = get(newDocsAtom);
  const deletedDocs = get(deletedDocsAtom);

  return changedDocs.length > 0 || newDocs.length > 0 || deletedDocs.length > 0;
});

export const newFieldAtom = atomFamily((path: string) => atom(""));

export const viewModePathInputAtom = atom(true);

export const monacoDataErrorAtom = atomFamily((path: string) => atom(""));

export const importCollectionPathAtom = atom<string>("");

export interface INotificationMessages {
  id: string;
  type: "error" | "warning" | "success";
  message: string;
  showTime: number;
}

export const notifierAtom = atom<INotificationMessages[]>([]);

export const dummyAtom = recoilAtom({
  key: "ui/dummy",
  default: null,
});

export const emulatorProjectId = atomWithBucketStorage(
  USER_SETTINGS_BUCKET,
  "ui/emulator-project",
  "example-project"
);

export const emulatorConnection = atomWithBucketStorage(
  USER_SETTINGS_BUCKET,
  "ui/emulator-connection",
  "localhost:8080"
);
