import nextEnv from "@next/env";

nextEnv.loadEnvConfig(process.cwd());

async function main() {
  const { ensureDemoUser, isDemoEnabled } = await import("../src/server/demo");
  if (!isDemoEnabled()) {
    console.error("DEMO_MODE برای ساخت دادهٔ نمایشی باید true باشد.");
    process.exitCode = 1;
    return;
  }
  const user = ensureDemoUser();
  console.info(`حساب نمایشی آماده است: ${user.phone}`);
  const { closeDatabase } = await import("../src/server/db/connection");
  closeDatabase();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
