import fs from "fs";
import * as path from "path";

const MIGRATED_ENTRIES = ["Keys", "Local Storage", "logs", "DB"];

const isInside = (parentDir: string, candidate: string): boolean => {
  const rel = path.relative(parentDir, candidate);
  return (
    rel !== ".." && !rel.startsWith(".." + path.sep) && !path.isAbsolute(rel)
  );
};

const rewriteKeyPaths = (
  dbFile: string,
  oldDir: string,
  newDir: string
): void => {
  const data = JSON.parse(fs.readFileSync(dbFile, "utf8"));
  if (Array.isArray(data.keys)) {
    for (const key of data.keys) {
      if (typeof key?.keyPath === "string" && isInside(oldDir, key.keyPath)) {
        key.keyPath = path.join(newDir, path.relative(oldDir, key.keyPath));
      }
    }
  }
  const tmpFile = `${dbFile}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(data));
  fs.renameSync(tmpFile, dbFile);
};

export function migrateUserData(oldDir: string, newDir: string): void {
  if (!fs.existsSync(oldDir) || fs.existsSync(path.join(newDir, "DB"))) {
    return;
  }

  const stagingDir = `${newDir}.migrating`;
  fs.rmSync(stagingDir, { recursive: true, force: true });

  try {
    const staged = MIGRATED_ENTRIES.filter((entry) => {
      const source = path.join(oldDir, entry);
      if (!fs.existsSync(source)) {
        return false;
      }
      fs.cpSync(source, path.join(stagingDir, entry), {
        recursive: true,
        filter: (src) => path.basename(src) !== "LOCK",
      });
      return true;
    });

    const stagedDbFile = path.join(stagingDir, "DB", "db.json");
    if (fs.existsSync(stagedDbFile)) {
      rewriteKeyPaths(stagedDbFile, oldDir, newDir);
    }

    fs.mkdirSync(newDir, { recursive: true });
    for (const entry of staged) {
      const destination = path.join(newDir, entry);
      fs.rmSync(destination, { recursive: true, force: true });
      fs.renameSync(path.join(stagingDir, entry), destination);
    }
  } finally {
    fs.rmSync(stagingDir, { recursive: true, force: true });
  }
}
