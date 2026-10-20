import { existsSync, rmSync } from "node:fs";
import nextEnv from "@next/env";

nextEnv.loadEnvConfig(process.cwd());

async function main() {
  const { resolveDatabasePath, openDatabase, closeDatabase } = await import(
    "../src/server/db/connection"
  );
  const path = resolveDatabasePath();
  if (path !== ":memory:") {
    [path, `${path}-wal`, `${path}-shm`].forEach((file) => {
      if (existsSync(file)) rmSync(file);
    });
    console.info(`پایگاه داده حذف شد: ${path}`);
    const db = openDatabase(path);
    db.close();
    console.info("پایگاه دادهٔ خالی با ساختار جدید ساخته شد.");
  }
  closeDatabase();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
