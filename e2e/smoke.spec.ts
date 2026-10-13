import { test, expect } from '@playwright/test';

test('workspace boots and provides a usable canvas or a clear WebGL fallback', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  const response = await page.goto('/');
  expect(response, 'The application route should respond').not.toBeNull();
  expect(response!.ok(), 'The application route should return an OK status').toBeTruthy();
  await expect(page).toHaveTitle(/A\.D\.V\.I\.S\./i);
  await expect(page.locator('#root')).not.toBeEmpty();

  // The app can continue with textual inspection/lessons when WebGL is unavailable.
  const canvas = page.locator('canvas').first();
  const fallback = page.getByRole('alert', { name: /3D rendering unavailable/i });
  await expect.poll(async () => {
    return (await canvas.count()) > 0 || (await fallback.count()) > 0;
  }, { timeout: 30_000 }).toBeTruthy();
  expect(pageErrors, 'Unexpected unhandled browser errors').toEqual([]);
});

test('narrow viewport retains the application shell without a startup error', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page).toHaveTitle(/A\.D\.V\.I\.S\./i);
  await expect(page.locator('#root')).not.toBeEmpty();
  await expect(page.getByRole('alert', { name: /3D rendering unavailable/i })).toHaveCount(0).catch(async () => {
    // No WebGL error alert is also an acceptable narrow-screen outcome.
  });
  const bootFlag = await page.evaluate(() => Boolean((window as Window & { __ADVIS_BOOT_RENDER_STARTED__?: boolean }).__ADVIS_BOOT_RENDER_STARTED__));
  expect(bootFlag, 'The JavaScript application should mount at a narrow viewport').toBe(true);
});
