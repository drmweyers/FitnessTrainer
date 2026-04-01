/**
 * Forms E2E Tests
 *
 * Comprehensive Playwright E2E tests for all forms in the application.
 * Tests cover validation, submission, and error handling.
 */

import { test, expect } from '@playwright/test';
import { loginAsTrainer, loginAsClient } from '../helpers/auth';

test.describe('Login Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
  });

  test('renders with all expected fields', async ({ page }) => {
    await expect(page.locator('h2')).toContainText('Sign in to your account');
    await expect(page.locator('input#email')).toBeVisible();
    await expect(page.locator('input#password')).toBeVisible();
    await expect(page.locator('input#remember-me')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toContainText('Sign in');
    await expect(page.locator('a[href="/auth/forgot-password"]')).toBeVisible();
  });

  test('shows required field validation for empty submission', async ({ page }) => {
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Email is required')).toBeVisible();
    await expect(page.locator('text=Password is required')).toBeVisible();
  });

  test('validates email format', async ({ page }) => {
    await page.fill('input#email', 'invalid-email');
    await page.fill('input#password', 'password123');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Please enter a valid email address')).toBeVisible();
  });

  test('validates password minimum length', async ({ page }) => {
    await page.fill('input#email', 'test@example.com');
    await page.fill('input#password', '12345');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Password must be at least 6 characters')).toBeVisible();
  });

  test('toggles password visibility', async ({ page }) => {
    const passwordInput = page.locator('input#password');
    await expect(passwordInput).toHaveAttribute('type', 'password');

    await page.click('button[type="button"]:has(.lucide-eye)');
    await expect(passwordInput).toHaveAttribute('type', 'text');

    await page.click('button[type="button"]:has(.lucide-eye-off)');
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('successful login redirects to dashboard', async ({ page }) => {
    await page.fill('input#email', 'coach.sarah@evofittrainer.com');
    await page.fill('input#password', 'Demo1234!');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('shows error for invalid credentials', async ({ page }) => {
    await page.fill('input#email', 'wrong@example.com');
    await page.fill('input#password', 'wrongpassword');
    await page.click('button[type="submit"]');

    await expect(page.locator('.bg-red-50')).toContainText(/Invalid|error/i);
  });

  test('remember me checkbox works', async ({ page }) => {
    const rememberMe = page.locator('input#remember-me');
    await expect(rememberMe).not.toBeChecked();

    await rememberMe.check();
    await expect(rememberMe).toBeChecked();
  });
});

test.describe('Registration Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/register');
  });

  test('renders with all expected fields', async ({ page }) => {
    await expect(page.locator('h2')).toContainText('Create your account');
    await expect(page.locator('input#firstName')).toBeVisible();
    await expect(page.locator('input#lastName')).toBeVisible();
    await expect(page.locator('input#email')).toBeVisible();
    await expect(page.locator('input#password')).toBeVisible();
    await expect(page.locator('input#confirmPassword')).toBeVisible();
    await expect(page.locator('input#agreeToTerms')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toContainText('Create account');
  });

  test('shows required field validation for empty submission', async ({ page }) => {
    await page.click('button[type="submit"]');

    await expect(page.locator('text=First name is required')).toBeVisible();
    await expect(page.locator('text=Last name is required')).toBeVisible();
    await expect(page.locator('text=Email is required')).toBeVisible();
    await expect(page.locator('text=Password is required')).toBeVisible();
    await expect(page.locator('text=Please confirm your password')).toBeVisible();
    await expect(page.locator('text=You must agree to the Terms of Service')).toBeVisible();
  });

  test('validates email format', async ({ page }) => {
    await page.fill('input#email', 'invalid-email');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Please enter a valid email address')).toBeVisible();
  });

  test('validates password requirements', async ({ page }) => {
    await page.fill('input#password', 'short');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Password must be at least 8 characters')).toBeVisible();

    await page.fill('input#password', 'lowercase123');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Must contain uppercase, lowercase, and a number')).toBeVisible();
  });

  test('validates password confirmation match', async ({ page }) => {
    await page.fill('input#password', 'ValidPass123');
    await page.fill('input#confirmPassword', 'DifferentPass123');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Passwords do not match')).toBeVisible();
  });

  test('role selection works', async ({ page }) => {
    const clientButton = page.locator('button:has-text("Client")');
    const trainerButton = page.locator('button:has-text("Trainer")');

    await expect(clientButton).toHaveClass(/ring-2/);
    await trainerButton.click();
    await expect(trainerButton).toHaveClass(/ring-2/);
  });

  test('terms checkbox validation', async ({ page }) => {
    await page.fill('input#firstName', 'John');
    await page.fill('input#lastName', 'Doe');
    await page.fill('input#email', 'john@example.com');
    await page.fill('input#password', 'ValidPass123');
    await page.fill('input#confirmPassword', 'ValidPass123');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=You must agree to the Terms of Service')).toBeVisible();
  });

  test('successful registration flow', async ({ page }) => {
    const timestamp = Date.now();
    await page.fill('input#firstName', 'Test');
    await page.fill('input#lastName', 'User');
    await page.fill('input#email', `test${timestamp}@example.com`);
    await page.fill('input#password', 'ValidPass123');
    await page.fill('input#confirmPassword', 'ValidPass123');
    await page.check('input#agreeToTerms');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await expect(page).toHaveURL(/\/dashboard/);
  });
});

