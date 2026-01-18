"""Test workout execution flow for FitnessTrainer"""

from playwright.sync_api import sync_playwright

def test_workout_flow():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()
        page.set_default_timeout(30000)  # Increase timeout

        try:
            # Step 1: Navigate to the app
            print("[1] Navigating to http://localhost:3001...")
            page.goto('http://localhost:3001', wait_until='domcontentloaded')
            print("   Page loaded (DOM content)")
            print(f"   Current URL: {page.url}")

            # Screenshot 1: Initial page
            page.screenshot(path='screenshots/workout-01-home.png')
            print("   [OK] Screenshot saved: screenshots/workout-01-home.png")

            # Step 2: Check if we need to login
            page.wait_for_timeout(2000)  # Wait for any redirects

            if '/auth/login' in page.url or 'login' in page.url.lower():
                print("\n[2] Login page detected, logging in...")

                # Fill in credentials
                page.fill('input[type="email"]', 'customer.test@evofitmeals.com')
                page.fill('input[type="password"]', 'TestCustomer123!')

                # Screenshot 2: Login form filled
                page.screenshot(path='screenshots/workout-02-login-filled.png')
                print("   [OK] Screenshot saved: screenshots/workout-02-login-filled.png")

                # Click login
                page.click('button[type="submit"]')
                page.wait_for_timeout(3000)

                print(f"   After login URL: {page.url}")
            else:
                print("\n[2] Checking if already logged in...")

            # Screenshot 3: Dashboard page
            page.screenshot(path='screenshots/workout-03-dashboard.png')
            print("   [OK] Screenshot saved: screenshots/workout-03-dashboard.png")

            # Step 3: Try to navigate to workout page
            print("\n[3] Trying to navigate to workout page...")
            page.goto('http://localhost:3001/workout/daily', wait_until='domcontentloaded')
            page.wait_for_timeout(2000)

            print(f"   Current URL: {page.url}")

            # Screenshot 4: Workout page
            page.screenshot(path='screenshots/workout-04-workout-page.png')
            print("   [OK] Screenshot saved: screenshots/workout-04-workout-page.png")

            # Step 4: Look for workout content
            print("\n[4] Checking page content...")
            body_text = page.locator('body').inner_text()
            print(f"   Page text length: {len(body_text)} chars")

            # Look for specific content
            if 'workout' in body_text.lower():
                print("   [OK] Found 'workout' in page content")
            if 'today' in body_text.lower():
                print("   [OK] Found 'today' in page content")
            if 'upper body' in body_text.lower():
                print("   [OK] Found 'upper body' in page content")

        except Exception as e:
            print(f"\n[ERROR] {type(e).__name__}: {e}")
            import traceback
            traceback.print_exc()
            page.screenshot(path='screenshots/workout-error.png')
            print("   [OK] Error screenshot saved: screenshots/workout-error.png")

        finally:
            print("\n[5] Keeping browser open for 10 seconds...")
            page.wait_for_timeout(10000)
            browser.close()

if __name__ == '__main__':
    import os
    os.makedirs('screenshots', exist_ok=True)
    test_workout_flow()
