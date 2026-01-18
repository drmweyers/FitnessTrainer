"""Test the Program Creation flow for FitnessTrainer application."""
from playwright.sync_api import sync_playwright
import time
import sys
import io

# Fix encoding for Windows console
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

def main():
    with sync_playwright() as p:
        print("=" * 60)
        print("FitnessTrainer Program Creation Flow Test")
        print("=" * 60)

        # Try with context to handle potential SSL issues
        browser = p.chromium.launch(
            headless=False,
            args=['--disable-web-security', '--disable-features=IsolateOrigins,site-per-process']
        )
        context = browser.new_context(
            viewport={'width': 1280, 'height': 720},
            ignore_https_errors=True
        )
        page = context.new_page()

        # Set longer timeout
        page.set_default_timeout(60000)

        try:
            # Step 1: Navigate to home page
            print("\n[Step 1] Navigating to home page...")
            page.goto('http://localhost:3001', wait_until='domcontentloaded', timeout=60000)
            print("✓ Page loaded (DOM ready)")

            # Wait a bit for Next.js to fully render
            time.sleep(2)

            # Take screenshot of home page
            page.screenshot(path='D:/Claude/FitnessTrainer/screenshots/01-home.png')
            print("✓ Screenshot saved: screenshots/01-home.png")

            # Check current URL and page content
            current_url = page.url
            print(f"Current URL: {current_url}")
            print(f"Page Title: {page.title()}")

            # Check page content for login/redirect
            page_text = page.text_content('body') or ''
            print(f"Page content preview: {page_text[:200]}...")

            # Check if we need to login or if we're already authenticated
            if 'login' in current_url.lower() or 'sign' in page_text.lower()[:500]:
                print("\n[!] Login/Authentication detected")
                print("    This is expected for a protected application")
            else:
                print("\n[✓] No immediate login redirect detected")

            # Step 2: Try to navigate to programs page
            print("\n[Step 2] Navigating to programs page...")
            try:
                page.goto('http://localhost:3001/programs', wait_until='domcontentloaded', timeout=60000)
                time.sleep(2)
                print("✓ Programs page loaded")

                page.screenshot(path='D:/Claude/FitnessTrainer/screenshots/03-programs.png')
                print("✓ Screenshot saved: screenshots/03-programs.png")

                # Look for Create Program button
                buttons = page.locator('button, a').all()
                print(f"\n    Found {len(buttons)} total buttons/links")

                create_btn_found = False
                for i, btn in enumerate(buttons[:20]):  # Check first 20 buttons
                    text = btn.text_content() or ''
                    if 'create' in text.lower() or 'program' in text.lower():
                        print(f"    Button {i}: '{text.strip()}'")
                        if 'create' in text.lower() and 'program' in text.lower():
                            create_btn_found = True

                if create_btn_found:
                    print("\n[✓] Create Program button found!")

                    # Try navigating to /programs/new directly
                    print("\n[Step 3] Navigating to program creation page...")
                    page.goto('http://localhost:3001/programs/new', wait_until='domcontentloaded', timeout=60000)
                    time.sleep(3)
                    print("✓ Navigated to /programs/new")

                    page.screenshot(path='D:/Claude/FitnessTrainer/screenshots/04-program-form.png')
                    print("✓ Screenshot saved: screenshots/04-program-form.png")

                    # Check for form elements
                    inputs = page.locator('input, select, textarea').all()
                    print(f"\n    Found {len(inputs)} form inputs")

                    # Look for program name input
                    name_inputs = page.locator('input[placeholder*="name" i], input[name*="name" i], input[id*="name" i]').all()
                    print(f"    Found {len(name_inputs)} potential name inputs")

                    # Check for step indicators or wizard elements
                    steps = page.locator('[class*="step"], [class*="wizard"], [class*="progress"]').all()
                    print(f"    Found {len(steps)} step/wizard elements")

                    print("\n[✓] SUCCESS: Program creation page is accessible!")
                    print(f"    Final URL: {page.url}")

                else:
                    print("\n[!] Create Program button not clearly found")
                    print("    May need to check authentication first")

            except Exception as e:
                print(f"\n[!] Error navigating to programs: {e}")

        except Exception as e:
            print(f"\n[!] Error: {e}")
            import traceback
            traceback.print_exc()

        # Summary
        print("\n" + "=" * 60)
        print("Test Summary")
        print("=" * 60)
        print(f"Final URL: {page.url}")
        print(f"Page Title: {page.title()}")
        print("\nScreenshots saved to: D:/Claude/FitnessTrainer/screenshots/")
        print("\n[!] Browser staying open for 30 seconds...")
        time.sleep(30)

        browser.close()

if __name__ == '__main__':
    main()
