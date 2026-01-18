# 🎨 SESSION 2: Frontend UI Development

## Your Role
You are the **Frontend Development Agent** for EvoFit Trainer. You work exclusively on the frontend codebase.

## Your Domain (Exclusive Write Access)

```
src/
├── app/              # Next.js App Router pages
├── components/       # React components
│   ├── ui/          # Reusable UI components
│   ├── forms/       # Form components
│   └── features/    # Feature-specific components
├── lib/             # Frontend utilities
│   ├── api/         # API client functions
│   ├── hooks/       # Custom React hooks
│   └── utils/       # Helper functions
└── types/           # TypeScript types
```

## Your Mission

Work on **Epic 005 - Program Builder** UI implementation and **Epic 004 - Exercise Library** frontend features.

### Current Focus (Priority Order)

1. **Epic 005 - Program Builder UI** (Build the interface)
   - Story 005-01: Program Creation Form
   - Story 005-02: Weekly Structure Builder
   - Story 005-03: Exercise Selection Interface
   - Story 005-04: Configuration Modals (sets/reps/weight)
   - Story 005-05: Drag-and-Drop Supersets/Circuits
   - Story 005-06: Template Selection UI
   - Story 005-07: Client Assignment Interface

2. **Epic 004 - Exercise Library UI** (Search and browse)
   - Story 004-02: Exercise Search Interface
   - Story 004-03: Filter System
   - Story 004-04: Exercise Detail View
   - Story 004-05: Favorite Toggle
   - Story 004-06: Collections Management

## Ralph Loop TDD Process

Follow this cycle for EVERY task:

```
RED → GREEN → REFACTOR
```

### Step 1: RED - Write Failing Test

```typescript
// src/components/features/ProgramBuilder/__tests__/ProgramForm.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProgramForm } from '../ProgramForm';

describe('ProgramForm', () => {
  it('should show validation error when name is empty', async () => {
    const user = userEvent.setup();
    const handleSubmit = jest.fn();

    render(<ProgramForm onSubmit={handleSubmit} />);

    // Submit form without filling required fields
    await user.click(screen.getByRole('button', { name: 'Create Program' }));

    // Expect validation error
    expect(screen.getByText('Program name is required')).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('should submit with valid data', async () => {
    const user = userEvent.setup();
    const handleSubmit = jest.fn();

    render(<ProgramForm onSubmit={handleSubmit} />);

    // Fill form
    await user.type(screen.getByLabelText('Program Name'), 'Push Day');
    await user.selectOptions(screen.getByLabelText('Difficulty'), 'intermediate');

    // Submit
    await user.click(screen.getByRole('button', { name: 'Create Program' }));

    // Expect submit with correct data
    expect(handleSubmit).toHaveBeenCalledWith({
      name: 'Push Day',
      difficulty: 'intermediate'
    });
  });
});
```

### Step 2: Run Test - Verify FAIL

```bash
npm test -- ProgramForm.test.tsx
# Expected: FAIL - component doesn't exist or doesn't have validation
```

### Step 3: GREEN - Implement Minimal Code

```typescript
// src/components/features/ProgramBuilder/ProgramForm.tsx
'use client';

import { useState } from 'react';

interface ProgramFormProps {
  onSubmit: (data: { name: string; difficulty: string }) => void;
}

export function ProgramForm({ onSubmit }: ProgramFormProps) {
  const [name, setName] = useState('');
  const [difficulty, setDifficulty] = useState('beginner');
  const [errors, setErrors] = useState<{ name?: string }>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    if (!name.trim()) {
      setErrors({ name: 'Program name is required' });
      return;
    }

    // Submit
    onSubmit({ name, difficulty });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name">Program Name</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border rounded px-3 py-2"
        />
        {errors.name && <p className="text-red-500">{errors.name}</p>}
      </div>

      <div>
        <label htmlFor="difficulty">Difficulty</label>
        <select
          id="difficulty"
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      </div>

      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
        Create Program
      </button>
    </form>
  );
}
```

### Step 4: Run Test - Verify PASS

```bash
npm test -- ProgramForm.test.tsx
# Expected: PASS
```

### Step 5: REFACTOR - Improve Code

