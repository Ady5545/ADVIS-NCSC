import { test, expect, type Page } from '@playwright/test';

async function clickNext(page: Page) {
  const dialog = page.getByRole('dialog', { name: 'Guided learning lesson' });
  await dialog.getByRole('button', { name: /Next step|Finish lesson/i }).click();
}

async function acknowledgeStep(page: Page) {
  const dialog = page.getByRole('dialog', { name: 'Guided learning lesson' });
  await dialog.getByRole('button', { name: /Mark step complete/i }).click();
  await clickNext(page);
}

async function answerQuestion(page: Page, option: RegExp | string) {
  const dialog = page.getByRole('dialog', { name: 'Guided learning lesson' });
  await dialog.getByRole('radio', { name: option }).check();
  await dialog.getByRole('button', { name: 'Check answer' }).click();
}

async function captureWithin<T>(probe: Promise<T>, fallback: T, timeoutMs = 1_500): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      probe.catch(() => fallback),
      new Promise<T>((resolve) => {
        timer = setTimeout(() => resolve(fallback), timeoutMs);
      }),
    ]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

test('V8 guided lesson enforces correct answers, teaches the cycle, and restores the assembly', async ({ page }) => {
  // The 3D application has a heavier first-render path than the static smoke tests.
  test.setTimeout(90_000);
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });

  await page.goto('/');
  await expect(page).toHaveTitle(/A\.D\.V\.I\.S\./i);
  await page.getByRole('button', { name: '4-Stroke Engine' }).click();

  const launchLesson = page.getByRole('button', { name: /Guided Lesson/i });
  const failWithLauncherDiagnostics = async (phase: string, cause: unknown): Promise<never> => {
    // A frozen WebGL/React renderer can stall DOM protocol probes as well as locator actions.
    // Race each diagnostic against a hard wall-clock cap so diagnostics cannot hang the test.
    const [bodyText, count, visible, bounds] = await Promise.all([
      captureWithin(page.locator('body').innerText({ timeout: 1_000 }), '[page probe timed out]', 1_500),
      captureWithin(launchLesson.count(), -1, 1_500),
      captureWithin(launchLesson.isVisible(), false, 1_500),
      captureWithin(launchLesson.boundingBox(), null, 1_500),
    ]);
    throw new Error([
      'Guided Lesson launcher failed during ' + phase + ' after selecting canonical model v8_engine.',
      'Launcher count=' + count + '; visible=' + visible + '; bounds=' + JSON.stringify(bounds),
      'Page errors: ' + (pageErrors.slice(-12).join(' | ') || '(none)'),
      'Console errors: ' + (consoleErrors.slice(-20).join(' | ') || '(none)'),
      'Visible page text tail: ' + (bodyText.slice(-3000) || '(empty)'),
      'Original Playwright error: ' + String(cause),
    ].join('\n'));
  };
  await expect(launchLesson).toBeVisible({ timeout: 15_000 }).catch((error) => failWithLauncherDiagnostics('visibility', error));
  await launchLesson.click({ timeout: 15_000 }).catch((error) => failWithLauncherDiagnostics('click', error));

  const dialog = page.getByRole('dialog', { name: 'Guided learning lesson' });
  await expect(dialog).toBeVisible({ timeout: 15_000 }).catch(async (assertionError) => {
    const visibleText = (await captureWithin(
      page.locator('body').innerText({ timeout: 1_000 }),
      '[page probe timed out]',
      1_500,
    )).slice(-2500);
    throw new Error(
      'The Guided Lesson button was clicked but the lesson dialog did not appear. ' +
      'Browser errors: ' + (pageErrors.join(' | ') || '(none captured)') +
      '\\nVisible page text tail: ' + (visibleText || '(empty)') +
      '\\nOriginal Playwright assertion: ' + String(assertionError),
    );
  });
  await expect(dialog.getByRole('heading', { name: 'Inside a Cross-Plane V8' })).toBeVisible();

  // 1. Meet the engine. Capture the live page state if the first-step panel stalls after the model is selected.
  await expect(dialog.getByRole('heading', { name: 'Meet the engine' })).toBeVisible({ timeout: 20_000 }).catch(async (assertionError) => {
    const visibleText = (await page.locator('body').innerText({ timeout: 5_000 }).catch(() => '')).slice(-3000);
    throw new Error(
      'The lesson shell opened, but its first step did not render. Browser errors: ' +
      (pageErrors.join(' | ') || '(none captured)') +
      '\\nVisible page text tail: ' + (visibleText || '(empty or renderer unresponsive)') +
      '\\nOriginal Playwright assertion: ' + String(assertionError),
    );
  });
  await acknowledgeStep(page);

  // 2. The lesson's action selects the block, satisfying the component-selection requirement.
  await expect(dialog.getByRole('heading', { name: 'Find the engine block' })).toBeVisible();
  await expect(dialog.getByText('Correct component selected')).toBeVisible();
  await clickNext(page);

  // 3. Exploded view is a teaching aid; acknowledge before advancing.
  await expect(dialog.getByRole('heading', { name: 'Disassemble the engine' })).toBeVisible();
  await acknowledgeStep(page);

  // 4. Crankshaft role: a correct answer is required in addition to selecting the part.
  await expect(dialog.getByRole('heading', { name: 'Follow the crankshaft' })).toBeVisible();
  await answerQuestion(page, /Convert linked reciprocating motion into rotary motion/i);
  await expect(dialog.getByText('Correct!', { exact: true })).toBeVisible();
  await clickNext(page);

  // 5. The four-stroke cycle uses two crankshaft revolutions.
  await expect(dialog.getByRole('heading', { name: 'Explore the four-stroke cycle' })).toBeVisible();
  await answerQuestion(page, /720 degrees \(two crankshaft revolutions\)/i);
  await expect(dialog.getByText('Correct!', { exact: true })).toBeVisible();
  await clickNext(page);

  // 6. RPM changes animation rate; it must not imply validated performance predictions.
  await expect(dialog.getByRole('heading', { name: 'Change RPM and observe' })).toBeVisible();
  await acknowledgeStep(page);

  // 7. Verify assessment gating: a wrong answer must not unlock the next step.
  await expect(dialog.getByRole('heading', { name: 'Knowledge check: four-stroke order' })).toBeVisible();
  await answerQuestion(page, /Power → intake → exhaust → compression/i);
  await expect(dialog.getByText('Not quite — try again.')).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Next step' })).toBeDisabled();

  await answerQuestion(page, /Intake → compression → power → exhaust/i);
  await expect(dialog.getByText('Correct!', { exact: true })).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Next step' })).toBeEnabled();
  await clickNext(page);

  // 8. The simplified teaching window distinguishes intake from exhaust.
  await expect(dialog.getByRole('heading', { name: 'Knowledge check: valve timing' })).toBeVisible();
  await answerQuestion(page, /^Exhaust valve$/i);
  await expect(dialog.getByText('Correct!', { exact: true })).toBeVisible();
  await clickNext(page);

  // 9. The learner must understand the model's evidence boundary.
  await expect(dialog.getByRole('heading', { name: 'Knowledge check: model limits' })).toBeVisible();
  await answerQuestion(page, /not validated engine performance or OEM accuracy/i);
  await expect(dialog.getByText('Correct!', { exact: true })).toBeVisible();
  await clickNext(page);

  // 10. The final step restores the default assembly and motion state.
  await expect(dialog.getByRole('heading', { name: 'Restore the assembly' })).toBeVisible();
  await acknowledgeStep(page);

  await expect(dialog.getByRole('heading', { name: 'Lesson complete!' })).toBeVisible();
  await expect(dialog.getByText(/Progress is stored on this device/i)).toBeVisible();
  expect(pageErrors, 'The complete lesson flow must not emit unhandled browser errors').toEqual([]);
});