test.describe('Forgot Password Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/forgot-password');
  });

  test('renders with email field', async ({ page }) => {
    await expect(page.locator('h2')).toContainText('Reset your password');
    await expect(page.locator('input#email')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toContainText('Send reset instructions');
  });

  test('validates email is required', async ({ page }) => {
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Email is required')).toBeVisible();
  });

  test('validates email format', async ({ page }) => {
    await page.fill('input#email', 'invalid-email');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Please enter a valid email address')).toBeVisible();
  });

  test('shows success state after submission', async ({ page }) => {
    await page.fill('input#email', 'test@example.com');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Check your email')).toBeVisible();
    await expect(page.locator('text=If an account exists')).toBeVisible();
  });

  test('back to sign in link works', async ({ page }) => {
    await page.click('a[href="/auth/login"]');
    await page.waitForURL('**/auth/login');
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});

test.describe('Reset Password Form', () => {
  test('shows invalid token state without token', async ({ page }) => {
    await page.goto('/auth/reset-password');

    await expect(page.locator('text=Invalid reset link')).toBeVisible();
    await expect(page.locator('text=This password reset link is invalid')).toBeVisible();
  });

  test('renders form with valid token', async ({ page }) => {
    await page.goto('/auth/reset-password?token=valid-token-example');

    await expect(page.locator('h2')).toContainText('Set new password');
    await expect(page.locator('input#password')).toBeVisible();
    await expect(page.locator('input#confirmPassword')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toContainText('Reset password');
  });

  test('validates password requirements', async ({ page }) => {
    await page.goto('/auth/reset-password?token=valid-token');

    await page.fill('input#password', 'short');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Password must be at least 8 characters')).toBeVisible();
  });

  test('validates password confirmation match', async ({ page }) => {
    await page.goto('/auth/reset-password?token=valid-token');

    await page.fill('input#password', 'ValidPass123');
    await page.fill('input#confirmPassword', 'DifferentPass123');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Passwords do not match')).toBeVisible();
  });

  test('shows password requirements checklist', async ({ page }) => {
    await page.goto('/auth/reset-password?token=valid-token');

    await expect(page.locator('text=At least 8 characters')).toBeVisible();
    await expect(page.locator('text=One uppercase letter')).toBeVisible();
    await expect(page.locator('text=One lowercase letter')).toBeVisible();
    await expect(page.locator('text=One number')).toBeVisible();
  });

  test('toggles password visibility', async ({ page }) => {
    await page.goto('/auth/reset-password?token=valid-token');

    const passwordInput = page.locator('input#password');
    await expect(passwordInput).toHaveAttribute('type', 'password');

    await page.click('button[type="button"]:has(.lucide-eye)');
    await expect(passwordInput).toHaveAttribute('type', 'text');
  });
});

test.describe('Profile Edit Form', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTrainer(page);
    await page.goto('/profile/edit');
  });

  test('renders with all expected fields', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Edit Profile');
    await expect(page.locator('textarea#bio')).toBeVisible();
    await expect(page.locator('input#dateOfBirth')).toBeVisible();
    await expect(page.locator('select#gender')).toBeVisible();
    await expect(page.locator('input#phone')).toBeVisible();
    await expect(page.locator('select#timezone')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toContainText('Save Changes');
  });

  test('updates bio field', async ({ page }) => {
    await page.fill('textarea#bio', 'This is my test bio');
    await expect(page.locator('textarea#bio')).toHaveValue('This is my test bio');
  });

  test('date of birth field accepts valid date', async ({ page }) => {
    await page.fill('input#dateOfBirth', '1990-01-15');
    await expect(page.locator('input#dateOfBirth')).toHaveValue('1990-01-15');
  });

  test('gender select has all options', async ({ page }) => {
    const options = page.locator('select#gender option');
    await expect(options).toHaveCount(5);
    await expect(page.locator('select#gender')).toContainText('Select gender');
    await expect(page.locator('select#gender')).toContainText('Male');
    await expect(page.locator('select#gender')).toContainText('Female');
    await expect(page.locator('select#gender')).toContainText('Non-binary');
    await expect(page.locator('select#gender')).toContainText('Prefer not to say');
  });

  test('phone field accepts input', async ({ page }) => {
    await page.fill('input#phone', '+1 (555) 123-4567');
    await expect(page.locator('input#phone')).toHaveValue('+1 (555) 123-4567');
  });

  test('timezone select has options', async ({ page }) => {
    const options = page.locator('select#timezone option');
    await expect(options).toHaveCount(15);
  });

  test('preferred units radio buttons work', async ({ page }) => {
    const metricRadio = page.locator('input[name="preferredUnits"][value="metric"]');
    const imperialRadio = page.locator('input[name="preferredUnits"][value="imperial"]');

    await expect(metricRadio).toBeChecked();
    await imperialRadio.check();
    await expect(imperialRadio).toBeChecked();
  });

  test('profile visibility checkbox works', async ({ page }) => {
    const checkbox = page.locator('input[type="checkbox"]:has(~ span:has-text("Make profile public"))');
    await checkbox.uncheck();
    await expect(checkbox).not.toBeChecked();
    await checkbox.check();
    await expect(checkbox).toBeChecked();
  });

  test('cancel button navigates back to profile', async ({ page }) => {
    await page.click('button[type="button"]:has-text("Cancel")');
    await page.waitForURL('**/profile');
    await expect(page).toHaveURL(/\/profile$/);
  });

  test('shows success message after save', async ({ page }) => {
    await page.fill('textarea#bio', 'Updated bio for testing');
    await page.click('button[type="submit"]');

    await expect(page.locator('.bg-green-50')).toContainText('Profile updated successfully');
  });
});

