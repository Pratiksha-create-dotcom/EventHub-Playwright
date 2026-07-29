
//Import defineConfig from @playwright/test
import "dotenv/config";
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({

    // Configure test directory
    testDir: "./tests",

    // Configure baseURL
    use: {
        baseURL: process.env.BASE_URL,
    },

    // retries: 1,

    projects: [

        {
            name: "chromium",

            use: {
                ...devices["Desktop Chrome"],
            },
        },

        // {
        //     name: "firefox",
        //     use: {
        //         ...devices["Desktop Firefox"],
        //     },
        // },

    ],

});