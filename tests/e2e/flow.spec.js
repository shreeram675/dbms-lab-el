// tests/e2e/flow.spec.js
const { test, expect } = require('@playwright/test');

test('User can upload and verify document', async ({ page }) => {
    await page.goto('http://localhost:8080');

    // Login
    await page.fill('#email', 'bob@example.com');
    await page.fill('#password', 'hash_secret');
    await page.click('button[type="submit"]');

    // Upload
    await page.setInputFiles('input[type="file"]', 'tests/fixtures/sample.pdf');
    await page.click('#upload-btn');

    // Verify Success Message
    await expect(page.locator('.success-msg')).toBeVisible();

    // Verify Blockchain Hash
    const hash = await page.textContent('.tx-hash');
    expect(hash).toMatch(/^0x[a-fA-F0-9]{64}$/);
});