test.describe('Client Form (Modal)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTrainer(page);
    await page.goto('/clients');
  });

  test('opens client form modal', async ({ page }) => {
    await page.click('button:has-text("Add Client")');

    await expect(page.locator('text=Add New Client')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('validates email is required', async ({ page }) => {
    await page.click('button:has-text("Add Client")');
    await page.click('button:has-text("Create Client")');

    await expect(page.locator('text=Email is required')).toBeVisible();
  });

  test('tabs navigation works', async ({ page }) => {
    await page.click('button:has-text("Add Client")');

    await expect(page.locator('button:has-text("Basic Info")')).toHaveClass(/border-blue-500/);

    await page.click('button:has-text("Goals")');
    await expect(page.locator('button:has-text("Goals")')).toHaveClass(/border-blue-500/);

    await page.click('button:has-text("Health")');
    await expect(page.locator('button:has-text("Health")')).toHaveClass(/border-blue-500/);

    await page.click('button:has-text("Emergency")');
    await expect(page.locator('button:has-text("Emergency")')).toHaveClass(/border-blue-500/);
  });

  test('fitness level select works', async ({ page }) => {
    await page.click('button:has-text("Add Client")');

    const select = page.locator('select').first();
    await select.selectOption('INTERMEDIATE');
    await expect(select).toHaveValue('INTERMEDIATE');
  });

  test('workout days checkboxes work', async ({ page }) => {
    await page.click('button:has-text("Add Client")');

    const mondayCheckbox = page.locator('label:has-text("Mon") input[type="checkbox"]');
    await mondayCheckbox.check();
    await expect(mondayCheckbox).toBeChecked();
  });

  test('session duration select works', async ({ page }) => {
    await page.click('button:has-text("Add Client")');

    const durationSelect = page.locator('select').nth(1);
    await durationSelect.selectOption('45');
    await expect(durationSelect).toHaveValue('45');
  });

  test('cancel button closes modal', async ({ page }) => {
    await page.click('button:has-text("Add Client")');
    await page.click('button:has-text("Cancel")');

    await expect(page.locator('text=Add New Client')).not.toBeVisible();
  });
});

test.describe('Client Invite Form', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTrainer(page);
    await page.goto('/clients');
  });

  test('opens invite form modal', async ({ page }) => {
    await page.click('button:has-text("Invite")');

    await expect(page.locator('text=Invite New Client')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('validates email is required', async ({ page }) => {
    await page.click('button:has-text("Invite")');
    await page.click('button:has-text("Send Invitation")');

    await expect(page.locator('text=Email address is required')).toBeVisible();
  });

  test('validates email format', async ({ page }) => {
    await page.click('button:has-text("Invite")');
    await page.fill('input[type="email"]', 'invalid-email');
    await page.click('button:has-text("Send Invitation")');

    await expect(page.locator('text=Please enter a valid email address')).toBeVisible();
  });

  test('custom message textarea works', async ({ page }) => {
    await page.click('button:has-text("Invite")');

    const textarea = page.locator('textarea');
    await textarea.fill('Hello! Join my training program.');
    await expect(textarea).toHaveValue('Hello! Join my training program.');
  });

  test('character count shows for message', async ({ page }) => {
    await page.click('button:has-text("Invite")');

    const textarea = page.locator('textarea');
    await textarea.fill('Test message');

    await expect(page.locator('text=/\\d+/500')).toBeVisible();
  });

  test('preview button shows email preview', async ({ page }) => {
    await page.click('button:has-text("Invite")');
    await page.fill('input[type="email"]', 'client@example.com');
    await page.click('button:has-text("Preview Invitation")');

    await expect(page.locator('text=Email Preview')).toBeVisible();
    await expect(page.locator('text=client@example.com')).toBeVisible();
  });

  test('cancel button closes modal', async ({ page }) => {
    await page.click('button:has-text("Invite")');
    await page.click('button:has-text("Cancel")');

    await expect(page.locator('text=Invite New Client')).not.toBeVisible();
  });
});

test.describe('Program Form', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTrainer(page);
    await page.goto('/programs/new');
  });

  test('renders program creation form', async ({ page }) => {
    await expect(page.locator('text=Program Information')).toBeVisible();
    await expect(page.locator('input#name')).toBeVisible();
    await expect(page.locator('textarea#description')).toBeVisible();
    await expect(page.locator('select#programType')).toBeVisible();
  });

  test('validates program name is required', async ({ page }) => {
    await page.click('button:has-text("Next Step")');
    await expect(page.locator('text=Program name is required')).toBeVisible();
  });

  test('validates program type is required', async ({ page }) => {
    await page.click('button:has-text("Next Step")');
    await expect(page.locator('text=Program type is required')).toBeVisible();
  });

  test('validates difficulty level is required', async ({ page }) => {
    await page.click('button:has-text("Next Step")');
    await expect(page.locator('text=Difficulty level is required')).toBeVisible();
  });

  test('program type select has options', async ({ page }) => {
    const options = page.locator('select#programType option');
    await expect(options).toHaveCount(16);
    await expect(page.locator('select#programType')).toContainText('Strength Training');
    await expect(page.locator('select#programType')).toContainText('Muscle Building');
  });

  test('difficulty level radio buttons work', async ({ page }) => {
    const beginnerRadio = page.locator('input[name="difficultyLevel"][value="beginner"]');
    const intermediateRadio = page.locator('input[name="difficultyLevel"][value="intermediate"]');
    const advancedRadio = page.locator('input[name="difficultyLevel"][value="advanced"]');

    await intermediateRadio.check();
    await expect(intermediateRadio).toBeChecked();

    await advancedRadio.check();
    await expect(advancedRadio).toBeChecked();
  });

  test('duration slider and number input sync', async ({ page }) => {
    const numberInput = page.locator('input#duration-number');

    await numberInput.fill('12');
    await expect(numberInput).toHaveValue('12');

    const rangeInput = page.locator('input#duration-range');
    await rangeInput.fill('8');
    await expect(numberInput).toHaveValue('8');
  });

  test('goals can be added and removed', async ({ page }) => {
    const goalInput = page.locator('input#goal-input');
    await goalInput.fill('Build Strength');
    await goalInput.press('Enter');

    await expect(page.locator('text=Build Strength')).toBeVisible();

    await page.click('button[aria-label="Remove Build Strength"]');
    await expect(page.locator('text=Build Strength')).not.toBeVisible();
  });

  test('common goals can be selected', async ({ page }) => {
    await page.click('button:has-text("+ Build Strength")');
    await expect(page.locator('text=Build Strength')).toBeVisible();
  });

  test('equipment checkboxes work', async ({ page }) => {
    const barbellLabel = page.locator('label:has-text("Barbell")');
    await barbellLabel.click();

    const checkbox = barbellLabel.locator('input[type="checkbox"]');
    await expect(checkbox).toBeChecked();
  });
});

