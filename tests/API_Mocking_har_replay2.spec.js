const { test, expect } = require("@playwright/test");
//login(page, email, password) helper that signs in and asserts the My Bookings navigation link is visible
const email = "pratikshakadam7759@gmail.com";
const password = "Automation@2271";

// ----------------------------------------------------------------------
// Login Helper
// ----------------------------------------------------------------------

async function login(page, email, password) {
    await page.goto("/login");
    await page.getByPlaceholder("you@email.com").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Sign In" }).click();
    await expect(page.getByRole("button", { name: "Logout" })).toBeVisible();
    await expect(page.getByTestId("nav-bookings")).toBeVisible();
}
//patchBookingsList(page, mutateBooking) helper that intercepts /api/bookings?page=1&limit=10, fetches the live response,
//updates exactly one booking record, and returns the modified list
async function patchBookingsList(page, mutateBooking) {
    await page.route("**/api/bookings?**", async (route) => {

        console.log("✅ Route intercepted");

        const response = await route.fetch();
        const body = await response.json();

        console.log("Bookings returned:", body.data.length);

        const updatedBookings = body.data.map((booking, index) => {
            if (index === 0) {
                console.log("Patching booking:", booking);

                return mutateBooking(booking);
            }

            return booking;
        });

        await route.fulfill({
            response,
            body: JSON.stringify({
                ...body,
                data: updatedBookings
            })
        });
    });
}


//patchBookingDetail(page, getPatchedState) helper that intercepts /api/bookings/{id} 
//for the selected booking id and returns a detail response aligned with the patched list data
async function patchBookingDetail(page, getPatchedState) {
    await page.route("**/api/bookings/*", async (route) => {

        const response = await route.fetch();
        const body = await response.json();
           console.log(body);
        const patchedState = getPatchedState();

        body.data.bookingRef = patchedState.bookingRef;
        body.data.quantity = patchedState.quantity;
        body.data.totalPrice = patchedState.totalPrice;
        body.data.event.title = patchedState.event.title;

        await route.fulfill({
            response,
            body: JSON.stringify(body)
        });
    });
}
//findBookingCardByRef(page, bookingRef) helper that scans visible booking cards 
// and returns the card whose reference text matches the supplied ref

// Returns the booking card having the given booking reference
function findBookingCardByRef(page, bookingRef) {
    return page
        .getByTestId("booking-card")
        .filter({
            has: page.locator(".booking-ref", {
                hasText: bookingRef
            })
        });
}
//parseCurrency(text) helper that converts UI currency strings like $1,111 into numbers
// Converts "$1,111" → 1111
function parseCurrency(text) {
    return Number(
        text
            .replace("$", "")
            .replace(/,/g, "")
            .trim()
    );
}

//test 1 — Patched booking appears correctly on My Bookings
//Step 1 — Sign in and open My Bookings with one patched list record
//Before opening My Bookings, activate list-response patching using patchBookingsList(page, mutateBooking)
//In that helper, fetch the live bookings list from /api/bookings?page=1&limit=10 and select exactly one booking at runtime (preferably the first booking returned after login)
//Keep that booking's original id, but change its reference code, event title, ticket count, and total amount to deterministic values that are easy to verify in the UI
//Leave all other bookings unchanged so the page still shows a mix of live and patched data
//Store the patched booking object for later assertions
//Open the My Bookings page
//Expected: The heading My Bookings is visible
test("API Mocking & HAR Replay 1", async ({ page }) => {

    // Sign in
    await login(page, email, password);

    // Variable to store the patched booking
    let patchedBooking;

    // Activate booking list patching
    await patchBookingsList(page, (booking) => {

        patchedBooking = {
            ...booking,

            bookingRef: "AUTO-12345",

            event: {
                ...booking.event,
                title: "Automation Summit 2026"
            },

            quantity: 3,

            totalPrice: "4500"
        };

        console.log(patchedBooking);

        return patchedBooking;
    });

    // Open My Bookings
    await page.goto("/bookings");

    // Verify heading
    await expect(
        page.getByRole("heading", { name: "My Bookings" })
    ).toBeVisible();

    // =====================================================
    // Step 2 - Verify only the intended booking changed
    // =====================================================

    // Locate the patched booking card using its reference
    const patchedCard = findBookingCardByRef(
        page,
        patchedBooking.bookingRef
    );

    // Expected: The patched card is visible
    await expect(patchedCard).toBeVisible();

    // Expected: Card heading equals patched event title
    await expect(
        patchedCard.getByRole("heading", { level: 3 })
    ).toHaveText(patchedBooking.event.title);

    // Expected: Card shows patched ticket count
    await expect(patchedCard).toContainText(
        `${patchedBooking.quantity} tickets`
    );

    // Expected: Card shows patched total amount
    const formattedTotal =
        `$${Number(patchedBooking.totalPrice).toLocaleString("en-US")}`;

    await expect(patchedCard).toContainText(formattedTotal);

    // Expected: At least one other booking still has live data
    await expect(
        page.getByTestId("booking-card")
            .filter({ hasNotText: patchedBooking.bookingRef })
            .first()
    ).toBeVisible();


    // =====================================================
    // Step 3 - Open the patched booking detail page
    // =====================================================

    // Register detail API patch BEFORE opening detail page
    await patchBookingDetail(page, () => patchedBooking);

    // Click View Details
    await patchedCard.getByRole("button", { name: "View Details" }).click();

    // Verify browser navigates to the same booking id
    await expect(page).toHaveURL(
        new RegExp(`/bookings/${patchedBooking.id}$`)
    );


    // =====================================================
    // Test 2 - Verify patched detail page
    // =====================================================

    // Expected: Breadcrumb ends with patched booking reference
    await expect(
        page.locator("nav span.font-mono")
    ).toHaveText(patchedBooking.bookingRef);

    // Expected: Event title equals patched title
    await expect(
        page.locator("h1")
    ).toHaveText(patchedBooking.event.title);

    // Expected: Payment Summary shows patched ticket quantity
    await expect(
        page.getByText("Tickets")
            .locator("..")
            .locator("span")
            .last()
    ).toHaveText(String(patchedBooking.quantity));

    // Expected: Total Paid equals patched total amount
    await expect(
        page.locator(".text-lg.font-bold.text-indigo-700")
    ).toHaveText(formattedTotal);

    // Expected: Customer email remains original (live value)
   const customerDetails = page
    .getByRole("heading", { name: "Customer Details" })
    .locator("..");

await expect(
    customerDetails.getByText(patchedBooking.customerEmail)
).toBeVisible();


//Step 3 — Return to My Bookings and re-find the same card
//Navigate back to /bookings
//Locate the same booking again using findBookingCardByRef(page, patchedBookingRef)
//Expected: The same patched card is found by reference text only
//Expected: Its total amount still matches the patched value shown on the detail page


// =======================================
// Step 3 - Return to My Bookings
// =======================================

// Navigate back to My Bookings
await page.goto("/bookings");

// Find the same booking again using booking reference
const sameBookingCard = findBookingCardByRef(
    page,
    patchedBooking.bookingRef
);

// Expected: Same patched card is visible
await expect(sameBookingCard).toBeVisible();

// Expected: Total amount still matches patched value
await expect(sameBookingCard).toContainText(
    `$${Number(patchedBooking.totalPrice).toLocaleString("en-US")}`
);





























});