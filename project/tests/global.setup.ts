import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  const { baseURL, storageState } = config.projects[0].use;
  
  // Launch a temporary browser for the setup phase
  const browser = await chromium.launch();
  const page = await browser.newPage();

  console.log('Authenticating test user with Clerk...');

  try {
    await page.goto(`${baseURL}/sign-in`);

    // 1. Fill Email
    await page.getByLabel('Email address').fill(process.env.TEST_USER_EMAIL!);
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    
    // 2. Fill Password
    await page.getByLabel('Password', { exact: true }).fill(process.env.TEST_USER_PASSWORD!);

    const responsePromise = page.waitForResponse(response => 
      response.url().includes('/v1/client/sign_ins') && response.status() === 200
    );
    
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await responsePromise; 

    // ✨ DIAGNOSTIC FIX: Wait a solid 3 seconds for Clerk's internal JavaScript to process
    await page.waitForTimeout(3000);

    // ✨ Check exactly what cookies Clerk actually wrote to the browser
    const cookies = await page.context().cookies();
    const cookieNames = cookies.map(c => c.name);
    console.log("Cookies currently in browser:", cookieNames);

    if (!cookieNames.includes('__session') && !cookieNames.includes('__client_uat')) {
      console.log("⚠️ WARNING: Clerk did not write the session cookie. Bot protection is likely active.");
    }

    // Force jump to the dashboard
    await page.goto(`${baseURL}/dashboard`);

    // Wait for the dashboard UI 
    await page.waitForSelector('h1:has-text("Dashboard Overview")', { timeout: 15000 });

    // Save the cookies and localStorage to the state file
    await page.context().storageState({ path: storageState as string });
    
    console.log('Authentication successful. State saved.');
  } catch (error) {
    console.error('Failed to authenticate test user. Check credentials.', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;