test.describe('Contact/Support Form', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsClient(page);
    await page.goto('/support');
  });

  test('renders contact form', async ({ page }) => {
    await expect(page.locator('text=Contact Support')).toBeVisible();
    await expect(page.locator('input#subject')).toBeVisible();
    await expect(page.locator('textarea#message')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toContainText('Send Ticket');
  });

  test('validates subject is required', async ({ page }) => {
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Subject is required')).toBeVisible();
  });

  test('validates message is required', async ({ page }) => {
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Message is required')).toBeVisible();
  });

  test('subject field accepts input', async ({ page }) => {
    await page.fill('input#subject', 'Test Support Subject');
    await expect(page.locator('input#subject')).toHaveValue('Test Support Subject');
  });

  test('message textarea accepts input', async ({ page }) => {
    await page.fill('textarea#message', 'This is a detailed message about my issue.');
    await expect(page.locator('textarea#message')).toHaveValue('This is a detailed message about my issue.');
  });

  test('shows success state after submission', async ({ page }) => {
    await page.fill('input#subject', 'Test Subject');
    await page.fill('textarea#message', 'Test message content');

    await page.route('**/api/support/tickets', async route => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ success: true }),
      });
    });

    await page.click('button[type="submit"]');

    await expect(page.locator('text=Ticket Submitted!')).toBeVisible();
    await expect(page.locator('text=Submit another ticket')).toBeVisible();
  });

  test('submit another ticket button resets form', async ({ page }) => {
    await page.fill('input#subject', 'Test Subject');
    await page.fill('textarea#message', 'Test message');

    await page.route('**/api/support/tickets', async route => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ success: true }),
      });
    });

    await page.click('button[type="submit"]');
    await page.click('button:has-text("Submit another ticket")');

    await expect(page.locator('input#subject')).toHaveValue('');
    await expect(page.locator('textarea#message')).toHaveValue('');
  });
});

