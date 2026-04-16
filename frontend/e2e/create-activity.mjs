// Browser-agent scenario: signup + create an activity, end-to-end.
// Run with: PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node e2e/create-activity.mjs
import { chromium } from "playwright";

const BASE_URL = process.env.BASE_URL ?? "http://127.0.0.1:5173";

function stamp() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

async function main() {
  const tag = stamp();
  const user = {
    email: `agent-${tag}@example.com`,
    username: `agent_${tag}`,
    password: "SuperSecret123!",
    first_name: "Agent",
    last_name: "Browser",
  };
  const activity = {
    title: `Mission Atlas ${tag}`,
    organization: "Acme Corp",
    start_date: "2024-01-15",
    end_date: "2024-06-30",
    description: "Lead developer on Atlas. Created by browser-agent.",
  };

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  page.on("pageerror", (err) => console.error("[pageerror]", err.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") console.error("[console.error]", msg.text());
  });

  try {
    // 1. Signup
    console.log("→ Navigating to /register");
    await page.goto(`${BASE_URL}/register`);
    await page.fill("#first_name", user.first_name);
    await page.fill("#last_name", user.last_name);
    await page.fill("#username", user.username);
    await page.fill("#email", user.email);
    await page.fill("#password", user.password);
    await page.click('button[type="submit"]');

    // After register → redirected to /activities
    await page.waitForURL("**/activities", { timeout: 10_000 });
    console.log("✓ Registered & landed on /activities");

    // 2. Empty state — click "Créer une activité"
    await page.getByRole("button", { name: /Créer une activité|Nouvelle activité/ }).first().click();
    await page.waitForSelector("#title", { timeout: 5000 });
    console.log("✓ Activity form visible");

    // 3. Fill the form
    await page.fill("#title", activity.title);
    await page.fill("#organization", activity.organization);
    await page.fill("#start_date", activity.start_date);
    await page.fill("#end_date", activity.end_date);
    await page.fill("#description", activity.description);

    // Add a skill so the card has the full shape
    await page.getByRole("button", { name: /Ajouter/ }).click();
    await page.fill('input[placeholder="Nom de la compétence"]', "TypeScript");

    // 4. Submit
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes("/api/activities/") && r.request().method() === "POST",
        { timeout: 10_000 },
      ),
      page.getByRole("button", { name: /^Enregistrer$/ }).click(),
    ]);
    console.log("✓ POST /api/activities/ observed");

    // 5. Verify the card shows up
    const card = page.getByRole("heading", { name: activity.title });
    await card.waitFor({ timeout: 5000 });
    console.log(`✓ Activity card "${activity.title}" is visible`);

    // Extra sanity: skill badge
    await page.getByText("TypeScript", { exact: true }).first().waitFor({ timeout: 3000 });
    console.log("✓ Skill badge rendered");

    await page.screenshot({ path: "e2e/after-create.png", fullPage: true });
    console.log("✓ Screenshot saved to e2e/after-create.png");

    console.log("\nSUCCESS — activity created end-to-end");
  } catch (err) {
    console.error("\nFAILURE:", err.message);
    await page.screenshot({ path: "e2e/failure.png", fullPage: true }).catch(() => {});
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

main();
