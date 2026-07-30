import { test, expect, type Page, type Locator } from "@playwright/test";


//login(page, email, password) helper that signs in and asserts the authenticated navigation bar is visible
const email = "pratikshakadam7759@gmail.com";
const password = "Automation@2271";

async function login(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  await page.goto("/login");
  await page.getByPlaceholder("you@email.com").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign In" }).click();
  await expect(page.getByRole("button", { name: "Logout" })).toBeVisible();
  await expect(page.getByTestId("nav-bookings")).toBeVisible();
}
//createBookingFromFilters(page, bookingData) helper that uses the Search events, venues... textbox, 
// the category and city comboboxes, a scoped Book Now link, the + or - ticket controls, 
// and the confirmation panel to return { eventTitle, bookingRef, ticketCount, totalText, customerEmail }
interface BookingData {
  search: string;
  category: string;
  city: string;
  tickets: number;
  email: string;
  phone: string;
  name: string;
}

const bookingData2: BookingData = {
  search: "Dilli",
  category: "Festival",
  city: "Delhi",
  tickets: 2,
  email: "pratikshakadam7759@gmail.com",
  phone: "9860531964",
  name: "Pratiksha Kadam",
};

const bookingData1: BookingData = {
  search: "World",
  category: "Conference",
  city: "Hyderabad",
  tickets: 1,
  email: "pratikshakadam7759@gmail.com",
  phone: "9860531964",
  name: "Pratiksha Kadam",
};
interface BookingResult {
    eventTitle: string;
    bookingRef: string;
    ticketCount: number;
    totalText: string;
    customerEmail: string;
}
async function createBookingFromFilters(
    page: Page,
    bookingData: BookingData
): Promise<BookingResult> {
    const searchInput = page.getByPlaceholder("Search events, venues…");

    await expect(searchInput).toBeVisible();
    await searchInput.fill(bookingData.search);

    await page.locator("select").nth(0).selectOption(bookingData.category);
    await page.locator("select").nth(1).selectOption(bookingData.city);

    const eventCard = page
        .getByTestId("event-card")
        .filter({ hasText: bookingData.search });

    await expect(eventCard).toHaveCount(1, {
        timeout: 15000,
    });

    const bookNowButton = eventCard.getByTestId("book-now-btn");

    await expect(bookNowButton).toBeVisible({
        timeout: 15000,
    });

    await expect(bookNowButton).toBeEnabled({
        timeout: 15000,
    });

    const eventsPageUrl = page.url();

    await Promise.all([
        page.waitForURL(
            url => url.toString() !== eventsPageUrl,
            { timeout: 30000 }
        ),
        bookNowButton.click(),
    ]);

    const ticketCountLocator = page.locator("#ticket-count");

    await expect(ticketCountLocator).toBeVisible({
        timeout: 30000,
    });

    let currentTickets = Number(
        (await ticketCountLocator.textContent())?.trim() ?? "0"
    );

    while (currentTickets < bookingData.tickets) {
        await page.getByRole("button", { name: "+" }).click();

        await expect(ticketCountLocator).toHaveText(
            String(currentTickets + 1)
        );

        currentTickets++;
    }

    while (currentTickets > bookingData.tickets) {
        await page.getByRole("button", { name: "-" }).click();

        await expect(ticketCountLocator).toHaveText(
            String(currentTickets - 1)
        );

        currentTickets--;
    }

    const heading = page.locator("h1");

    await expect(heading).toBeVisible();

    const eventTitle =
        (await heading.textContent())?.trim() ?? "";

    const ticketCount = Number(
        (await ticketCountLocator.textContent())?.trim() ?? "0"
    );

    await page
        .getByPlaceholder("Your full name")
        .fill(bookingData.name);

    const customerEmail = bookingData.email;

    await page
        .getByTestId("customer-email")
        .fill(customerEmail);

    await page
        .locator("#phone")
        .fill(bookingData.phone);

    const confirmBookingButton = page.getByRole("button", {
        name: "Confirm Booking",
    });

    await expect(confirmBookingButton).toBeEnabled();

    await confirmBookingButton.click();

    const bookingReference = page.locator(".booking-ref");

    await expect(bookingReference).toBeVisible({
        timeout: 30000,
    });

    const bookingRef =
        (await bookingReference.textContent())?.trim() ?? "";

    const totalText =
        (
            await page
                .locator("div:has-text('Total') span.font-medium")
                .nth(3)
                .textContent()
        )?.trim() ?? "";

    return {
        eventTitle,
        bookingRef,
        ticketCount,
        totalText,
        customerEmail,
    };
}
//findBookingCardByRef(page, bookingRef) helper that scans the visible booking cards on /bookings 
// and returns the one whose reference text matches the supplied bookingRef
async function findBookingCardByRef(
    page: Page,
    bookingRef: string
): Promise<Locator> {
    const bookingCards = page.getByTestId("booking-card");

    await bookingCards.first().waitFor({
        state: "visible",
        timeout: 15000,
    });

    const count = await bookingCards.count();

    for (let i = 0; i < count; i++) {
        const card = bookingCards.nth(i);

        const ref =
            (await card.locator(".booking-ref").textContent())?.trim() ?? "";

        if (ref === bookingRef) {
            return card;
        }
    }

    throw new Error(`Booking with reference ${bookingRef} not found`);
}
//openBookingDetailFromCard(card) helper that opens the correct View Details action from a matched 
// booking card without relying on any page-wide index

