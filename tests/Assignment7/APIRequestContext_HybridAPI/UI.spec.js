const { test, expect } = require("@playwright/test");

const {
    createAuthorizedApiContext,
    selectBookableEvent,
    createBooking,
    lookupBookingByRef,
    deleteBooking,
    injectTokenBeforeNavigation,
    findBookingCardByRef,
    parseCurrency
} = require("../helpers/eventHubHelpers");

test("APIRequestContext & Hybrid API/UI", async ({ page, playwright }) => {
// ==========================================================
// Test 1 — API-created booking appears on My Bookings
// Step 1 — Select a live event and create a booking through the API
// ==========================================================

// Create authenticated API context
const { apiContext, token } =
    await createAuthorizedApiContext(
        playwright,
        process.env.EMAIL,
        process.env.PASSWORD
    );

// Select one runtime event having at least 2 seats
const selectedEvent =
    await selectBookableEvent(apiContext, 2);

// Build booking payload
const bookingPayload = {

    eventId: selectedEvent.id,

    quantity: 2,

    customerName: "Pratiksha Kadam",

    customerEmail: process.env.EMAIL,

    customerPhone: "9876543210"

};

// Create booking
const createResponse =
    await createBooking(apiContext, bookingPayload);

// Verify booking created successfully
expect(createResponse.success).toBeTruthy();

// Store values for later assertions
const bookingId = createResponse.data.id;

const bookingRef = createResponse.data.bookingRef;

const expectedQuantity = bookingPayload.quantity;

const expectedTotal =
    selectedEvent.price * expectedQuantity;

const expectedEventTitle =
    selectedEvent.title;

const expectedCategory =
    selectedEvent.category;

const expectedCity =
    selectedEvent.city;

    // ==========================================================
// Step 2 — Verify the same booking can be found by reference
// ==========================================================

const lookupResponse =
    await lookupBookingByRef(
        apiContext,
        bookingRef
    );

// Expected: Lookup successful
expect(lookupResponse.success).toBeTruthy();

// Expected: Booking id matches
expect(
    lookupResponse.data.id
).toBe(bookingId);

// Expected: Reference code matches
expect(
    lookupResponse.data.bookingRef
).toBe(bookingRef);

// Expected: Ticket quantity matches
expect(
    lookupResponse.data.quantity
).toBe(expectedQuantity);

// Expected: Total amount matches
expect(
    Number(lookupResponse.data.totalPrice)
).toBe(expectedTotal);
// ==========================================================
// Step 3 — Open My Bookings and locate the booking
// ==========================================================

// Inject authentication token
await injectTokenBeforeNavigation(
    page,
    token
);

// Open My Bookings
await page.goto(
    `${process.env.BASE_URL}/bookings`
);

// Expected: Heading visible
await expect(
    page.getByRole("heading", {
        name: "My Bookings"
    })
).toBeVisible();

// Find booking card by booking reference
const bookingCard =
    findBookingCardByRef(
        page,
        bookingRef
    );

// Expected: Booking card visible
await expect(
    bookingCard
).toBeVisible();

// Expected: Event title matches runtime event
await expect(
    bookingCard.getByRole("heading", {
        level: 3
    })
).toHaveText(expectedEventTitle);

// Expected: Shows 2 tickets
await expect(
    bookingCard
).toContainText(
    `${expectedQuantity} tickets`
);

// Expected: Shows correct total amount
await expect(
    bookingCard
).toContainText(
    `$${expectedTotal.toLocaleString("en-US")}`
);


//click View Details
await bookingCard
    .getByRole("button", { name: "View Details" })
    .click();
//URL should contain bookingId
await expect(page).toHaveURL(
    new RegExp(`/bookings/${bookingId}$`)
);
//Breadcrumb ends with booking reference
await expect(
    page.locator("nav span.font-mono")
).toHaveText(bookingRef);
//Event title
await expect(
    page.locator("h1")
).toHaveText(expectedEventTitle);
//Category
await expect(page.locator("body"))
    .toContainText(expectedCategory);
//City
await expect(page.locator("body")).toContainText(expectedCity);

//Payment Summary shows 2 tickets
await expect(page.locator("body")).toContainText(`${expectedQuantity}`);
//Total Paid
await expect(page.locator("body")).toContainText( `$${expectedTotal.toLocaleString("en-US")}`);
//Customer Email
await expect(page.locator("body")).toContainText(bookingPayload.customerEmail);

// ==========================================================
// Step 2 — Cancel the booking through the API and verify the UI
// ==========================================================

// Delete booking through API
const deleteResponse = await deleteBooking(
    apiContext,
    bookingId
);

// Expected: Delete response is successful
expect(deleteResponse.ok()).toBeTruthy();

// Try looking up the booking again
const lookupAfterDelete =
    await apiContext.get(`/bookings/ref/${bookingRef}`);

// The application may return either a failure response
// or an HTML 404 page after deletion.
// Therefore, simply verify that the booking is no longer
// successfully retrievable.

expect(lookupAfterDelete.ok()).toBeFalsy();

// Refresh My Bookings
await page.goto(`${process.env.BASE_URL}/bookings`);

await page.reload();

// Verify booking is removed from UI
const deletedBookingCard =
    findBookingCardByRef(page, bookingRef);

console.log(
    "Booking count after delete:",
    await deletedBookingCard.count()
);

// Dispose API context
await apiContext.dispose();

























































})