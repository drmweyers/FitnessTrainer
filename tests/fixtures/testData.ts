export const testTrainerCredentials = {
  email: 'trainer@evofit-qa.com',
  password: 'TestPassword123!',
  firstName: 'Test',
  lastName: 'Trainer'
};

export const testClientData = {
  basic: {
    email: 'test.client@evofit-qa.com',
    firstName: 'John',
    lastName: 'Doe',
    fitnessLevel: 'beginner'
  },
  complete: {
    email: 'complete.client@evofit-qa.com',
    firstName: 'Jane',
    lastName: 'Smith',
    fitnessLevel: 'intermediate',
    primaryGoal: 'Weight Loss',
    targetWeight: 150,
    targetBodyFat: 15,
    timeframe: '6 months',
    additionalNotes: 'Prefers morning workouts',
    workoutDays: ['monday', 'wednesday', 'friday'],
    sessionDuration: 60,
    equipmentAccess: ['dumbbells', 'treadmill'],
    specialRequests: 'Please focus on low-impact exercises',
    emergencyName: 'John Doe Sr.',
    emergencyPhone: '555-0123',
    emergencyRelationship: 'Father',
    medicalConditions: ['Mild hypertension'],
    medications: ['Lisinopril 10mg'],
    allergies: ['Shellfish', 'Peanuts']
  }
};

export const testInvitationData = {
  basic: {
    clientEmail: 'invite@evofit-qa.com'
  },
  withMessage: {
    clientEmail: 'invite.with.message@evofit-qa.com',
    customMessage: 'Welcome to our fitness program! I look forward to working with you to achieve your goals.'
  }
};

export const mockApiResponses = {
  emptyClientList: {
    clients: [],
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0
    }
  },
  
  sampleClients: {
    clients: [
      {
        id: '1',
        email: 'client1@example.com',
        displayName: 'John Doe',
        status: 'active',
        fitnessLevel: 'beginner',
        lastActivity: '2024-01-15T10:00:00Z',
        createdAt: '2024-01-01T10:00:00Z',
        tags: [
          { id: '1', name: 'New Client', color: '#3B82F6' }
        ],
        notesCount: 3
      },
      {
        id: '2',
        email: 'client2@example.com',
        displayName: 'Jane Smith',
        status: 'pending',
        fitnessLevel: 'intermediate',
        lastActivity: '2024-01-14T15:30:00Z',
        createdAt: '2024-01-05T09:15:00Z',
        tags: [
          { id: '2', name: 'Weight Loss', color: '#EF4444' }
        ],
        notesCount: 1
      },
      {
        id: '3',
        email: 'client3@example.com',
        displayName: 'Mike Johnson',
        status: 'active',
        fitnessLevel: 'advanced',
        lastActivity: '2024-01-16T08:00:00Z',
        createdAt: '2024-01-10T14:20:00Z',
        tags: [
          { id: '3', name: 'Strength Training', color: '#10B981' }
        ],
        notesCount: 5
      }
    ],
    pagination: {
      page: 1,
      limit: 20,
      total: 3,
      totalPages: 1
    }
  },
  
  apiError: {
    error: 'Internal Server Error',
    message: 'Unable to fetch clients at this time'
  },
  
  validationError: {
    error: 'Validation Error',
    message: 'Invalid email format',
    details: {
      email: 'Please enter a valid email address'
    }
  },
  
  duplicateEmailError: {
    error: 'Conflict',
    message: 'A client with this email already exists'
  }
};

export const performanceBenchmarks = {
  maxPageLoadTime: 3000, // 3 seconds
  maxApiResponseTime: 500, // 500ms
  maxFirstContentfulPaint: 1500, // 1.5 seconds
  maxLargestContentfulPaint: 2500 // 2.5 seconds
};

export const accessibilityRequirements = {
  minTouchTargetSize: 44, // 44px minimum
  maxTextContrast: 4.5, // WCAG AA standard
  requiredAriaLabels: [
    'button',
    'input',
    'select',
    'textarea'
  ]
};

export const responsiveBreakpoints = {
  mobile: { width: 390, height: 844 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1920, height: 1080 }
};

export const testScenarios = {
  searchQueries: [
    'John',
    'john',
    'JOHN',
    'j',
    'doe',
    'john doe',
    'john@',
    '@example.com'
  ],
  
  statusFilters: [
    'All Clients',
    'Active',
    'Pending',
    'Offline',
    'Need Programming',
    'Archived'
  ],
  
  sortOptions: [
    'Name',
    'Date Added',
    'Last Activity'
  ],
  
  invalidEmails: [
    'plainaddress',
    '@domain.com',
    'user@',
    'user@domain',
    'user name@domain.com',
    'user@domain..com',
    '',
    ' ',
    'user@domain,com'
  ],
  
  edgeCaseInputs: {
    longText: 'a'.repeat(1000),
    specialCharacters: '!@#$%^&*()_+-=[]{}|;:,.<>?',
    unicodeCharacters: '🏋️‍♂️💪🎯',
    sqlInjection: "'; DROP TABLE clients; --",
    xssAttempt: '<script>alert("xss")</script>',
    htmlTags: '<div>test</div>'
  }
};

export const networkConditions = {
  slow3G: {
    downloadThroughput: 1.5 * 1024 * 1024 / 8, // 1.5 Mbps
    uploadThroughput: 750 * 1024 / 8, // 750 Kbps
    latency: 40
  },
  
  fast3G: {
    downloadThroughput: 1.6 * 1024 * 1024 / 8, // 1.6 Mbps
    uploadThroughput: 750 * 1024 / 8, // 750 Kbps
    latency: 150
  },
  
  wifi: {
    downloadThroughput: 30 * 1024 * 1024 / 8, // 30 Mbps
    uploadThroughput: 15 * 1024 * 1024 / 8, // 15 Mbps
    latency: 2
  },
  
  offline: {
    offline: true,
    downloadThroughput: 0,
    uploadThroughput: 0,
    latency: 0
  }
};