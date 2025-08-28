# FitnessTrainer (EvoFit) - Coding Standards

## Overview
This document defines the coding standards and conventions for the FitnessTrainer (EvoFit) platform to ensure consistent, maintainable, and high-quality code across all components.

## General Principles

### Code Quality
- **Clean Code**: Write self-documenting code with clear intent
- **DRY Principle**: Don't Repeat Yourself - extract common functionality
- **SOLID Principles**: Follow Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion
- **KISS Principle**: Keep It Simple, Stupid - favor simplicity over complexity

### Code Organization
- **Modular Design**: Break code into small, focused modules
- **Separation of Concerns**: Keep business logic, data access, and UI separate
- **Consistent Structure**: Follow established project structure patterns

## Language-Specific Standards

### TypeScript (Frontend & Backend)

#### Naming Conventions
```typescript
// Variables and functions: camelCase
const clientCount = 10;
const getUserProfile = () => {};

// Classes and interfaces: PascalCase
class ClientService {}
interface UserProfile {}

// Constants: UPPER_SNAKE_CASE
const MAX_CLIENTS_PER_TRAINER = 50;
const API_BASE_URL = 'https://api.evofit.com';

// Files and directories: kebab-case
// client-service.ts
// user-profile.component.tsx
```

#### Type Definitions
```typescript
// Use explicit types for function parameters and returns
function createWorkout(name: string, exercises: Exercise[]): Workout {
  // Implementation
}

// Use interfaces for object shapes
interface ClientProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  goals: string[];
}

// Use enums for fixed sets of values
enum ClientStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  ARCHIVED = 'archived'
}
```

#### Code Structure
```typescript
// Import order: external libraries, internal modules, relative imports
import React from 'react';
import { NextApiRequest, NextApiResponse } from 'next';
import { ClientService } from '@/services/clientService';
import { validateClientData } from './validation';

// Export default at end of file
export default function ClientProfile() {
  // Component implementation
}
```

### React/Next.js Frontend

#### Component Standards
```typescript
// Functional components with TypeScript
interface ClientCardProps {
  client: Client;
  onEdit: (client: Client) => void;
  onDelete: (id: string) => void;
}

export default function ClientCard({ client, onEdit, onDelete }: ClientCardProps) {
  // Component logic
  
  return (
    <div className="client-card">
      {/* JSX */}
    </div>
  );
}
```

#### Hooks Usage
```typescript
// Custom hooks for business logic
function useClientManagement() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  
  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const data = await clientService.getClients();
      setClients(data);
    } catch (error) {
      console.error('Failed to fetch clients:', error);
    } finally {
      setLoading(false);
    }
  }, []);
  
  return { clients, loading, fetchClients };
}
```

#### State Management
```typescript
// Use Context for global state
interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);
```

### Node.js Backend

#### API Route Structure
```typescript
// Standard API route handler
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Method validation
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
    // Authentication check
    const user = await authenticate(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Business logic
    const result = await businessLogic();
    
    // Success response
    res.status(200).json({ data: result });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
```

#### Service Layer Pattern
```typescript
// Service classes for business logic
export class ClientService {
  private prisma: PrismaClient;
  
  constructor() {
    this.prisma = new PrismaClient();
  }
  
  async createClient(data: CreateClientInput): Promise<Client> {
    try {
      // Validation
      const validatedData = validateClientData(data);
      
      // Business logic
      const client = await this.prisma.client.create({
        data: validatedData
      });
      
      return client;
    } catch (error) {
      throw new ServiceError('Failed to create client', error);
    }
  }
}
```

## Database Standards (Prisma)

### Schema Design
```prisma
// Use descriptive model names
model TrainerClient {
  id          String   @id @default(cuid())
  trainerId   String
  clientId    String
  status      ClientStatus @default(PENDING)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  trainer     User     @relation("TrainerClients", fields: [trainerId], references: [id])
  client      User     @relation("ClientTrainers", fields: [clientId], references: [id])
  
  @@unique([trainerId, clientId])
  @@map("trainer_clients")
}
```

### Query Patterns
```typescript
// Use service layer for complex queries
async getClientWithWorkouts(clientId: string) {
  return await this.prisma.client.findUnique({
    where: { id: clientId },
    include: {
      workouts: {
        orderBy: { createdAt: 'desc' },
        take: 10
      },
      notes: {
        orderBy: { createdAt: 'desc' }
      }
    }
  });
}
```

## Error Handling

### Frontend Error Handling
```typescript
// Use error boundaries for React components
class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }
}

// Use try-catch for async operations
const handleSubmit = async () => {
  try {
    await submitForm(formData);
    setSuccess(true);
  } catch (error) {
    setError('Failed to submit form. Please try again.');
  }
};
```

