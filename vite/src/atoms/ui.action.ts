import { uniqueId } from "lodash";
import { atomWithBucketStorage, USER_SETTINGS_BUCKET } from "./persistence";
import { store } from "./store";
import {
  importCollectionPathAtom,
  isImportModalAtom,
  isModalPickProperty,
  isParsingLargeDataAtom,
  notifierAtom,
} from "./ui";

export const actionToggleModalPickProperty = (status?: boolean): void => {
  store.set(isModalPickProperty, (curStatus) =>
    status === undefined ? !curStatus : status
  );
};

export const actionToggleImportModal = (
  path: string,
  status?: boolean
): void => {
  store.set(importCollectionPathAtom, path);
  store.set(isImportModalAtom, (curStatus) =>
    status === undefined ? !curStatus : status
  );
};

export const actionTriggerLoadData = (totalDocs: number): void => {
  store.set(isParsingLargeDataAtom, { totalDocs }); // AUTO Trigger loading suspense
};

export const actionSendNotification = (
  type: "error" | "warning" | "success",
  message: string,
  showTime = 6000
): void => {
  const notification = {
    id: uniqueId("notification_"),
    type,
    message,
    showTime,
  };
  store.set(notifierAtom, (notifications) => [...notifications, notification]);
  setTimeout(() => {
    store.set(notifierAtom, (notifications) =>
      notifications.filter(({ id }) => id !== notification.id)
    );
  }, showTime);
};

window.notification = actionSendNotification;
export const notifyErrorPromise = (error: Error) => {
  actionSendNotification("error", error.message);
};

export const appThemeAtom = atomWithBucketStorage(
  USER_SETTINGS_BUCKET,
  "ui/appTheme",
  true
);
