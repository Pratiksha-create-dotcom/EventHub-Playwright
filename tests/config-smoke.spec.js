const{test, expect} =require ("@playwright/test")
/**Required helpers you must implement:
openLoginPage(page) helper that uses the configured baseURL to open /login 
and asserts the Sign in to EventHub heading is visible
getEmailField(page) helper that returns the email textbox using its placeholder you@email.com**/
 async function openLoginPage(page) 
 {
      await page.goto("/login");

      await expect(page.getByRole("heading", { name: "Sign in to EventHub" })).toBeVisible();
 }
  function getEmailField(page) 
 {  
      return  page.getByPlaceholder("you@email.com")
   
}
test("config-based smoke test",async({page})=>{

/**Create tests/config-smoke.spec.js
Write a test using async ({ page }) => { }
Use page.goto('/login') so the navigation relies on baseURL from playwright.config.js
Assert the page title matches EventHub:
await expect(page).toHaveTitle(/EventHub/i);**/

await page.goto("/login");
await expect(page).toHaveTitle(/EventHub/i);
//Assert the email field is visible
await expect(
    page.getByPlaceholder("you@email.com")
).toBeVisible();
//Assert the Sign In button is visible

await expect(page.getByRole("heading", { name: "Sign in to EventHub" })).toBeVisible();
await page.pause();


})
//Create a new test that receives { page, browser }
   test("Use the built-in page fixture",async({page,browser})=>{
//Call your openLoginPage(page) helper
await openLoginPage(page) ;
//Fill the email textbox with beginner@sample.com
  await getEmailField(page).fill("beginner@sample.com")
  //Assert the email field on the fixture page contains the same value you typed into it
  await expect(getEmailField(page)).toHaveValue("beginner@sample.com")

//Create an isolated browser context:
  const isolatedContext = await browser.newContext();
  //Create a page in that context:
  const isolatedPage = await isolatedContext.newPage();
  //Navigate isolatedPage to ${BASE_URL}/login using the full URL
const BASE_URL = "https://eventhub.rahulshettyacademy.com";
await isolatedPage.goto(`${BASE_URL}/login`);

//Assert the Sign in to EventHub heading is visible on isolatedPage
  await expect(isolatedPage.getByRole("heading", { name: "Sign in to EventHub" })).toBeVisible();
//Assert the email field on isolatedPage is empty
await expect(
    isolatedPage.getByPlaceholder("you@email.com")
).toHaveValue("");
//Close isolatedContext at the end of the test
await isolatedContext.close();
//await page.pause();
})


/**
page fixture gives you one ready-to-use page for the test
browser context is a separate browser session container that can create its own pages
a fresh browser context starts with isolated state**/