test.describe('Group Class Form', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTrainer(page);
    await page.goto('/schedule');
  });

  test('opens group class form', async ({ page }) => {
    await page.click('button:has-text("Create Group Class")');

    await expect(page.locator('text=Group Class Details')).toBeVisible();
    await expect(page.locator('input#class-name')).toBeVisible();
    await expect(page.locator('input#max-participants')).toBeVisible();
  });

  test('validates class name is required', async ({ page }) => {
    await page.click('button:has-text("Create Group Class")');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Class name is required')).toBeVisible();
  });

  test('validates max participants is required', async ({ page }) => {
    await page.click('button:has-text("Create Group Class")');
    await page.fill('input#class-name', 'Yoga Class');
    await page.fill('input#max-participants', '0');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Must have at least 1 participant')).toBeVisible();
  });

  test('class name field accepts input', async ({ page }) => {
    await page.click('button:has-text("Create Group Class")');
    await page.fill('input#class-name', 'Morning Yoga');
    await expect(page.locator('input#class-name')).toHaveValue('Morning Yoga');
  });

  test('max participants field accepts number', async ({ page }) => {
    await page.click('button:has-text("Create Group Class")');
    await page.fill('input#max-participants', '20');
    await expect(page.locator('input#max-participants')).toHaveValue('20');
  });

  test('open for registration toggle works', async ({ page }) => {
    await page.click('button:has-text("Create Group Class")');

    const toggle = page.locator('input#open-registration');
    await expect(toggle).not.toBeChecked();

    await toggle.check();
    await expect(toggle).toBeChecked();
  });

  test('cancel button closes form', async ({ page }) => {
    await page.click('button:has-text("Create Group Class")');
    await page.click('button:has-text("Cancel")');

    await expect(page.locator('text=Group Class Details')).not.toBeVisible();
  });
});

