"""Test client dashboard with DailyWorkoutView"""

from playwright.sync_api import sync_playwright

def test_dashboard():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context()

        console_messages = []
        def handle_console(msg):
            if msg.type in ['error', 'warning']:
                console_messages.append(f"{msg.type}: {msg.text}")

        page = context.new_page()
        page.on("console", handle_console)

        try:
            print("[1] Navigating to login page...")
            page.goto('http://localhost:3001/auth/login', wait_until='domcontentloaded')
            page.wait_for_timeout(2000)

            print("[2] Logging in...")
            page.fill('input[type="email"]', 'customer.test@evofitmeals.com')
            page.fill('input[type="password"]', 'TestCustomer123!')
            page.screenshot(path='screenshots/dashboard-01-login-filled.png')

            page.click('button[type="submit"]')
            page.wait_for_timeout(5000)

            print(f"   After login URL: {page.url}")

            # Navigate to client dashboard
            print("[3] Navigating to client dashboard...")
            page.goto('http://localhost:3001/dashboard/client', wait_until='domcontentloaded')
            page.wait_for_timeout(5000)

            print(f"   Dashboard URL: {page.url}")

            # Take full page screenshot
            page.screenshot(path='screenshots/dashboard-02-full.png', full_page=True)

            # Check for workout content
            body_text = page.locator('body').inner_text()
            print(f"\n[4] Page analysis:")
            print(f"   Page text length: {len(body_text)} chars")

            if 'upper body' in body_text.lower():
                print("   [OK] Found 'upper body' in page")
            if 'bench press' in body_text.lower():
                print("   [OK] Found 'bench press' in page")
            if 'start workout' in body_text.lower():
                print("   [OK] Found 'start workout' button")

            # Console errors
            if console_messages:
                print(f"\n[5] Console issues ({len(console_messages)}):")
                for msg in console_messages[-10:]:
                    print(f"   {msg}")

        except Exception as e:
            print(f"\n[ERROR] {type(e).__name__}: {e}")
            import traceback
            traceback.print_exc()
            page.screenshot(path='screenshots/dashboard-error.png')

        finally:
            print("\n[6] Keeping browser open for 5 seconds...")
            page.wait_for_timeout(5000)
            browser.close()

if __name__ == '__main__':
    import os
    os.makedirs('screenshots', exist_ok=True)
    test_dashboard()