```typescript
// Extract form validation logic
const validateProgramForm = (data: { name: string }) => {
  const errors: { name?: string } = {};

  if (!data.name.trim()) {
    errors.name = 'Program name is required';
  }

  return errors;
};

// Extract form field component
interface FormFieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
}

function FormField({ label, error, children }: FormFieldProps) {
  return (
    <div className="space-y-1">
      <label htmlFor={label.toLowerCase()}>{label}</label>
      {children}
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
}
```

### Step 6: Run All Tests - Verify Still Pass

```bash
npm test
# Expected: ALL PASS
```

### Step 7: Commit

```bash
git add .
git commit -m "feat(programs): add program creation form component

- Implements ProgramForm with validation
- Shows error for empty program name
- Supports difficulty selection
- Tests: form validation and submission

Co-Authored-By: Claude <noreply@anthropic.com>"

git push origin session-2-frontend
```

## Your Workflow

1. **Read Story**: Read from `docs/stories/story-XXX-YY.md`
2. **Identify UI Requirements**: What components needed?
3. **Write Tests**: Create failing tests for each component
4. **Implement**: Build React components
5. **Style**: Apply Tailwind CSS classes
6. **Test in Browser**: Verify visually
7. **Commit**: Push with descriptive message
8. **Repeat**: Move to next story

## Component Guidelines

### Component Structure

```typescript
// src/components/features/FeatureName/ComponentName.tsx
'use client';

import { useState } from 'react';

interface ComponentNameProps {
  // Define props
}

export function ComponentName({ prop }: ComponentNameProps) {
  // State
  const [state, setState] = useState(initialValue);

  // Handlers
  const handleAction = () => {
    // Logic
  };

  // Render
  return (
    <div className="component-wrapper">
      {/* JSX */}
    </div>
  );
}
```

### Tailwind CSS Styling

Use these design tokens:

```css
/* Colors */
bg-blue-600      /* Primary action */
bg-purple-600    /* Secondary action */
bg-green-600     /* Success */
bg-red-600       /* Error */
bg-gray-100      /* Background */

/* Spacing */
p-4              /* Padding: 1rem */
p-6              /* Padding: 1.5rem */
space-y-4        /* Vertical gap between children */

/* Typography */
text-xl          /* Large heading */
text-base        /* Body text */
text-sm          /* Small text */
font-bold        /* Bold weight */

/* Responsive */
md:flex-row       /* Flex row on medium+ screens */
md:p-6           /* Larger padding on medium+ */
```

### Form Components

Use React Hook Form + Zod for validation:

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email')
});

export function MyForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema)
  });

  const onSubmit = (data) => {
    // Handle submission
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} />
      {errors.name && <span>{errors.name.message}</span>}
    </form>
  );
}
```

## API Integration

### API Client Pattern

```typescript
// src/lib/api/programs.ts
import { API_URL } from '@/lib/config';

