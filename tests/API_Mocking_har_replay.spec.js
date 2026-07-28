const { test, expect } = require("@playwright/test");

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

// ----------------------------------------------------------------------
// Mock Data Helper
// ----------------------------------------------------------------------

function buildMockEvents() {
    return [
        {
            id: 1,
            title: "AI Leadership Conference",
            description:
                "A premier technology conference bringing together industry leaders.",
            category: "Conference",
            venue: "Hyderabad, Hitech city",
            city: "Hyderabad",
            eventDate: "2026-04-18T09:00:00.000Z",
            price: "1500",
            totalSeats: 500,
            availableSeats: 7,
            imageUrl:
                "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800",
            isStatic: true,
            userId: null,
            createdAt: "2026-02-22T23:03:37.659Z",
            updatedAt: "2026-05-23T06:57:02.677Z",
        },

        {
            id: 2,
            title: "Hollywood Monsoon Night — Los Angeles",
            description:
                "An unforgettable evening of live music.",
            category: "Concert",
            venue: "Dome, NSCI SVP Stadium, Worli",
            city: "Mumbai",
            eventDate: "2026-07-11T19:00:00.000Z",
            price: "2500",
            totalSeats: 3000,
            availableSeats: 8,
            imageUrl:
                "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800",
            isStatic: true,
            userId: null,
            createdAt: "2026-02-22T23:03:37.669Z",
            updatedAt: "2026-07-07T06:33:50.248Z",
        },

        {
            id: 3,
            title: "Dilli Diwali Mela",
            description:
                "Celebrate the Festival of Lights.",
            category: "Festival",
            venue: "Pragati Maidan Exhibition Grounds",
            city: "Delhi",
            eventDate: "2026-10-20T17:00:00.000Z",
            price: "300",
            totalSeats: 10000,
            availableSeats: 6,
            imageUrl:
                "https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=800",
            isStatic: true,
            userId: null,
            createdAt: "2026-02-22T23:03:37.680Z",
            updatedAt: "2026-05-29T05:44:25.067Z",
        },

        {
            id: 4,
            title: "Startup Expo",
            description:
                "Explore the latest innovations from startups.",
            category: "Workshop",
            venue: "Airport Road Convention Center",
            city: "Bangalore",
            eventDate: "2026-11-15T10:00:00.000Z",
            price: "1000",
            totalSeats: 1000,
            availableSeats: 40,
            imageUrl:
                "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800",
            isStatic: true,
            userId: null,
            createdAt: "2026-03-01T10:00:00.000Z",
            updatedAt: "2026-06-01T10:00:00.000Z",
        },
    ];
}

// ----------------------------------------------------------------------
// API Mock Helper
// ----------------------------------------------------------------------

async function installMockEventRoutes(page, mockEvents) {

    // Catalog API
    await page.route("**/api/events?**", async (route) => {

        const url = new URL(route.request().url());

        const search =
            (url.searchParams.get("search") || "").toLowerCase();

        const category =
            url.searchParams.get("category") || "";

        const city =
            url.searchParams.get("city") || "";

        let filteredEvents = [...mockEvents];

        if (search) {
            filteredEvents = filteredEvents.filter(
                event =>
                    event.title.toLowerCase().includes(search) ||
                    event.venue.toLowerCase().includes(search)
            );
        }

        if (category) {
            filteredEvents = filteredEvents.filter(
                event => event.category === category
            );
        }

        if (city) {
            filteredEvents = filteredEvents.filter(
                event => event.city === city
            );
        }

        await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
                success: true,
                data: filteredEvents,
                pagination: {
                    total: filteredEvents.length,
                    page: 1,
                    limit: 12,
                    totalPages: 1,
                },
            }),
        });
    });

    // Details API
    await page.route("**/api/events/*", async (route) => {

        const id = Number(route.request().url().split("/").pop());

        const event = mockEvents.find(e => e.id === id);

        if (event) {

            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    success: true,
                    data: event,
                }),
            });

        } else {

            await route.fulfill({
                status: 404,
                contentType: "application/json",
                body: JSON.stringify({
                    success: false,
                    message: "Event not found",
                }),
            });

        }

    });

}

// ----------------------------------------------------------------------
// Locator Helper
// ----------------------------------------------------------------------

function findEventCardByTitle(page, title) {
    return page
        .getByTestId("event-card")
        .filter({ hasText: title });
}

// ----------------------------------------------------------------------
// Currency Helper
// ----------------------------------------------------------------------

