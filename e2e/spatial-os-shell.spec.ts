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
  await expect(page.getByRole('heading', { name: 'INTERACTIVE LESSONS', exact: true })).toBeVisible();
});


test('module views use an accessible dialog shell and return home on close', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Molecular library' }).click();

  const dialog = page.getByRole('dialog', { name: /molecular library/i });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('heading', { name: /molecular library/i })).toBeVisible();
  await dialog.getByRole('button', { name: 'Close module' }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Learning Studio' })).toBeVisible();
});


test('ADVIS shell uses the Rittal-inspired industrial black and red theme', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/');

  const theme = await page.evaluate(() => ({
    canvas: getComputedStyle(document.documentElement).getPropertyValue('--advis-canvas').trim().toLowerCase(),
    primary: getComputedStyle(document.documentElement).getPropertyValue('--primary').trim().toLowerCase(),
    pageBackground: getComputedStyle(document.body).backgroundColor,
  }));
  expect(theme.canvas).toBe('#080809');
  expect(theme.primary).toBe('#e20246');
  expect(theme.pageBackground).not.toBe('rgb(0, 0, 0)');
  await expect(page.getByRole('heading', { name: /one core\. every scientific world\./i })).toHaveCSS('color', 'rgb(243, 243, 245)');

  const launchpad = page.getByRole('region', { name: 'ADVIS home workspace' });
  const launchpadBox = await launchpad.boundingBox();
  expect(launchpadBox).not.toBeNull();
  expect(launchpadBox!.x).toBeGreaterThan(1366 * 0.58);
  expect(launchpadBox!.width).toBeLessThanOrEqual(450);

  const explorerSurface = await launchpad.evaluate((element) => {
    const style = getComputedStyle(element);
    return { background: style.backgroundColor, text: style.color };
  });
  expect(explorerSurface.background).not.toContain('255, 255, 255');
  const explorerTextChannels = explorerSurface.text.match(/\d+/g)?.map(Number) ?? [];
  expect(explorerTextChannels).toHaveLength(3);
  expect(Math.min(...explorerTextChannels)).toBeGreaterThan(160);

  const primaryCard = page.getByRole('button', { name: 'Explore systems' });
  const cardStyle = await primaryCard.evaluate((element) => {
    const style = getComputedStyle(element);
    return { radius: style.borderTopLeftRadius, borderColor: style.borderTopColor, background: style.backgroundColor };
  });
  expect(parseFloat(cardStyle.radius)).toBeGreaterThanOrEqual(15);
  expect(cardStyle.borderColor).not.toBe('rgba(0, 0, 0, 0)');
  expect(cardStyle.background).not.toContain('255, 255, 255');

  const quickStarts = page.getByRole('button', { name: /quick starts/i });
  await expect(quickStarts).toBeVisible();
  await quickStarts.click();
  await expect(page.getByRole('button', { name: 'Four-stroke engine' })).toBeVisible();
  await expect(page.locator('canvas').first()).toBeVisible();
});


test('universal workspace search opens with Ctrl+K and searches existing catalogue entries', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/');

  await page.keyboard.press('Control+k');
  const searchDialog = page.getByRole('dialog', { name: 'Search ADVIS workspace' });
  await expect(searchDialog).toBeVisible();

  const search = searchDialog.getByPlaceholder(/Search destinations, models, components, molecules and lessons/i);
  await search.fill('Water');
  await expect(searchDialog.getByRole('button', { name: /Water · H₂O/i })).toBeVisible();
  await expect(searchDialog.getByText('Nothing matched that search')).toHaveCount(0);

  await page.keyboard.press('Escape');
  await expect(searchDialog).toHaveCount(0);
});

test('workspace snapshot can be saved, resumed and deleted locally', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/');

  await page.getByRole('button', { name: 'Save workspace', exact: true }).click();
  const saveDialog = page.getByRole('dialog', { name: 'Save this workspace' });
  await expect(saveDialog).toBeVisible();
  await saveDialog.getByLabel('Workspace name').fill('Unified workspace smoke test');
  await saveDialog.getByRole('button', { name: 'Save session' }).click();
  await expect(page.getByRole('status')).toContainText('Saved');

  await page.getByRole('navigation', { name: 'Workspace navigation' }).getByRole('button', { name: /^Lessons$/i }).click();
  await page.getByRole('button', { name: /Saved/i }).first().click();

  const savedDialog = page.getByRole('dialog', { name: 'Saved workspaces' });
  await expect(savedDialog).toBeVisible();
  await expect(savedDialog.getByRole('button', { name: 'Restore saved workspace Unified workspace smoke test' })).toBeVisible();
  await savedDialog.getByRole('button', { name: 'Restore saved workspace Unified workspace smoke test' }).click();
  await expect(savedDialog).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'ADVIS home workspace' })).toBeVisible();

  await page.getByRole('button', { name: /Saved/i }).first().click();
  const restoredList = page.getByRole('dialog', { name: 'Saved workspaces' });
  await expect(restoredList.getByRole('button', { name: /Unified workspace smoke test/ })).toBeVisible();
  await restoredList.getByRole('button', { name: 'Delete saved workspace Unified workspace smoke test' }).click();
  await expect(restoredList.getByRole('button', { name: /Unified workspace smoke test/ })).toHaveCount(0);
});
