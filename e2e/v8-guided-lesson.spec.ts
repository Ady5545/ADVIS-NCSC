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

test('V8 guided lesson enforces correct answers, teaches the cycle, and restores the assembly', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.goto('/');
  await expect(page).toHaveTitle(/A\.D\.V\.I\.S\./i);
  await page.getByRole('button', { name: '4-Stroke Engine' }).click();

  const launchLesson = page.getByRole('button', { name: /Guided Lesson/i });
  await expect(launchLesson).toBeVisible();
  await launchLesson.click();

  const dialog = page.getByRole('dialog', { name: 'Guided learning lesson' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('heading', { name: 'Inside a Cross-Plane V8' })).toBeVisible();

  // 1. Meet the engine.
  await expect(dialog.getByRole('heading', { name: 'Meet the engine' })).toBeVisible();
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