async function openBookingDetailFromCard(
  card: Locator
): Promise<void> {
await expect(card.getByRole("button", { name: "View Details" })).toBeVisible();
await card.getByRole("button", { name: "View Details" }).click();
}


test("End-to-End Workflows", async ({ page }) => {
    //Navigate to /login
    //Call your login(page, email, password) helper
    const email = "pratikshakadam7759@gmail.com";
    const password = "Automation@2271";
    await login(page, email, password)
    //Call your createBookingFromFilters(page, { searchText: 'World',
    //category: 'Conference', city: 'Hyderabad', quantity: 1, customerName, customerEmail, phone }) helper
     await page.getByRole("link", { name: /browse events/i }).first().click();
      
     const bookings = [];
     // ---------------- First Booking ----------------
     const bookingOne = await createBookingFromFilters(page, bookingData1);
     bookings.push(bookingOne);
    console.log("===== First Booking =====");
    console.log("Event Title:", bookingOne.eventTitle);
    console.log("Booking Ref:", bookingOne.bookingRef);
    console.log("Ticket Count:", bookingOne.ticketCount);
    console.log("Total:", bookingOne.totalText);
    console.log("Customer Email:", bookingOne.customerEmail);

    // Assertions
    expect(bookingOne.eventTitle).toBe("World Tech Summit");
    expect(bookingOne.bookingRef).toBeTruthy();
    expect(bookingOne.ticketCount).toBe(bookingData1.tickets);

    // Return to Events page
    await page.getByRole("button", { name: "Browse More Events" }).click();
  

    // ---------------- Second Booking ----------------
    const bookingTwo = await createBookingFromFilters(page, bookingData2);
     bookings.push(bookingTwo);
    console.log("===== Second Booking =====");
    console.log("Event Title:", bookingTwo.eventTitle);
    console.log("Booking Ref:", bookingTwo.bookingRef);
    console.log("Ticket Count:", bookingTwo.ticketCount);
    console.log("Total:", bookingTwo.totalText);
    console.log("Customer Email:", bookingTwo.customerEmail);
//Assert bookingRefTwo is different from bookingRefOne
 expect(bookingTwo.bookingRef).not.toBe(bookingOne.bookingRef);
//Assert the second eventTitle is different from the first eventTitle
expect(bookingTwo.eventTitle).not.toBe(bookingOne.eventTitle);
//Assert ticketCountTwo equals 2
expect(bookingTwo.ticketCount).toBe(bookingData2.tickets);
//Store both returned booking objects in an array or map for later assertions
 expect(bookings).toHaveLength(2);
expect(bookings[0].bookingRef).toBe(bookingOne.bookingRef);
expect(bookings[1].bookingRef).toBe(bookingTwo.bookingRef);
//Before leaving the success page, note that both bookings now exist in the same user account
////Prepare to locate both cards by bookingRef text only
await page.getByRole("button",{name : "View My Bookings"}).click();
const firstBookingCard = await findBookingCardByRef(page,bookings[0].bookingRef);
const secondBookingCard = await findBookingCardByRef(page,bookings[1].bookingRef);
await expect(firstBookingCard).toBeVisible();
await expect(secondBookingCard).toBeVisible();
//Do not assume the first card in My Bookings belongs to the second booking
await expect(firstBookingCard).toContainText(bookings[0].eventTitle);
await expect(firstBookingCard).toContainText(bookings[0].bookingRef);
await expect(secondBookingCard).toContainText(bookings[1].eventTitle);
await expect(secondBookingCard).toContainText(bookings[1].bookingRef);

// ---------------- Step 1 ----------------

// Navigate to My Bookings
await page.goto("/bookings");

// Assert heading is visible
await expect(page.getByRole("heading", { name: "My Bookings" })).toBeVisible();

// Assert both cards are visible
await expect(firstBookingCard).toBeVisible();
await expect(secondBookingCard).toBeVisible();

// Assert both bookings are confirmed
await expect(firstBookingCard).toContainText(/confirmed/i);
await expect(secondBookingCard).toContainText(/confirmed/i);




// ---------------- Step 2 ----------------

// First booking summary
await expect(firstBookingCard).toContainText(bookings[0].eventTitle);
await expect(firstBookingCard).toContainText(`${bookings[0].ticketCount}`);
await expect(firstBookingCard).toContainText(bookings[0].totalText);

// Second booking summary
await expect(secondBookingCard).toContainText(bookings[1].eventTitle);
await expect(secondBookingCard).toContainText(`${bookings[1].ticketCount}`);
await expect(secondBookingCard).toContainText(bookings[1].totalText);

// Booking references should be different
expect(bookings[0].bookingRef).not.toBe(bookings[1].bookingRef);
//Assert each matched card contains the status text confirmed
await expect(firstBookingCard).toContainText(/confirmed/i);

// ---------------- Step 3 ----------------

// Open the first booking detail page
await openBookingDetailFromCard(firstBookingCard);

// Assert breadcrumb
await expect(page.locator("h1")).toBeVisible();

await expect(page.locator("nav.flex span.font-mono")).toHaveText(bookings[0].bookingRef);

// Assert H1 heading
await expect(page.locator("h1")).toHaveText(bookings[0].eventTitle);

// Assert Customer Details email
const emailValue = page.getByText("Email").locator("xpath=following-sibling::span");
await expect(emailValue).toHaveText(bookings[0].customerEmail);

// ---------- Payment Summary ----------
const paymentSummary = page.getByRole("heading", { name: "Payment Summary" }).locator("..");

// Tickets
await expect(
    paymentSummary.locator("//span[text()='Tickets']/following-sibling::span" )).toHaveText(`${bookings[0].ticketCount}`);

// Total Paid
await expect(paymentSummary.locator("//span[text()='Total Paid']/following-sibling::span")).toHaveText(bookings[0].totalText);
// ---------- Booking Information ----------

const bookingInformation = page.locator("div:has(h2:has-text('Booking Information'))");

const bookingId =
  (
    await bookingInformation
      .locator("span.text-sm.font-medium.text-gray-900.text-right")
      .last()
      .textContent()
  )?.trim() ?? "";

// Booking ID should be numeric
expect(bookingId).toMatch(/^#\d+$/);

// ---------------- Step 4 ----------------



// Navigate back to My Bookings
await page.goto("/bookings");

// Re-locate the second booking card
const secondBookingCardAgain = await findBookingCardByRef(page,bookings[1].bookingRef);

// Open second booking details
await openBookingDetailFromCard(secondBookingCardAgain);

// Assert event title
await expect(page.locator("h1")).toHaveText(bookings[1].eventTitle);

// Payment Summary card
const paymentSummarySecond = page.getByRole("heading", { name: "Payment Summary" }).locator("..");

// Tickets
await expect(
    paymentSummarySecond.locator("//span[text()='Tickets']/following-sibling::span")).toHaveText(`${bookings[1].ticketCount}`);

// Total Paid
await expect(
    paymentSummarySecond.locator("//span[text()='Total Paid']/following-sibling::span")).toHaveText(bookings[1].totalText);

// Breadcrumb should show second booking
await expect(page.locator("nav.flex span.font-mono")).toHaveText(bookings[1].bookingRef);

// It should NOT show first booking
await expect(page.locator("nav.flex span.font-mono")).not.toHaveText(bookings[0].bookingRef);



});



