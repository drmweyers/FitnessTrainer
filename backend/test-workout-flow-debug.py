"""Debug workout execution flow with console logs"""

from playwright.sync_api import sync_playwright

def test_workout_flow():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context()

        # Capture console logs
        console_messages = []
        def handle_console(msg):
            console_messages.append(f"{msg.type}: {msg.text}")

        page = context.new_page()
        page.on("console", handle_console)
        page.set_default_timeout(30000)

        try:
            print("[1] Navigating to http://localhost:3001/workout/daily...")
            page.goto('http://localhost:3001/workout/daily', wait_until='domcontentloaded')
            page.wait_for_timeout(3000)  # Wait for React to render

            print(f"   Current URL: {page.url}")

            # Screenshot
            page.screenshot(path='screenshots/workout-debug-01.png', full_page=True)

            # Get page content
            body_text = page.locator('body').inner_text()
            print(f"\n   Page text ({len(body_text)} chars):")
            print("   " + body_text[:500])

            # Print console messages
            print("\n[2] Console messages:")
            for msg in console_messages[-20:]:  # Last 20 messages
                print(f"   {msg}")

            # Check for errors in console
            errors = [msg for msg in console_messages if 'error' in msg.lower()]
            if errors:
                print(f"\n   Found {len(errors)} error(s) in console")

        finally:
            page.wait_for_timeout(5000)
            browser.close()

if __name__ == '__main__':
    import os
    os.makedirs('screenshots', exist_ok=True)
    test_workout_flow()
