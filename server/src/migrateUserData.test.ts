import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import fs from "fs";
import os from "os";
import * as path from "path";
import { migrateUserData } from "./migrateUserData";

let root: string;
let oldDir: string;
let newDir: string;

const write = (file: string, content: string) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
};

const readDb = () =>
  JSON.parse(fs.readFileSync(path.join(newDir, "DB", "db.json"), "utf8"));

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), "migrate-user-data-"));
  oldDir = path.join(root, "RefiApp");
  newDir = path.join(root, "refi2");
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

describe("migrateUserData", () => {
  test("copies the app-owned entries into an existing empty folder and leaves the old one intact", () => {
    write(path.join(oldDir, "Keys", "a.json"), "key");
    write(path.join(oldDir, "DB", "db.json"), JSON.stringify({ keys: [] }));
    write(path.join(oldDir, "Local Storage", "leveldb", "000003.log"), "ls");
    write(path.join(oldDir, "logs", "main.log"), "log");
    write(path.join(oldDir, "Cookies"), "cookies");
    write(path.join(oldDir, "Preferences"), "prefs");
    fs.mkdirSync(newDir);

    migrateUserData(oldDir, newDir);

    expect(fs.readFileSync(path.join(newDir, "Keys", "a.json"), "utf8")).toBe(
      "key"
    );
    expect(readDb()).toEqual({ keys: [] });
    expect(
      fs.existsSync(path.join(newDir, "Local Storage", "leveldb", "000003.log"))
    ).toBe(true);
    expect(fs.existsSync(path.join(newDir, "logs", "main.log"))).toBe(true);
    expect(fs.existsSync(path.join(newDir, "Cookies"))).toBe(false);
    expect(fs.existsSync(path.join(newDir, "Preferences"))).toBe(false);
    expect(fs.existsSync(path.join(oldDir, "Keys", "a.json"))).toBe(true);
    expect(fs.existsSync(`${newDir}.migrating`)).toBe(false);
  });

  test("rewrites key paths inside the old folder and leaves external ones unchanged", () => {
    const externalKeyPath = path.join(root, "elsewhere", "b.json");
    write(
      path.join(oldDir, "DB", "db.json"),
      JSON.stringify({
        keys: [
          { id: "1", keyPath: path.join(oldDir, "Keys", "a.json") },
          { id: "2", keyPath: externalKeyPath },
        ],
      })
    );
    write(path.join(oldDir, "Keys", "a.json"), "key");

    migrateUserData(oldDir, newDir);

    expect(readDb().keys).toEqual([
      { id: "1", keyPath: path.join(newDir, "Keys", "a.json") },
      { id: "2", keyPath: externalKeyPath },
    ]);
  });

  test("skips LOCK files", () => {
    write(path.join(oldDir, "Local Storage", "leveldb", "LOCK"), "");
    write(path.join(oldDir, "Local Storage", "leveldb", "CURRENT"), "x");
    write(path.join(oldDir, "DB", "db.json"), JSON.stringify({ keys: [] }));

    migrateUserData(oldDir, newDir);

    expect(
      fs.existsSync(path.join(newDir, "Local Storage", "leveldb", "CURRENT"))
    ).toBe(true);
    expect(
      fs.existsSync(path.join(newDir, "Local Storage", "leveldb", "LOCK"))
    ).toBe(false);
  });

  test("retries over a partial earlier run", () => {
    write(path.join(oldDir, "Keys", "a.json"), "fresh");
    write(path.join(oldDir, "DB", "db.json"), JSON.stringify({ keys: [] }));
    write(path.join(newDir, "Keys", "stale.json"), "stale");
    write(path.join(newDir, "Local Storage", "stale"), "stale");
    write(`${newDir}.migrating`, "leftover");

    migrateUserData(oldDir, newDir);

    expect(fs.readdirSync(path.join(newDir, "Keys"))).toEqual(["a.json"]);
    expect(readDb()).toEqual({ keys: [] });
  });

  test("does nothing when the old folder is missing", () => {
    migrateUserData(oldDir, newDir);

    expect(fs.existsSync(newDir)).toBe(false);
  });

  test("does nothing when the new folder already has a DB", () => {
    write(path.join(oldDir, "Keys", "a.json"), "key");
    write(
      path.join(oldDir, "DB", "db.json"),
      JSON.stringify({ keys: ["old"] })
    );
    write(
      path.join(newDir, "DB", "db.json"),
      JSON.stringify({ keys: ["new"] })
    );

    migrateUserData(oldDir, newDir);

    expect(readDb()).toEqual({ keys: ["new"] });
    expect(fs.existsSync(path.join(newDir, "Keys"))).toBe(false);
  });
});
