import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
    testDir: "./tests",

    testMatch: ["**/*.spec.ts"],

    timeout: 120000,

    use: {
        baseURL: "https://eventhub.rahulshettyacademy.com",
        actionTimeout: 15000,
    },

    projects: [
        {
            name: "chromium",
            use: {
                ...devices["Desktop Chrome"],
            },
        },
    ],
});