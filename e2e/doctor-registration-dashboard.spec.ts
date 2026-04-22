import { test, expect } from "@playwright/test";

test.describe("Doctor registration with Firebase emulators", () => {
  test("creates an account and lands on the clinician dashboard with profile name", async ({
    page,
  }) => {
    const id = Date.now();
    const email = `e2e.clinician.${id}@example.com`;
    const password = "TestPass1a";
    const firstName = "E2E";
    const lastName = `User${id}`;

    await page.goto("/doctor-onboarding");

    await page.locator("#firstName").fill(firstName);
    await page.locator("#lastName").fill(lastName);
    await page.locator("#email").fill(email);
    await page.locator("#phone").fill("+260-211-123456");
    await page.locator("#password").fill(password);
    await page
      .getByRole("button", { name: /continue to hospital selection/i })
      .click({ force: true });

    await page.locator('input[name="hospital"]').first().check();
    await page.getByRole("button", { name: /continue to specialization/i }).click();

    await page.locator("#specialization").selectOption("Cardiology");
    await page.locator("#licenseNumber").fill("ZM-MED-E2E-001");
    await page.locator("#licenseIssuingBody").selectOption({
      label: "Medical Council of Zambia",
    });
    await page.locator("#yearsOfExperience").fill("5");
    await page.locator("#qualifications").fill("MBChB, E2E test credentials");
    await page.getByRole("button", { name: /continue to services/i }).click();

    await page.getByText("Real-Time Vital Monitoring").click();
    await page.getByRole("button", { name: /continue to professional info/i }).click();

    await page.locator("#biography").fill("Automated test biography for Playwright.");
    await page.getByRole("checkbox", { name: /english/i }).check();
    await page.getByRole("button", { name: /review & confirm/i }).click();

    const confirmForm = page.locator("form").filter({ hasText: "Submit Registration" });
    await confirmForm.locator('input[type="checkbox"]').nth(0).check();
    await confirmForm.locator('input[type="checkbox"]').nth(1).check();
    await confirmForm.locator('input[type="checkbox"]').nth(2).check();
    await page.getByRole("button", { name: /submit registration/i }).click();

    await page.waitForURL("**/dashboard", { timeout: 60_000 });

    await expect(page.getByTestId("clinician-dashboard")).toBeVisible();
    await expect(page.getByText(`${firstName} ${lastName}`)).toBeVisible();
  });
});