function parseCurrency(text) {
    return Number(
        text.replace("$", "").replace(/,/g, "").trim()
    );
}


test("API Mocking & HAR Replay", async ({ page }) => {

    // Sign in to EventHub
    await login(page, email, password);

    // Prepare mock dataset
    const mockEvents = buildMockEvents();

    // Activate mocked APIs
    await installMockEventRoutes(page, mockEvents);

    // Open Events page
    await page.goto("/events");

    // Verify heading
    await expect(
        page.getByRole("heading", { name: "Upcoming Events" })
    ).toBeVisible();

    // -------------------------------------------------------
    // Step 2 - Verify mocked events
    // -------------------------------------------------------

    // Exactly 4 cards
    const eventCards = page.getByTestId("event-card");
    await expect(eventCards).toHaveCount(4);

    // All mocked titles are visible
    for (const event of mockEvents) {
        await expect(page.getByText(event.title)).toBeVisible();
    }

    // Live event should not appear
    await expect(
        page.getByText("World Tech Summit")
    ).not.toBeVisible();

    // Verify each card shows correct price & seats
    for (const event of mockEvents) {

        const card = findEventCardByTitle(page, event.title);

        const formattedPrice =
            `$${Number(event.price).toLocaleString("en-US")}`;

        await expect(card).toContainText(formattedPrice);

        await expect(card).toContainText(
            `${event.availableSeats}`
        );
    }

    // Verify links
    for (const event of mockEvents) {

       const card = findEventCardByTitle(page, event.title);

        await expect(
            card.getByRole("link", { name: event.title })
        ).toHaveAttribute(
            "href",
            `/events/${event.id}`
        );

        await expect(
            card.getByTestId("book-now-btn")
        ).toHaveAttribute(
            "href",
            `/events/${event.id}`
        );
    }

    // -------------------------------------------------------
    // Step 3 - Filter mocked events
    // -------------------------------------------------------

   // ---------------- Step 3 ----------------

// Find Hyderabad Conference
const matchedMockEvent = mockEvents.find(
    event =>
        event.category === "Conference" &&
        event.city === "Hyderabad"
);

// Filter events
await page.getByPlaceholder("Search events, venues…").fill(
    matchedMockEvent.title.split(" ")[0]
);

await page.locator("select").first().selectOption("Conference");
await page.locator("select").nth(1).selectOption("Hyderabad");

// Verify only one card
await expect(page.getByTestId("event-card")).toHaveCount(1);

// Get the remaining card
const card = findEventCardByTitle(page, matchedMockEvent.title);

// Verify title
await expect(card).toContainText(matchedMockEvent.title);

// Format price
const formattedPrice =
    `$${Number(matchedMockEvent.price).toLocaleString("en-US")}`;

// Verify price
await expect(card).toContainText(formattedPrice);

// Verify seats
await expect(card).toContainText(
    `${matchedMockEvent.availableSeats} seats left!`
);

// --------------------------------------------------
// Test 2 starts here
// --------------------------------------------------

// Click Book Now
await card.getByTestId("book-now-btn").click();

// Verify URL
await expect(page).toHaveURL(
    new RegExp(`/events/${matchedMockEvent.id}$`)
);

// Verify title
await expect(page.locator("h1")).toHaveText(
    matchedMockEvent.title
);

// Verify price
await expect(page.locator("div.lg\\:sticky"))
    .toContainText(formattedPrice);

// Verify venue
await expect(
    page.getByText(matchedMockEvent.venue)
).toBeVisible();

// Verify city
await expect(page.getByText(matchedMockEvent.city, { exact: true })).toBeVisible();

// Verify available seats
await expect(
    page.getByText(`(max ${matchedMockEvent.availableSeats})`)
).toBeVisible();

// ---------------- Step 2 ----------------

// Quantity starts at 1
const ticketCount = page.locator("#ticket-count");
await expect(ticketCount).toHaveText("1");

// Total amount
const totalLocator =
    page.locator("div.bg-indigo-50 span.text-indigo-700");

expect(
    parseCurrency(await totalLocator.textContent())
).toBe(Number(matchedMockEvent.price));

// Click +
await page.getByRole("button", { name: "+" }).click();

// Quantity becomes 2
await expect(ticketCount).toHaveText("2");

// Total becomes price × 2
expect(
    parseCurrency(await totalLocator.textContent())
).toBe(Number(matchedMockEvent.price) * 2);




































});




