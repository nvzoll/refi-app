import { _electron as electron, expect, Page, test } from "@playwright/test";
import { deleteApp, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { generateKeyPairSync } from "crypto";
import { mkdtempSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join, resolve } from "path";

const projectId = "demo-refi-e2e";
const isProjectView = (page: Page) =>
  page.url().startsWith("app://-/") && !page.url().endsWith("/tabs.html");

const serverDir = resolve(__dirname, "../server");

test("edits, sorts, filters, imports and deletes documents on the emulator", async () => {
  const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
  expect(emulatorHost).toBeTruthy();

  const tempDir = mkdtempSync(join(tmpdir(), "refi-e2e-"));
  const userDataDir = join(tempDir, "user-data");
  const keyPath = join(tempDir, "service-account.json");
  const { privateKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
    publicKeyEncoding: { type: "spki", format: "pem" },
  });
  writeFileSync(
    keyPath,
    JSON.stringify({
      type: "service_account",
      project_id: projectId,
      private_key_id: "e2e",
      private_key: privateKey,
      client_email: `e2e@${projectId}.iam.gserviceaccount.com`,
      client_id: "1",
    })
  );

  const app = initializeApp({ projectId });
  const firestore = getFirestore(app);
  await firestore.doc("smoke/doc1").set({ name: "before", count: 1 });
  await firestore.doc("smoke/doc2").set({ name: "zebra", count: 2 });

  const electronApp = await electron.launch({
    executablePath: require("electron") as string,
    args: [`--user-data-dir=${userDataDir}`, "."],
    cwd: serverDir,
    env: { ...(process.env as Record<string, string>), ELECTRON_IS_DEV: "0" },
    chromiumSandbox: true,
  });

  try {
    const actualUserData = await electronApp.evaluate(({ app }) =>
      app.getPath("userData")
    );
    if (resolve(actualUserData) !== resolve(userDataDir)) {
      await electronApp.close();
      throw new Error(
        `Refusing to continue: userData is ${actualUserData}, expected ${userDataDir}`
      );
    }

    const page =
      electronApp.windows().find(isProjectView) ??
      (await electronApp.waitForEvent("window", { predicate: isProjectView }));
    await page.locator("input[type=file]").setInputFiles(keyPath);
    const row = page.getByText(projectId, { exact: true }).locator("..");
    await row.getByRole("button", { name: "Connect" }).click();
    await page
      .getByRole("treeitem", { name: "smoke" })
      .getByText("smoke")
      .click();
    await page
      .getByRole("cell", { name: "before" })
      .getByRole("textbox")
      .fill("after");
    await page.getByRole("cell", { name: "after" }).getByRole("textbox").blur();
    await page.getByRole("button", { name: "Commit" }).click();

    await expect
      .poll(async () => (await firestore.doc("smoke/doc1").get()).data())
      .toEqual({ name: "after", count: 1 });

    await page
      .getByRole("cell", { name: "after" })
      .getByRole("textbox")
      .click();
    const jsonEditor = page.getByRole("textbox", { name: "Editor content" });
    await jsonEditor.focus();
    await page.keyboard.press("Control+Home");
    await page.keyboard.type('"__Timestamp__"');
    await expect(page.getByText(/^Line 1: /)).toBeVisible();
    await expect(
      page.locator(".monaco-editor .view-line span span", {
        hasText: /^__Timestamp__$/,
      })
    ).toHaveCSS("font-weight", "700");
    await page.keyboard.press("Control+z");
    await expect(page.getByText(/^Line 1: /)).not.toBeVisible();

    const nameHeader = page
      .getByRole("table")
      .locator("th")
      .getByText("name", { exact: true });
    const firstRow = page
      .getByRole("row")
      .filter({ has: page.getByRole("cell") })
      .first();
    await nameHeader.click();
    await expect(firstRow.getByRole("cell", { name: "after" })).toBeVisible();
    await nameHeader.click();
    await expect(firstRow.getByRole("cell", { name: "zebra" })).toBeVisible();

    await page.getByRole("button", { name: "Add Filters" }).click();
    const removeFilter = page.getByRole("button", { name: "Remove filter" });
    const filterRow = page.locator("div").filter({ has: removeFilter }).last();
    await filterRow.locator("input").first().fill("name");
    await filterRow.locator("input").last().fill("zebra");
    await page.getByRole("button", { name: "Query", exact: true }).click();

    await expect(page.getByRole("cell", { name: "zebra" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "after" })).not.toBeVisible();

    await removeFilter.click();
    await page.getByRole("button", { name: "Query", exact: true }).click();
    await expect(page.getByRole("cell", { name: "after" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "zebra" })).toBeVisible();

    const importFilePath = join(tempDir, "import.json");
    writeFileSync(
      importFilePath,
      JSON.stringify([
        { __id__: "imp1", name: "imported1", count: 100 },
        { __id__: "imp2", name: "imported2", count: 200 },
      ])
    );

    await page.keyboard.press("Control+i");
    const fileInput = page.getByRole("dialog").locator("input[type=file]");
    await fileInput.setInputFiles(importFilePath);
    await page.getByRole("button", { name: /Import 2 doc/ }).click();

    await expect
      .poll(async () => (await firestore.doc("smoke/imp1").get()).data())
      .toEqual({ name: "imported1", count: 100 });
    await expect
      .poll(async () => (await firestore.doc("smoke/imp2").get()).data())
      .toEqual({ name: "imported2", count: 200 });

    await page.evaluate(async () => {
      await (window as any).send("fs.deleteDocs", {
        docs: ["/smoke/imp1", "/smoke/imp2"],
      });
    });

    await expect
      .poll(async () => (await firestore.doc("smoke/imp1").get()).exists)
      .toBe(false);
    await expect
      .poll(async () => (await firestore.doc("smoke/imp2").get()).exists)
      .toBe(false);
  } finally {
    await electronApp.close();
    await deleteApp(app);
    rmSync(tempDir, { recursive: true, force: true });
  }
});