test.describe('Certification Form (Trainer Profile)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTrainer(page);
    await page.goto('/profile/edit');
  });

  test('renders certification section for trainers', async ({ page }) => {
    await expect(page.locator('text=Certifications')).toBeVisible();
    await expect(page.locator('input#certName')).toBeVisible();
    await expect(page.locator('input#certOrg')).toBeVisible();
  });

  test('validates certification name is required', async ({ page }) => {
    const addButton = page.locator('button:has-text("Add Certification")');
    await expect(addButton).toBeDisabled();

    await page.fill('input#certOrg', 'NASM');
    await expect(addButton).toBeDisabled();
  });

  test('validates issuing organization is required', async ({ page }) => {
    const addButton = page.locator('button:has-text("Add Certification")');
    await page.fill('input#certName', 'CPT');
    await expect(addButton).toBeDisabled();
  });

  test('certification form accepts all fields', async ({ page }) => {
    await page.fill('input#certName', 'NASM-CPT');
    await page.fill('input#certOrg', 'NASM');
    await page.fill('input#credentialId', 'CERT-12345');
    await page.fill('input#certIssueDate', '2020-01-15');
    await page.fill('input#certExpiryDate', '2025-01-15');

    await expect(page.locator('input#certName')).toHaveValue('NASM-CPT');
    await expect(page.locator('input#certOrg')).toHaveValue('NASM');
    await expect(page.locator('input#credentialId')).toHaveValue('CERT-12345');
    await expect(page.locator('input#certIssueDate')).toHaveValue('2020-01-15');
    await expect(page.locator('input#certExpiryDate')).toHaveValue('2025-01-15');
  });
});

