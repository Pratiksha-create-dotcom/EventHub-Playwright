require("dotenv").config();
const { expect } = require("@playwright/test");


// ==========================================================
// Create authenticated API Context
// ==========================================================
async function createAuthorizedApiContext(playwright, email, password) {

    const apiContext = await playwright.request.newContext({

        extraHTTPHeaders: {
            "Content-Type": "application/json",
            "Origin": process.env.BASE_URL
        }

    });


    const response = await apiContext.post(
        `${process.env.API_BASE_URL}/auth/login`,
        {
            data: {
                email,
                password
            }
        }
    );


    console.log("LOGIN STATUS:", response.status());

    expect(response.ok()).toBeTruthy();


    const body = await response.json();


    const authorizedContext =
        await playwright.request.newContext({

            extraHTTPHeaders: {

                "Content-Type": "application/json",

                "Origin": process.env.BASE_URL,

                "Authorization":
                    `Bearer ${body.token}`
            }

        });


    return {

        apiContext: authorizedContext,

        token: body.token

    };

}



// ==========================================================
// Select runtime event
// ==========================================================
async function selectBookableEvent(apiContext, minimumSeats) {


    const response = await apiContext.get(
        `${process.env.API_BASE_URL}/events`
    );


    console.log(
        "EVENT STATUS:",
        response.status()
    );


    expect(response.ok()).toBeTruthy();


    const body = await response.json();


    const event = body.data.find(
        event =>
            event.availableSeats >= minimumSeats
    );


    expect(event).toBeTruthy();


    return event;

}



// ==========================================================
// Create Booking
// ==========================================================
async function createBooking(apiContext, payload) {


    const response = await apiContext.post(

        `${process.env.API_BASE_URL}/bookings`,

        {

            data: payload

        }

    );


    console.log(
        "BOOKING STATUS:",
        response.status()
    );


    if(!response.ok()) {

        console.log(
            await response.text()
        );

    }


    expect(response.ok()).toBeTruthy();


    return await response.json();

}



// ==========================================================
// Lookup Booking
// ==========================================================
async function lookupBookingByRef(apiContext, bookingRef) {


    const response =
        await apiContext.get(

            `${process.env.API_BASE_URL}/bookings/ref/${bookingRef}`

        );


    expect(response.ok()).toBeTruthy();


    return await response.json();

}



// ==========================================================
// Inject token
// ==========================================================
async function injectTokenBeforeNavigation(page, token) {


    await page.addInitScript(token => {

        localStorage.setItem(
            "eventhub_token",
            token
        );

    }, token);

}



// ==========================================================
// Find booking card
// ==========================================================
function findBookingCardByRef(page, bookingRef) {


    return page
        .getByTestId("booking-card")
        .filter({

            has:
                page.locator(
                    ".booking-ref",
                    {
                        hasText: bookingRef
                    }
                )

        });

}



// ==========================================================
// Currency parser
// ==========================================================
function parseCurrency(text) {


    return Number(

        text
            .replace("$","")
            .replace(/,/g,"")
            .trim()

    );

}

async function deleteBooking(apiContext, bookingId) {

    const response = await apiContext.delete(`/bookings/${bookingId}`);

    expect(response.ok()).toBeTruthy();

    return response;
}



module.exports = {

    createAuthorizedApiContext,

    selectBookableEvent,

    createBooking,

    lookupBookingByRef,

    deleteBooking,

    injectTokenBeforeNavigation,

    findBookingCardByRef,

    parseCurrency

};

