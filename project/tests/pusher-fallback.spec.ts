import { test, expect } from '@playwright/test';

test.describe('WebSocket Resilience', () => {
  test('falls back to HTTP polling when Pusher is blocked by firewall', async ({ page }) => {
    
    test.setTimeout(75000);
    await page.routeWebSocket(/.*pusher\.com.*/, ws => {
      console.log("WebSocket connection intercepted and killed!");
      ws.close(); 
    });

    // Keep this to block Pusher's sneaky HTTP fallbacks
    await page.route('**/*', (route) => {
      const url = route.request().url();
      if (url.includes('localhost') || url.includes('127.0.0.1')) {
        return route.fallback();
      }

      if (url.toLowerCase().includes('pusher')) {
        return route.abort();
      }
      route.fallback();
    });
    await page.goto('/projects/4478863f-60c2-45c3-bf0c-fbe33f15f858'); 
    const initialLoadPromise = page.waitForResponse(response => 
      response.url().includes('/api/tasks/') && response.status() === 200
    );
    await page.click('text="Test task 1"'); 

    await initialLoadPromise;
    await expect(page.getByPlaceholder('Write a comment...')).toBeVisible();

    console.log("Initial load complete. Waiting 60 seconds for the React Query fallback poll...");
    const pollingRequestPromise = page.waitForRequest(
      (request) => request.url().includes('/api/tasks/') && request.method() === 'GET',
      { timeout: 65000 } 
    );

    const pollingRequest = await pollingRequestPromise;
    
    expect(pollingRequest).toBeTruthy();
    
    await expect(page.getByPlaceholder('Write a comment...')).toBeVisible();
    await expect(page.getByPlaceholder('Write a comment...')).toBeEnabled();
  });
});