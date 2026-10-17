import { test, expect } from '@playwright/test';

test('engineering cockpit supports component inspection and reversible explosion', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.goto('/');
  await expect(page.getByRole('button', { name: 'V12 Engine', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'V12 Engine', exact: true }).click();

  const workstation = page.getByRole('button', { name: /Open CAD Workstation/i });
  await expect(workstation).toBeVisible();
  await workstation.click();

  await page.getByRole('button', { name: 'Parts', exact: true }).click();
  const search = page.getByRole('textbox', {
    name: 'Search components by name, subsystem or description',
  });
  await search.fill('crankshaft');

  const crankshaft = page.getByRole('button', { name: /V12 Crankshaft \(illustrative\)/i });
  await expect(crankshaft).toBeVisible();
  await crankshaft.click();
  await expect(page.getByRole('region', { name: 'Selected component details' })).toBeVisible();

  await page.getByRole('button', { name: 'Isolate selected' }).click();
  await expect(page.getByRole('button', { name: 'Restore assembly' })).toBeVisible();
  await page.getByRole('button', { name: 'Restore assembly' }).click();
  await expect(page.getByRole('button', { name: 'Isolate selected' })).toBeVisible();

  await page.getByRole('button', { name: 'Hide V12 Crankshaft (illustrative)' }).click();
  await page.getByRole('button', { name: 'Show V12 Crankshaft (illustrative)' }).click();

  const progress = page.getByTestId('assembly-explosion-progress');
  await expect(progress).toHaveText('0%');
  await page.getByRole('button', { name: 'Next exploded-view stage' }).click();
  await expect(progress).toHaveText('15%');
  await page.getByRole('button', { name: 'Reassemble all components' }).click();
  await expect(progress).toHaveText('0%');

  await page.getByRole('button', { name: 'Fully explode all components' }).click();
  await expect(progress).toHaveText('100%');
  await page.getByRole('button', { name: 'Reassemble all components' }).click();
  await expect(progress).toHaveText('0%');

  expect(pageErrors, 'Unexpected uncaught browser errors during model inspection').toEqual([]);
});
