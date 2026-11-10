import fs from "fs";
import path from "path";
import log from "electron-log";
import { LocalDB } from "../workers/service";

export interface LocalStore {
  data: LocalDB.IDatabase;
  write: () => void;
}

const db = (userDataPath: string): LocalStore => {
  const dbFolderPath = path.join(userDataPath, "DB");
  const dbPath = path.join(dbFolderPath, "db.json");

  fs.mkdirSync(dbFolderPath, { recursive: true });
  log.info("Created db file");

  const text = fs.existsSync(dbPath)
    ? fs.readFileSync(dbPath, "utf-8").trim()
    : "";
  const data: LocalDB.IDatabase = {
    keys: [],
    ...(text ? JSON.parse(text) : {}),
  };

  return {
    data,
    write: () => {
      const tempPath = `${dbPath}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(data, null, 2));
      fs.renameSync(tempPath, dbPath);
    },
  };
};

export default db;
