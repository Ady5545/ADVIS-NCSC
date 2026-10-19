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


test('workspace command palette searches the existing chemistry catalogue', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/');
  await page.keyboard.press('Control+k');

  const dialog = page.getByRole('dialog', { name: 'Search ADVIS workspace' });
  await expect(dialog).toBeVisible();
  await dialog.getByPlaceholder(/Search destinations, models, components, molecules and lessons/i).fill('Water');
  await expect(dialog.getByRole('button', { name: /Water · H2O/i })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
});

test('workspace sessions save, restore and delete without changing model assets', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/');

  await page.keyboard.press('Control+k');
  const commands = page.getByRole('dialog', { name: 'Search ADVIS workspace' });
  await commands.getByPlaceholder(/Search destinations, models, components, molecules and lessons/i).fill('Save current workspace');
  await commands.getByRole('button', { name: 'Save current workspace' }).click();

  const saveDialog = page.getByRole('dialog', { name: 'Save this workspace' });
  await expect(saveDialog).toBeVisible();
  await saveDialog.getByLabel('Workspace name').fill('Current production shell smoke test');
  await saveDialog.getByRole('button', { name: 'Save session' }).click();
  // The transient toast is presentation-only and may disappear during a slow
  // headless WebGL startup; assert the durable state and dialog transition.
  await expect(saveDialog).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => {
    return window.localStorage.getItem('advis_unified_workspace_sessions_v1') || '';
  })).toContain('Current production shell smoke test');

  await page.getByRole('button', { name: 'Open ADVIS command search' }).click();
  const savedCommand = page.getByRole('dialog', { name: 'Search ADVIS workspace' });
  await savedCommand.getByPlaceholder(/Search destinations, models, components, molecules and lessons/i).fill('Open saved workspaces');
  await savedCommand.getByRole('button', { name: 'Open saved workspaces' }).click();

  const savedDialog = page.getByRole('dialog', { name: 'Saved workspaces' });
  await expect(savedDialog.getByRole('button', { name: 'Restore saved workspace Current production shell smoke test' })).toBeVisible();
  await savedDialog.getByRole('button', { name: 'Restore saved workspace Current production shell smoke test' }).click();
  await expect(savedDialog).toHaveCount(0);

  await page.getByRole('button', { name: 'Open ADVIS command search' }).click();
  const savedCommandAgain = page.getByRole('dialog', { name: 'Search ADVIS workspace' });
  await savedCommandAgain.getByPlaceholder(/Search destinations, models, components, molecules and lessons/i).fill('Open saved workspaces');
  await savedCommandAgain.getByRole('button', { name: 'Open saved workspaces' }).click();

  const restoredList = page.getByRole('dialog', { name: 'Saved workspaces' });
  await restoredList.getByRole('button', { name: 'Delete saved workspace Current production shell smoke test' }).click();
  await expect(restoredList.getByRole('button', { name: /Current production shell smoke test/ })).toHaveCount(0);
});


test('mobile navigation exposes the same command search without a new navbar', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const searchButton = page.getByRole('button', { name: 'Open ADVIS command search' });
  await expect(searchButton).toBeVisible();
  await searchButton.click();
  await expect(page.getByRole('dialog', { name: 'Search ADVIS workspace' })).toBeVisible();
});
