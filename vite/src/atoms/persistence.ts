import { atomWithStorage } from "jotai/utils";

export const USER_SETTINGS_BUCKET = "user-settings";
// Existing data lives here: Recoil read window.projectId before anything set it.
export const PROJECT_SETTINGS_BUCKET = "undefined";

interface IEntryCodec<T> {
  serialize: (value: T) => unknown;
  deserialize: (stored: any) => T;
}

const readBucket = (bucket: string): Record<string, unknown> => {
  const stored = localStorage.getItem(bucket);
  if (stored === null) {
    return {};
  }

  try {
    const entries = JSON.parse(stored);
    return entries !== null && typeof entries === "object" ? entries : {};
  } catch (error) {
    console.error(error);
    return {};
  }
};

const writeBucket = (bucket: string, entries: Record<string, unknown>) => {
  try {
    localStorage.setItem(bucket, JSON.stringify(entries));
  } catch (error) {
    console.error(error);
  }
};

const bucketStorage = <T>(bucket: string, codec?: IEntryCodec<T>) => ({
  getItem: (key: string, initialValue: T): T => {
    const entries = readBucket(bucket);
    if (!Object.hasOwn(entries, key)) {
      return initialValue;
    }

    return codec ? codec.deserialize(entries[key]) : (entries[key] as T);
  },
  setItem: (key: string, value: T) => {
    const entries = readBucket(bucket);
    entries[key] = codec ? codec.serialize(value) : value;
    writeBucket(bucket, entries);
  },
  removeItem: (key: string) => {
    const entries = readBucket(bucket);
    delete entries[key];
    writeBucket(bucket, entries);
  },
});

// Recoil's atomFamily key format, which the stored entries use.
export const familyKey = (key: string, param: string): string =>
  `${key}__${JSON.stringify(param)}`;

export const atomWithBucketStorage = <T>(
  bucket: string,
  key: string,
  initialValue: T,
  codec?: IEntryCodec<T>
) =>
  atomWithStorage(key, initialValue, bucketStorage(bucket, codec), {
    getOnInit: true,
  });
