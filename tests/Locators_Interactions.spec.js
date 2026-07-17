const { test, expect } = require("@playwright/test")

//login(page) helper that signs in and asserts the Browse Events link is visible
async function login(page) {
    await page.goto("/login");
    await page.getByPlaceholder("you@email.com").fill("pratikshakadam7759@gmail.com");
    await page.getByLabel("Password").fill("Automation@2271");
    await page.getByRole("button", { name: "Sign In" }).click();
    await expect(page.getByRole("link", { name: "Browse Events →" })).toBeVisible();

}
//getEventCards(page) helper that returns all event cards from the Events page
function getEventCards(page) {
    return page.getByTestId("event-card")

}

//parseSeatCount(text) helper that extracts the numeric available-seat value from text like 498 seats available
function parseSeatCount(text) {

    return parseInt(text);



}


test("Test 1", async ({ page }) => {
    //Call your login(page) helper
    await login(page);
    //Click the Browse Events link:
    await page.getByRole("link", { name: /browse events/i }).first().click();
    //Assert the heading Upcoming Events is visible
    await expect(page.getByRole("heading", { name: "Upcoming Events" })).toBeVisible();
    //Locate the search box by placeholder Search events, venues… and fill World
    await page.getByPlaceholder("Search events, venues…").fill("World");
    //Locate the category dropdown and select Conference
    await page.locator("select").first().selectOption("Conference");
    //Locate the city dropdown and select Hyderabad
    await page.locator("select").last().selectOption("Hyderabad");
    //Assert the filter area updated without using any hard wait or timeout-based sleep
    await expect(page.getByTestId("event-card")).toHaveCount(1);
    await expect(page).toHaveURL(/category=Conference/);
    await expect(page).toHaveURL(/city=Hyderabad/);
    //Use your getEventCards(page) helper to capture all visible event cards
    const eventCards = getEventCards(page);
    //Assert the first card is visible using .first()
    await expect(eventCards.first()).toBeVisible();
    //Assert the total matched cards count is at least 1
    const count = await eventCards.count();
    expect(count).toBeGreaterThanOrEqual(1);
    //From the list of cards, create a filtered locator using hasText: 'World Tech Summit'
    const worldTechCard = eventCards.filter({ hasText: "World Tech Summit" });
    //Assert the filtered locator count is exactly 1
    await expect(worldTechCard).toHaveCount(1);
    //Assert the matching card is visible
    await expect(worldTechCard).toBeVisible();
    //From the matching card, read and store:
    // eventTitle from the heading text
    const eventTitle = await worldTechCard.locator(".leading-snug").textContent();
    console.log("Event Title :", eventTitle);
    // eventPriceText from the visible price text
    const eventPriceText = await worldTechCard.locator(".text-indigo-700.font-bold").textContent()
    console.log("Event Price :", eventPriceText);
    // eventSeatsText from the visible seat text
    const eventSeatsText = await worldTechCard.locator("span.text-amber-600").textContent()
    console.log("Event Seat :", eventSeatsText);
    //Assert eventTitle equals World Tech Summit
    expect(eventTitle).toBe("World Tech Summit");
    //Assert eventPriceText contains $
    expect(eventPriceText).toContain("$")
    //Parse eventSeatsText using your parseSeatCount helper and assert the extracted value is greater than 0
    const seatCount = parseSeatCount(eventSeatsText);
    expect(seatCount).toBeGreaterThan(0);
    //Inside the matching card, click the Book Now link using a locator scoped to that card only
    await worldTechCard.locator("#book-now-btn").click();
    //Assert the page URL contains /events/
    await expect(page).toHaveURL(/\/events\//);
    //Assert the h1 heading on the detail page equals the stored eventTitle
    await expect(page.locator("h1.mb-4.text-2xl")).toHaveText(eventTitle);
    //Assert the Price per ticket section contains eventPriceText
    // await expect(page.locator("//p[text()='Price per ticket']/following-sibling::p")).toHaveText(eventPriceText);
    const priceSection = page.getByText("Price per ticket").locator("..");
    await expect(priceSection).toContainText(eventPriceText);
    //Navigate back to /events
    await page.goBack();
    //Clear the search field
    await page.getByPlaceholder("Search events, venues…").clear();
    //Reset category to All Categories
    await page.locator("select").first().selectOption({ label: "All Categories" });
    //Reset city to All Cities
    await page.locator("select").last().selectOption("All Cities");
    //Assert at least 3 event cards are visible
    const cards = page.getByTestId("event-card");
    expect(await cards.count()).toBeGreaterThanOrEqual(3);
    //Compare specific items from the list
    //Read the heading text from the first event card
    const firsteventcard = await eventCards.first().getByRole("heading").textContent();
    console.log("First Event Card:", firsteventcard)
    //Read the heading text from the last event card
    const lasteventcard = await eventCards.last().getByRole("heading").textContent();
    console.log("last Event Card:", lasteventcard)
    //Read the heading text from the second event card using .nth(1)
    const secondeventcard = await eventCards.nth(1).getByRole("heading").textContent();
    console.log("last Event Card:", secondeventcard)
    //Assert all extracted titles are non-empty strings
    expect(firsteventcard?.trim()).not.toBe("");
    expect(secondeventcard?.trim()).not.toBe("");
    expect(lasteventcard?.trim()).not.toBe("");
    //Assert the first and last titles are not equal
    expect(firsteventcard).not.toBe(lasteventcard);



















});