import { test, expect } from '@playwright/test';

test.describe('Core Application Flow: Projects & Kanban', () => {

  test('User can create a new project', async ({ page }) => {
    const uniqueProjectName = `03/21/2026 Test 1 Project ${Date.now()}`;

    await page.goto('/dashboard'); 

    await page.getByRole('button', { name: /create project/i }).first().click();

    await page.getByPlaceholder('e.g., Website Redesign').fill(uniqueProjectName);
    
    await page.locator('form').getByRole('button', { name: 'Create Project', exact: true }).click();

    await expect(page.getByText('Project Created!')).toBeVisible();
    await expect(page.getByText(uniqueProjectName)).toBeVisible();

    await page.locator('button:has-text("Done")').click();
    
    await expect(page.getByText('Project Created!')).toBeHidden();
  });

  test('User can complete a full Task Lifecycle (Create, Move, Comment)', async ({ page }) => {
    const uniqueTaskName = `(E2E) Task Created Test ${Date.now()}`;
    const uniqueComment = `E2E Comment generated at ${Date.now()}`;

    await page.goto('/projects/4b5ffbc0-2872-4278-8410-c4648b6cf99d');

    // --- PHASE 1: CREATE THE TASK ---
    await page.getByRole('button', { name: /add task/i }).first().click();
    await page.getByPlaceholder('e.g. Design homepage mockup').fill(uniqueTaskName);
    
    await page.locator('form').getByRole('button', { name: 'Create Task', exact: true }).click();

    await expect(page.getByText('Task Created!')).toBeVisible();
    
    await page.locator('button:has-text("Done")').click();

    const taskCard = page.getByText(uniqueTaskName, { exact: true });
    await expect(taskCard).toBeVisible();

    // --- PHASE 2: DRAG AND DROP ---
    const targetColumn = page.locator('div').filter({ has: page.getByRole('heading', { name: 'In Progress', exact: true }) }).first();
    
    const sourceBox = await taskCard.boundingBox();
    const targetBox = await targetColumn.boundingBox();

    if (sourceBox && targetBox) {
      // 1. Calculate our starting point (center of the task card)
      const startX = sourceBox.x + sourceBox.width / 2;
      const startY = sourceBox.y + sourceBox.height / 2;
      
      // 2. Calculate our ending point (center of the target column, but keep the Y the same)
      const endX = targetBox.x + targetBox.width / 2;

      // Hover over the card and click down
      await page.mouse.move(startX, startY);
      await page.mouse.down();
      
      await page.mouse.move(startX + 10, startY);
      await page.waitForTimeout(200); 

      await page.mouse.move(endX, startY, { steps: 500 });
      await page.waitForTimeout(200); 
      
      await page.mouse.up();
    }
    
    await page.waitForTimeout(1000); 

    await expect(targetColumn.getByText(uniqueTaskName, { exact: true })).toBeVisible();

    // --- PHASE 3: OPEN AND COMMENT ---
    await page.waitForTimeout(1500); 

    await taskCard.click({ force: true });

    const commentInput = page.getByPlaceholder('Write a comment...');
    await expect(commentInput).toBeVisible({ timeout: 15000 });

    await commentInput.fill(uniqueComment);
    await page.getByRole('button', { name: 'Send comment' }).click();

    await expect(page.getByText(uniqueComment)).toBeVisible();
  });
});