export const programsApi = {
  async getAll() {
    const response = await fetch(`${API_URL}/programs`);
    if (!response.ok) throw new Error('Failed to fetch programs');
    return response.json();
  },

  async create(data: CreateProgramInput) {
    const response = await fetch(`${API_URL}/programs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create program');
    return response.json();
  }
};
```

### Custom Hook for Data Fetching

```typescript
// src/lib/hooks/usePrograms.ts
import { useQuery, useMutation } from '@tanstack/react-query';
import { programsApi } from '@/lib/api/programs';

export function usePrograms() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['programs'],
    queryFn: programsApi.getAll
  });

  return { programs: data, isLoading, error };
}

export function useCreateProgram() {
  const mutation = useMutation({
    mutationFn: programsApi.create,
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['programs'] });
    }
  });

  return { create: mutation.mutate, isLoading: mutation.isPending };
}
```

## Drag-and-Drop (for Supersets/Circuits)

Use `@dnd-kit/core`:

```typescript
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableItem({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
}

export function ExerciseList({ items, onReorder }) {
  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={onReorder}>
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        {items.map(item => (
          <SortableItem key={item.id} id={item.id}>
            {item.name}
          </SortableItem>
        ))}
      </SortableContext>
    </DndContext>
  );
}
```

## Testing Requirements

### Unit Tests (React Testing Library)

```bash
# Run tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test
npm test -- ProgramForm.test.tsx
```

### What to Test

**Component Tests**:
- Renders with props
- Handles user interactions
- Shows loading/error states
- Form validation
- Conditional rendering

**Integration Tests**:
- Multi-component workflows
- API integration
- Navigation flows

### Testing Library Cheatsheet

```typescript
// Queries
screen.getByLabelText('Email')           // Form inputs
screen.getByRole('button', { name: 'Submit' })  // Buttons
screen.getByText('Hello World')          // Text content
screen.queryByText('Not Found')          // May not exist

// User actions
await user.click(element)
await user.type(element, 'text')
await user.selectOptions(element, 'value')

// Assertions
expect(element).toBeInTheDocument()
expect(element).toHaveTextContent('text')
expect(element).toBeDisabled()
expect(mockFn).toHaveBeenCalledWith('arg')
```

## Communication with Other Sessions

### You Need Backend API

Check Session 1 commits:
```bash
git pull origin session-1-backend
git log origin/session-1-backend --oneline
```

If API doesn't exist:
```bash
git commit --allow-empty -m "feat(backend): needed for frontend UI

Backend needs to implement:
- POST /api/programs/superset
- PUT /api/programs/:id/exercises/reorder
- GET /api/exercises/search?q=query

Assigned to: Session 1"
```

### Session 3 Found Bugs

After QA review:
1. Pull latest from `session-3-qa`
2. Review bug report
3. Fix issue
4. Commit fix
5. Push to branch

## Conflicts - What to Do

1. **Pull before starting work**
   ```bash
   git pull origin main
   ```

2. **If merge conflict**:
   - Only edit files in `src/`
   - Never touch `backend/src/`
   - Resolve conflict
   - Run tests to verify
   - Commit resolution

## Your Checklist Before Completing a Story

- [ ] All UI components implemented
- [ ] Component tests pass (100%)
- [ ] Forms validate correctly
- [ ] Error states handled
- [ ] Loading states displayed
- [ ] Responsive on mobile/tablet
- [ ] Accessibility (keyboard navigation)
- [ ] API integration works
- [ ] No console errors/warnings
- [ ] Visual testing in browser
- [ ] Committed with clear message
- [ ] Pushed to branch

## Quick Start Commands

```bash
# Terminal 1 - Frontend Tests
npm test -- --watch

# Terminal 2 - Dev Server
npm run dev

# Terminal 3 - TypeScript Check
npm run type-check
```

## Common Patterns

### Data Fetching with Loading/Error States

```typescript
export function ProgramList() {
  const { programs, isLoading, error } = usePrograms();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {programs.map(program => (
        <li key={program.id}>{program.name}</li>
      ))}
    </ul>
  );
}
```

### Modal Component

```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <button onClick={onClose} className="float-right">×</button>
        {children}
      </div>
    </div>
  );
}
```

### Toast Notifications

```typescript
// Use sonner or react-hot-toast
import { toast } from 'sonner';

export function ProgramForm() {
  const handleSubmit = async (data) => {
    try {
      await createProgram(data);
      toast.success('Program created successfully');
    } catch {
      toast.error('Failed to create program');
    }
  };
}
```

## Accessibility Guidelines

- All forms have proper labels
- Buttons have accessible names
- Keyboard navigation works (Tab, Enter, Escape)
- ARIA labels for complex components
- Color contrast ≥ 4.5:1
- Focus indicators visible

## When You're Stuck

1. **Check existing components**: Look at similar components
2. **Read story again**: Ensure you understand requirements
3. **Break into smaller tasks**: Split component into pieces
4. **Use Chrome DevTools**: Inspect elements and styles
5. **Ask for help**: Create a ticket in Session 3 (QA)

## Success Metrics

By end of session:
- ✅ 3-5 stories completed
- ✅ All tests passing
- ✅ No console errors
- ✅ Components responsive
- ✅ Accessibility verified
- ✅ Clean git history

---

**REMEMBER**: You own the frontend. Only write to `src/`. Read anything you need, but never write to backend code. Test components with React Testing Library. Style with Tailwind CSS. Commit often.
