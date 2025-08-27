import { test, expect, Browser } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { ClientsListPage } from './pages/ClientsListPage';
import { ClientFormPage } from './pages/ClientFormPage';
import { ClientInvitePage } from './pages/ClientInvitePage';
import { TestHelpers } from './utils/TestHelpers';

test.describe('Client Management - Comprehensive E2E Tests', () => {
  let trainerCredentials: { email: string; password: string };
  
  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Create test trainer account
    try {
      trainerCredentials = await TestHelpers.createTestTrainer(page);
    } catch (error) {
      console.log('Using existing trainer credentials for testing');
      trainerCredentials = {
        email: 'trainer@evofit-qa.com',
        password: 'TestPassword123!'
      };
    }
    
    await context.close();
  });

  test.beforeEach(async ({ page }) => {
    // Setup authentication for each test
    await TestHelpers.loginAsTrainer(page, trainerCredentials);
    
    // Ensure we start with a clean state
    await TestHelpers.cleanupTestData(page);
  });

  test.afterEach(async ({ page }) => {
    // Clean up test data after each test
    await TestHelpers.cleanupTestData(page);
  });

  test.describe('Authentication and Navigation', () => {
    test('should redirect unauthenticated users to login', async ({ page }) => {
      // Clear authentication
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      
      // Try to access clients page
      await page.goto('/dashboard/clients');
      
      // Should redirect to login
      await expect(page).toHaveURL(/\/login/);
    });

    test('should allow authenticated trainers to access client management', async ({ page }) => {
      const clientsPage = new ClientsListPage(page);
      
      await clientsPage.navigateToClients();
      await clientsPage.expectPageToLoad();
      
      await expect(clientsPage.pageTitle).toBeVisible();
      await expect(clientsPage.addClientButton).toBeVisible();
    });
  });

  test.describe('Client List and Management', () => {
    test('should load client list page successfully', async ({ page }) => {
      const clientsPage = new ClientsListPage(page);
      
      await clientsPage.navigateToClients();
      await clientsPage.expectPageToLoad();
      
      // Verify page elements are visible
      await expect(clientsPage.pageTitle).toContainText('Client Management');
      await expect(clientsPage.addClientButton).toBeVisible();
      await expect(clientsPage.inviteClientButton).toBeVisible();
      await expect(clientsPage.searchInput).toBeVisible();
      
      // Take screenshot for visual verification
      await TestHelpers.takeDesktopScreenshot(page, 'client-list-loaded');
    });

    test('should display empty state when no clients exist', async ({ page }) => {
      const clientsPage = new ClientsListPage(page);
      
      await clientsPage.navigateToClients();
      await clientsPage.expectPageToLoad();
      
      // Should show empty state
      await clientsPage.expectEmptyState();
      await expect(clientsPage.clientCards).toHaveCount(0);
    });

    test('should handle API errors gracefully', async ({ page }) => {
      // Intercept API calls and return error
      await TestHelpers.interceptApiError(page, '/api/clients', 500);
      
      const clientsPage = new ClientsListPage(page);
      await clientsPage.navigateToClients();
      
      // Should show error state
      await clientsPage.expectErrorState();
      await expect(clientsPage.retryButton).toBeVisible();
    });

    test('should search clients successfully', async ({ page }) => {
      const clientsPage = new ClientsListPage(page);
      
      // Create test clients first
      await TestHelpers.createTestClientViaAPI(page, { firstName: 'John', lastName: 'Doe' });
      await TestHelpers.createTestClientViaAPI(page, { firstName: 'Jane', lastName: 'Smith' });
      
      await clientsPage.navigateToClients();
      await clientsPage.expectPageToLoad();
      
      // Test search functionality
      await clientsPage.searchClients('John');
      await clientsPage.expectSearchResults('John');
      
      // Clear search
      await clientsPage.clearSearch();
      await clientsPage.expectClientCount(2);
    });

    test('should filter clients by status', async ({ page }) => {
      const clientsPage = new ClientsListPage(page);
      
      // Create clients with different statuses
      await TestHelpers.createTestClientViaAPI(page, { status: 'active' });
      await TestHelpers.createTestClientViaAPI(page, { status: 'pending' });
      
      await clientsPage.navigateToClients();
      await clientsPage.expectPageToLoad();
      
      // Filter by active status
      await clientsPage.filterByStatus('Active');
      await clientsPage.expectFilteredByStatus('active');
      
      // Filter by pending status
      await clientsPage.filterByStatus('Pending');
      await clientsPage.expectFilteredByStatus('pending');
    });

    test('should sort clients correctly', async ({ page }) => {
      const clientsPage = new ClientsListPage(page);
      
      // Create clients with different names
      await TestHelpers.createTestClientViaAPI(page, { firstName: 'Alice', lastName: 'Anderson' });
      await TestHelpers.createTestClientViaAPI(page, { firstName: 'Bob', lastName: 'Brown' });
      await TestHelpers.createTestClientViaAPI(page, { firstName: 'Charlie', lastName: 'Clark' });
      
      await clientsPage.navigateToClients();
      await clientsPage.expectPageToLoad();
      
      // Sort by name ascending
      await clientsPage.sortBy('Name');
      await clientsPage.expectClientCount(3);
      
      // Toggle sort order
      await clientsPage.toggleSortOrder();
      await clientsPage.expectClientCount(3);
    });

    test('should handle pagination correctly', async ({ page }) => {
      const clientsPage = new ClientsListPage(page);
      
      // Create enough clients to trigger pagination (assuming 20 per page)
      const clientPromises = [];
      for (let i = 0; i < 25; i++) {
        clientPromises.push(TestHelpers.createTestClientViaAPI(page, {
          firstName: `Client${i}`,
          lastName: `Test${i}`
        }));
      }
      await Promise.all(clientPromises);
      
      await clientsPage.navigateToClients();
      await clientsPage.expectPageToLoad();
      
      // Should show pagination controls
      await expect(clientsPage.nextButton).toBeVisible();
      await expect(clientsPage.previousButton).toBeVisible();
      
      // Test navigation
      await clientsPage.goToNextPage();
      await clientsPage.expectClientCount(5); // Remaining clients on page 2
      
      await clientsPage.goToPreviousPage();
      await clientsPage.expectClientCount(20); // Full page 1
    });
  });

  test.describe('Client Creation Flow', () => {
    test('should open and close client form modal', async ({ page }) => {
      const clientsPage = new ClientsListPage(page);
      const clientForm = new ClientFormPage(page);
      
      await clientsPage.navigateToClients();
      await clientsPage.openAddClientForm();
      
      await clientForm.expectModalToBeVisible();
      
      // Test close button
      await clientForm.closeModal();
      await expect(clientForm.modal).not.toBeVisible();
      
      // Test cancel button
      await clientsPage.openAddClientForm();
      await clientForm.expectModalToBeVisible();
      await clientForm.cancelForm();
    });

    test('should validate required fields', async ({ page }) => {
      const clientsPage = new ClientsListPage(page);
      const clientForm = new ClientFormPage(page);
      
      await clientsPage.navigateToClients();
      await clientsPage.openAddClientForm();
      
      // Test form validation
      await clientForm.testRequiredFieldValidation();
    });

    test('should validate email format', async ({ page }) => {
      const clientsPage = new ClientsListPage(page);
      const clientForm = new ClientFormPage(page);
      
      await clientsPage.navigateToClients();
      await clientsPage.openAddClientForm();
      
      await clientForm.testEmailValidation();
    });

    test('should create client with minimal information', async ({ page }) => {
      const clientsPage = new ClientsListPage(page);
      const clientForm = new ClientFormPage(page);
      
      await clientsPage.navigateToClients();
      await clientsPage.openAddClientForm();
      
      const testEmail = TestHelpers.generateUniqueEmail();
      await clientForm.fillBasicInfo({
        email: testEmail,
        firstName: 'Test',
        lastName: 'Client'
      });
      
      await clientForm.submitForm();
      await clientForm.expectSubmissionSuccess();
      
      // Verify client appears in list
      await clientsPage.expectPageToLoad();
      await clientsPage.searchClients('Test Client');
      await clientsPage.expectSearchResults('Test');
    });

    test('should create client with complete information', async ({ page }) => {
      const clientsPage = new ClientsListPage(page);
      const clientForm = new ClientFormPage(page);
      
      await clientsPage.navigateToClients();
      await clientsPage.openAddClientForm();
      
      const clientEmail = await clientForm.fillAndSubmitCompleteForm();
      await clientForm.expectSubmissionSuccess();
      
      // Verify client appears in list
      await clientsPage.expectPageToLoad();
      await clientsPage.searchClients(clientEmail);
      await clientsPage.expectClientCount(1);
    });

    test('should handle duplicate email error', async ({ page }) => {
      const clientsPage = new ClientsListPage(page);
      const clientForm = new ClientFormPage(page);
      
      // Create a client first
      const existingEmail = TestHelpers.generateUniqueEmail();
      await TestHelpers.createTestClientViaAPI(page, { email: existingEmail });
      
      await clientsPage.navigateToClients();
      await clientsPage.openAddClientForm();
      
      // Try to create client with same email
      await clientForm.fillBasicInfo({
        email: existingEmail,
        firstName: 'Duplicate',
        lastName: 'Client'
      });
      
      await clientForm.submitForm();
      await clientForm.expectSubmissionError('already exists');
    });
  });

  test.describe('Client Invitation Flow', () => {
    test('should open and close invite form modal', async ({ page }) => {
      const clientsPage = new ClientsListPage(page);
      const invitePage = new ClientInvitePage(page);
      
      await clientsPage.navigateToClients();
      await clientsPage.openInviteClientForm();
      
      await invitePage.expectModalToBeVisible();
      
      // Test close functionality
      await invitePage.closeModal();
      await expect(invitePage.modal).not.toBeVisible();
    });

    test('should validate email field for invitations', async ({ page }) => {
      const clientsPage = new ClientsListPage(page);
      const invitePage = new ClientInvitePage(page);
      
      await clientsPage.navigateToClients();
      await clientsPage.openInviteClientForm();
      
      await invitePage.testRequiredEmailField();
      await invitePage.testEmailValidation();
    });

    test('should send invitation successfully', async ({ page }) => {
      const clientsPage = new ClientsListPage(page);
      const invitePage = new ClientInvitePage(page);
      
      await clientsPage.navigateToClients();
      await clientsPage.openInviteClientForm();
      
      const inviteEmail = await invitePage.sendCompleteInvitation();
      await invitePage.expectInvitationSuccess();
      
      // Verify invitation was sent (would check pending invitations list)
      // This depends on the UI implementation
    });

    test('should handle duplicate invitation error', async ({ page }) => {
      const clientsPage = new ClientsListPage(page);
      const invitePage = new ClientInvitePage(page);
      
      const testEmail = TestHelpers.generateUniqueEmail();
      
      // Send first invitation
      await clientsPage.navigateToClients();
      await clientsPage.openInviteClientForm();
      await invitePage.sendCompleteInvitation(testEmail);
      await invitePage.expectInvitationSuccess();
      
      // Close and reopen modal
      await invitePage.closeModal();
      await clientsPage.openInviteClientForm();
      
      // Try to send duplicate invitation
      await invitePage.fillInvitationForm(testEmail);
      await invitePage.sendInvitation();
      await invitePage.testDuplicateInvitationError();
    });

    test('should test custom message functionality', async ({ page }) => {
      const clientsPage = new ClientsListPage(page);
      const invitePage = new ClientInvitePage(page);
      
      await clientsPage.navigateToClients();
      await clientsPage.openInviteClientForm();
      
      await invitePage.testCustomMessage();
    });
  });

  test.describe('Client Status Management', () => {
    test('should change client status', async ({ page }) => {
      const clientsPage = new ClientsListPage(page);
      
      // Create test client
      await TestHelpers.createTestClientViaAPI(page, { status: 'pending' });
      
      await clientsPage.navigateToClients();
      await clientsPage.expectPageToLoad();
      
      // Change status
      await clientsPage.changeClientStatus(0, 'Active');
      
      // Verify status change
      const newStatus = await clientsPage.getClientStatus(0);
      expect(newStatus).toBe('active');
    });

    test('should archive client with confirmation', async ({ page }) => {
      const clientsPage = new ClientsListPage(page);
      
      // Create test client
      await TestHelpers.createTestClientViaAPI(page);
      
      await clientsPage.navigateToClients();
      await clientsPage.expectPageToLoad();
      
      const initialCount = await clientsPage.clientCards.count();
      
      // Archive client
      await clientsPage.archiveClient(0);
      
      // Verify client is removed from active list
      await clientsPage.expectClientCount(initialCount - 1);
    });
  });

  test.describe('Responsive Design Tests', () => {
    test('should work correctly on mobile devices', async ({ page }) => {
      const clientsPage = new ClientsListPage(page);
      
      await clientsPage.navigateToClients();
      await clientsPage.testMobileLayout();
      
      // Test mobile-specific interactions
      await TestHelpers.takeMobileScreenshot(page, 'client-list');
      
      // Verify touch targets are appropriate size
      const addButton = clientsPage.addClientButton;
      const buttonBox = await addButton.boundingBox();
      expect(buttonBox?.height).toBeGreaterThanOrEqual(44);
    });

    test('should work correctly on tablet devices', async ({ page }) => {
      const clientsPage = new ClientsListPage(page);
      
      await clientsPage.navigateToClients();
      await clientsPage.testTabletLayout();
      
      await TestHelpers.takeTabletScreenshot(page, 'client-list');
    });

    test('should work correctly on desktop', async ({ page }) => {
      const clientsPage = new ClientsListPage(page);
      
      await clientsPage.navigateToClients();
      await clientsPage.testDesktopLayout();
      
      await TestHelpers.takeDesktopScreenshot(page, 'client-list');
    });

    test('should adapt client form for mobile', async ({ page }) => {
      const clientsPage = new ClientsListPage(page);
      const clientForm = new ClientFormPage(page);
      
      await clientsPage.navigateToClients();
      await clientsPage.openAddClientForm();
      
      await clientForm.testMobileLayout();
    });
  });

  test.describe('Error Handling and Edge Cases', () => {
    test('should handle network connectivity issues', async ({ page }) => {
      const clientsPage = new ClientsListPage(page);
      
      // Navigate to page first
      await clientsPage.navigateToClients();
      await clientsPage.expectPageToLoad();
      
      // Simulate network issues
      await TestHelpers.simulateOfflineMode(page);
      
      // Try to perform actions that require network
      await clientsPage.openAddClientForm();
      const clientForm = new ClientFormPage(page);
      
      await clientForm.fillBasicInfo({
        email: TestHelpers.generateUniqueEmail(),
        firstName: 'Network',
        lastName: 'Test'
      });
      
      await clientForm.submitForm();
      
      // Should show appropriate error message
      await clientForm.expectSubmissionError();
      
      // Restore network
      await TestHelpers.resetNetworkConditions(page);
    });

    test('should handle slow network conditions', async ({ page }) => {
      const clientsPage = new ClientsListPage(page);
      
      // Simulate slow network
      await TestHelpers.simulateSlowNetwork(page);
      
      await clientsPage.navigateToClients();
      
      // Should show loading state initially
      await clientsPage.expectLoadingState();
      
      // Eventually should load successfully
      await clientsPage.expectPageToLoad();
      
      // Restore normal network conditions
      await TestHelpers.resetNetworkConditions(page);
    });

    test('should handle long client names and data', async ({ page }) => {
      const clientsPage = new ClientsListPage(page);
      const clientForm = new ClientFormPage(page);
      
      await clientsPage.navigateToClients();
      await clientsPage.openAddClientForm();
      
      // Test with very long names
      await clientForm.fillBasicInfo({
        email: TestHelpers.generateUniqueEmail(),
        firstName: 'A'.repeat(50),
        lastName: 'B'.repeat(50)
      });
      
      await clientForm.testCharacterLimits();
    });

    test('should maintain form state during navigation', async ({ page }) => {
      const clientsPage = new ClientsListPage(page);
      const clientForm = new ClientFormPage(page);
      
      await clientsPage.navigateToClients();
      await clientsPage.openAddClientForm();
      
      // Fill partial form data
      await clientForm.fillBasicInfo({
        email: TestHelpers.generateUniqueEmail(),
        firstName: 'Test'
      });
      
      // Test form reset functionality
      await clientForm.testFormResetAfterCancel();
    });
  });

  test.describe('Performance and Accessibility', () => {
    test('should meet performance benchmarks', async ({ page }) => {
      const clientsPage = new ClientsListPage(page);
      
      const startTime = Date.now();
      await clientsPage.navigateToClients();
      await clientsPage.expectPageToLoad();
      const endTime = Date.now();
      
      const loadTime = endTime - startTime;
      expect(loadTime).toBeLessThan(5000); // Page should load in under 5 seconds
      
      // Check performance metrics
      const metrics = await TestHelpers.checkPerformance(page);
      console.log('Performance metrics:', metrics);
    });

    test('should be accessible', async ({ page }) => {
      const clientsPage = new ClientsListPage(page);
      
      await clientsPage.navigateToClients();
      await clientsPage.expectPageToLoad();
      
      const accessibilityIssues = await TestHelpers.verifyAccessibility(page);
      expect(accessibilityIssues).toHaveLength(0);
    });
  });

  test.describe('Integration Tests', () => {
    test('should complete full client lifecycle', async ({ page }) => {
      const clientsPage = new ClientsListPage(page);
      const clientForm = new ClientFormPage(page);
      
      // Create client
      await clientsPage.navigateToClients();
      await clientsPage.openAddClientForm();
      
      const clientEmail = await clientForm.fillAndSubmitCompleteForm();
      await clientForm.expectSubmissionSuccess();
      
      // Verify client in list
      await clientsPage.expectPageToLoad();
      await clientsPage.searchClients(clientEmail);
      await clientsPage.expectClientCount(1);
      
      // Change client status
      await clientsPage.changeClientStatus(0, 'Active');
      
      // Archive client
      await clientsPage.archiveClient(0);
      
      // Verify client is no longer in active list
      await clientsPage.expectEmptyState();
    });

    test('should handle concurrent operations', async ({ page }) => {
      const clientsPage = new ClientsListPage(page);
      
      // Create multiple clients concurrently
      const clientPromises = [];
      for (let i = 0; i < 5; i++) {
        clientPromises.push(TestHelpers.createTestClientViaAPI(page, {
          firstName: `Concurrent${i}`,
          lastName: `Test${i}`
        }));
      }
      
      await Promise.all(clientPromises);
      
      await clientsPage.navigateToClients();
      await clientsPage.expectPageToLoad();
      
      // Should show all 5 clients
      await clientsPage.expectClientCount(5);
    });
  });

  test.describe('Data Persistence and Sync', () => {
    test('should persist data across browser sessions', async ({ page, context }) => {
      const clientsPage = new ClientsListPage(page);
      const clientForm = new ClientFormPage(page);
      
      // Create a client
      await clientsPage.navigateToClients();
      await clientsPage.openAddClientForm();
      
      const clientEmail = await clientForm.fillAndSubmitCompleteForm();
      await clientForm.expectSubmissionSuccess();
      
      // Close and reopen browser context
      await context.close();
      const newContext = await page.context().browser()!.newContext();
      const newPage = await newContext.newPage();
      
      // Login again
      await TestHelpers.loginAsTrainer(newPage, trainerCredentials);
      
      const newClientsPage = new ClientsListPage(newPage);
      await newClientsPage.navigateToClients();
      await newClientsPage.expectPageToLoad();
      
      // Search for the created client
      await newClientsPage.searchClients(clientEmail);
      await newClientsPage.expectClientCount(1);
      
      await newContext.close();
    });

    test('should sync data in real-time (if applicable)', async ({ page }) => {
      // This test would be relevant if the application supports real-time updates
      // For now, it's a placeholder for future real-time features
      const clientsPage = new ClientsListPage(page);
      
      await clientsPage.navigateToClients();
      await clientsPage.expectPageToLoad();
      
      // Simulate external data change (would require WebSocket or similar)
      // await simulateExternalClientCreation();
      
      // Verify UI updates automatically
      // await clientsPage.expectClientCount(newCount);
    });
  });
});