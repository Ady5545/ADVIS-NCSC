import { test, expect } from '@playwright/test';

test('home presents the ADVIS shell without stale catalog-count claims', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/');

  await expect(page).toHaveTitle(/A\.D\.V\.I\.S\./i);
  await expect(page.getByRole('navigation', { name: 'Workspace navigation' })).toBeVisible();
  await expect(page.getByText('18 Verified Molecules', { exact: true })).toHaveCount(0);
  await expect(page.getByText('14 Mechanical Systems', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /learning studio/i })).toBeVisible();
});

test('mobile navigation keeps Home visible and secondary destinations discoverable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  const navigation = page.getByRole('navigation', { name: 'Mobile primary navigation' });
  await expect(navigation).toBeVisible();
  await expect(navigation.getByRole('button', { name: 'Home' })).toBeVisible();

  const more = navigation.getByRole('button', { name: 'More destinations' });
  await expect(more).toBeVisible();
  await more.click();
  await expect(page.getByRole('button', { name: /CAD Reference Lab/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Gesture Control/i })).toBeVisible();

  const width = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(width).toBeLessThanOrEqual(390);
});

test('all current destinations remain available to desktop navigation', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/');

  const navigation = page.getByRole('navigation', { name: 'Workspace navigation' });
  for (const label of [
    'Home',
    'Molecules',
    'Engineering',
    'CAD Reference Lab',
    'Innovation Lab',
    'Compare',
    'Demonstrations',
    'Lessons',
    'Gesture Control',
    'Telemetry',
    'Settings',
  ]) {
    await expect(navigation.getByRole('button', { name: new RegExp(label, 'i') })).toBeVisible();
  }
});


test('command dock exposes meaningful names for its primary controls', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('textbox', { name: 'Ask ADVIS' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Attach a file' })).toBeVisible();
  await expect(page.getByRole('button', { name: /start voice input/i })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Send command' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open settings' })).toBeVisible();
});


test('Learning Studio opens the existing interactive lessons module', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Learning Studio' }).click();
  await expect(page.getByRole('heading', { name: /interactive lessons/i })).toBeVisible();
});
