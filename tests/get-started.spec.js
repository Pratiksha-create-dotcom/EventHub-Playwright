const { test, expect } = require("@playwright/test");

const BASE_URL = "https://eventhub.rahulshettyacademy.com";

async function openLoginPage(page) {

  await page.goto(BASE_URL + "/login");

  await expect(page.getByRole("heading", { name: "Sign in to EventHub" })).toBeVisible();
}
//playwright is the core browser automation library. It provides APIs to launch browsers and automate web interactions, but it does not include a test runner or assertion library.
//@playwright/test is the official Playwright testing framework. It includes browser automation along with a built-in test runner, assertions, fixtures, hooks, reporting, retries, parallel execution, and other testing features.


test("EventHub login page loads", async ({ page }) => {
  //Call your openLoginPage(page) helper
  await openLoginPage(page);
  //Assert the Email field located by placeholder you@email.com is visible
   await expect(page.getByPlaceholder("you@email.com")).toBeVisible();
   //Assert the Sign In button located by role button with name Sign In is visible
     await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
     // Playwright actions return Promises.Using await ensures each action completes before the next one starts,
    // preventing timing issues and flaky tests.
});
test(" login-page test",async({page})=>{
//Navigate to /login again using the same helper
  await openLoginPage(page);
//Assert the password field located by label Password is visible
     await expect(page.getByLabel("Password")).toBeVisible();
     //Assert the page URL contains /login
     //Assert the heading Sign in to EventHub is visible
     await expect(page).toHaveURL(/login/);
     await expect(page.getByRole("heading", { name: "Sign in to EventHub" })).toBeVisible();


})