test.describe('Emergency Contact Form', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsClient(page);
    await page.goto('/profile/edit');
  });

  test('renders emergency contact section', async ({ page }) => {
    await expect(page.locator('text=Emergency Contact')).toBeVisible();
    await expect(page.locator('input#emergencyName')).toBeVisible();
    await expect(page.locator('input#emergencyPhone')).toBeVisible();
    await expect(page.locator('input#emergencyRelationship')).toBeVisible();
  });

  test('emergency contact fields accept input', async ({ page }) => {
    await page.fill('input#emergencyName', 'John Doe');
    await page.fill('input#emergencyPhone', '+1 (555) 123-4567');
    await page.fill('input#emergencyRelationship', 'Spouse');

    await expect(page.locator('input#emergencyName')).toHaveValue('John Doe');
    await expect(page.locator('input#emergencyPhone')).toHaveValue('+1 (555) 123-4567');
    await expect(page.locator('input#emergencyRelationship')).toHaveValue('Spouse');
  });
});

test.describe('Form Accessibility', () => {
  test('login form has proper labels', async ({ page }) => {
    await page.goto('/auth/login');

    await expect(page.locator('label[for="email"]')).toBeVisible();
    await expect(page.locator('label[for="password"]')).toBeVisible();
    await expect(page.locator('label[for="remember-me"]')).toBeVisible();
  });

  test('registration form has proper labels', async ({ page }) => {
    await page.goto('/auth/register');

    await expect(page.locator('label[for="firstName"]')).toBeVisible();
    await expect(page.locator('label[for="lastName"]')).toBeVisible();
    await expect(page.locator('label[for="email"]')).toBeVisible();
    await expect(page.locator('label[for="password"]')).toBeVisible();
    await expect(page.locator('label[for="confirmPassword"]')).toBeVisible();
  });

  test('forms have proper focus indicators', async ({ page }) => {
    await page.goto('/auth/login');

    const emailInput = page.locator('input#email');
    await emailInput.focus();
    await expect(emailInput).toBeFocused();
  });

  test('forms support keyboard navigation', async ({ page }) => {
    await page.goto('/auth/login');

    await page.keyboard.press('Tab');
    await expect(page.locator('input#email')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.locator('input#password')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.locator('input#remember-me')).toBeFocused();
  });
});

test.describe('Form Error Handling', () => {
  test('login shows error for network failure', async ({ page }) => {
    await page.goto('/auth/login');

    await page.route('**/api/auth/login', async route => {
      await route.abort('failed');
    });

    await page.fill('input#email', 'test@example.com');
    await page.fill('input#password', 'password123');
    await page.click('button[type="submit"]');

    await expect(page.locator('.bg-red-50')).toContainText(/error|network/i);
  });

  test('registration shows error for existing email', async ({ page }) => {
    await page.goto('/auth/register');

    await page.route('**/api/auth/register', async route => {
      await route.fulfill({
        status: 409,
        body: JSON.stringify({ error: 'Email already registered' }),
      });
    });

    await page.fill('input#firstName', 'Test');
    await page.fill('input#lastName', 'User');
    await page.fill('input#email', 'existing@example.com');
    await page.fill('input#password', 'ValidPass123');
    await page.fill('input#confirmPassword', 'ValidPass123');
    await page.check('input#agreeToTerms');
    await page.click('button[type="submit"]');

    await expect(page.locator('.bg-red-50')).toContainText(/already registered|error/i);
  });

  test('profile edit shows error on save failure', async ({ page }) => {
    await loginAsTrainer(page);
    await page.goto('/profile/edit');

    await page.route('**/api/profiles/me', async route => {
      await route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Failed to update profile' }),
      });
    });

    await page.fill('textarea#bio', 'Test bio');
    await page.click('button[type="submit"]');

    await expect(page.locator('.bg-red-50')).toContainText(/Failed to update/i);
  });
});