### Backend Error Handling
```typescript
// Custom error classes
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class ServiceError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = 'ServiceError';
  }
}

// Global error handler
export function handleError(error: any, req: NextApiRequest, res: NextApiResponse) {
  if (error instanceof ValidationError) {
    return res.status(400).json({ error: error.message, field: error.field });
  }
  
  if (error instanceof ServiceError) {
    console.error('Service Error:', error.originalError);
    return res.status(500).json({ error: 'Internal service error' });
  }
  
  console.error('Unexpected Error:', error);
  return res.status(500).json({ error: 'Internal server error' });
}
```

## Testing Standards

### Unit Testing
```typescript
// Use descriptive test names
describe('ClientService', () => {
  describe('createClient', () => {
    it('should create client with valid data', async () => {
      // Arrange
      const clientData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com'
      };
      
      // Act
      const result = await clientService.createClient(clientData);
      
      // Assert
      expect(result).toHaveProperty('id');
      expect(result.firstName).toBe('John');
    });
    
    it('should throw ValidationError for invalid email', async () => {
      // Arrange
      const invalidData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'invalid-email'
      };
      
      // Act & Assert
      await expect(clientService.createClient(invalidData))
        .rejects.toThrow(ValidationError);
    });
  });
});
```

### Integration Testing
```typescript
// Test API endpoints
describe('POST /api/clients', () => {
  it('should create client for authenticated trainer', async () => {
    const response = await request(app)
      .post('/api/clients')
      .set('Authorization', `Bearer ${authToken}`)
      .send(clientData)
      .expect(201);
      
    expect(response.body).toHaveProperty('id');
  });
});
```

## Security Standards

### Input Validation
```typescript
// Use Zod for schema validation
import { z } from 'zod';

const createClientSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: z.string().email(),
  phone: z.string().optional(),
  goals: z.array(z.string()).max(5)
});

// Validate input in API routes
const validatedData = createClientSchema.parse(req.body);
```

### Authentication
```typescript
// JWT token validation
export async function authenticateRequest(req: NextApiRequest): Promise<User | null> {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return null;
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });
    
    return user;
  } catch (error) {
    return null;
  }
}
```

## Performance Standards

### Frontend Performance
- Use React.memo for expensive components
- Implement lazy loading for routes and large components
- Optimize images with Next.js Image component
- Use useCallback and useMemo appropriately
- Implement proper loading states

### Backend Performance
- Use database indexing for frequently queried fields
- Implement pagination for large datasets
- Use Redis caching for expensive operations
- Optimize database queries with includes/selects
- Implement rate limiting

## Code Review Standards

### Review Checklist
- [ ] Code follows naming conventions
- [ ] Functions are single-purpose and reasonably sized
- [ ] Error handling is implemented
- [ ] Security considerations addressed
- [ ] Tests are included for new functionality
- [ ] Performance impact considered
- [ ] Documentation updated if needed

### Review Process
1. Automated checks pass (linting, testing, type checking)
2. Manual code review by team member
3. Security review for sensitive changes
4. Performance review for database/API changes

## Documentation Standards

### Code Comments
```typescript
/**
 * Creates a new workout program for a client
 * @param trainerId - ID of the trainer creating the program
 * @param clientId - ID of the client receiving the program
 * @param programData - Program configuration and exercises
 * @returns Promise resolving to created program
 * @throws ValidationError if program data is invalid
 * @throws ServiceError if creation fails
 */
async createWorkoutProgram(
  trainerId: string,
  clientId: string,
  programData: CreateProgramInput
): Promise<WorkoutProgram> {
  // Implementation
}
```

### README Files
- Each major module should have a README
- Include setup instructions
- Document API endpoints
- Provide usage examples
- Keep documentation up to date

## Git Standards

### Commit Messages
```
type(scope): brief description

Detailed explanation if needed

- List of changes
- Breaking changes noted
- Closes #issue-number
```

### Branch Naming
- `feature/client-management`
- `bugfix/authentication-error`
- `hotfix/security-vulnerability`
- `chore/update-dependencies`

## Continuous Integration

### Required Checks
- TypeScript compilation
- ESLint (no errors, warnings acceptable with justification)
- Prettier formatting
- Unit tests pass
- Integration tests pass
- Security scanning
- Dependency vulnerability checks

### Quality Gates
- Minimum 80% code coverage for new code
- No critical security vulnerabilities
- Performance benchmarks maintained
- All tests pass
- Documentation updated

---

*This document is maintained by the development team and should be updated as standards evolve.*