# EvoFit Frontend - Next.js Application

Welcome to the EvoFit frontend application! This is a modern, responsive web application built with Next.js 14, TypeScript, and Tailwind CSS, designed specifically for fitness trainers and their clients.

## 🚀 Quick Start

### Prerequisites

- Node.js 18.0.0 or higher
- npm 9.0.0 or higher
- Git

### Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set Up Environment Variables**
   - Copy `.env.local` and adjust values if needed
   - The default configuration points to `http://localhost:4000/api` for the backend

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Open Your Browser**
   - Frontend: http://localhost:3000
   - Backend API (if running): http://localhost:4000/api

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages and layouts
│   ├── api/               # API route handlers (if any)
│   ├── (auth)/            # Authentication pages
│   ├── dashboard/         # Main dashboard pages
│   ├── clients/           # Client management pages
│   ├── exercises/         # Exercise library pages
│   ├── workouts/          # Workout management pages
│   ├── programs/          # Program builder pages
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout component
│   └── page.tsx          # Home page
├── components/            # Reusable UI components
│   ├── features/         # Feature-specific components
│   ├── layout/           # Layout components (Header, Sidebar, Footer)
│   ├── shared/           # Shared UI components
│   └── ui/               # Base UI components (Button, Input, etc.)
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions and configurations
├── state/                # State management (Jotai atoms)
├── types/                # TypeScript type definitions
└── data/                 # Mock data and constants
```

## 🛠️ Available Scripts

### Development
- `npm run dev` - Start development server on port 3000
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run clean` - Clean Next.js cache

### Code Quality
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues automatically
- `npm run type-check` - Run TypeScript type checking

### Testing
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

## 🎨 Design System

### Colors
The application uses a custom color palette designed for fitness applications:

- **Primary**: Blue shades (#0ea5e9) - For main actions and branding
- **Secondary**: Orange shades (#f37316) - For energy and motivation
- **Success**: Green shades (#22c55e) - For progress and achievements
- **Warning**: Yellow shades (#f59e0b) - For cautions and alerts
- **Danger**: Red shades (#ef4444) - For errors and dangerous actions
- **Fitness Colors**: 
  - Muscle: #ff6b6b
  - Cardio: #4ecdc4
  - Strength: #45b7d1
  - Flexibility: #96ceb4
  - Endurance: #feca57

### Typography
- **Font Family**: System fonts with fallbacks
- **Heading Font**: Configurable via CSS variables
- **Responsive Scale**: Mobile-first approach with appropriate scaling

### Components
All components follow the atomic design principle:
- **Atoms**: Basic UI elements (Button, Input, etc.)
- **Molecules**: Simple combinations (SearchBar, etc.)
- **Organisms**: Complex components (Header, ClientList, etc.)
- **Templates**: Page layouts
- **Pages**: Final implementations

## 📱 Responsive Design

The application is designed mobile-first with the following breakpoints:

- **Mobile**: < 768px (default)
- **Tablet**: 768px - 1023px
- **Desktop**: 1024px - 1439px
- **Large Desktop**: ≥ 1440px

### Key Mobile Features
- **Touch-Friendly**: All interactive elements have minimum 44px touch targets
- **Offline Support**: Service worker for offline workout tracking
- **Large Buttons**: Easy to tap during workouts
- **Quick Actions**: Fast access to common functions

## 🔧 Configuration Files

### Core Configuration
- **next.config.js**: Next.js configuration with API proxy and optimizations
- **tsconfig.json**: TypeScript configuration with strict mode
- **tailwind.config.js**: Tailwind CSS with custom EvoFit design system
- **postcss.config.js**: PostCSS configuration

### Code Quality
- **.eslintrc.json**: ESLint rules for code quality
- **prettier.config.js**: Code formatting rules
- **jest.config.js**: Testing configuration
- **jest.setup.js**: Test environment setup

### Environment
- **.env.local**: Development environment variables
- **next-env.d.ts**: Next.js TypeScript definitions

## 🌟 Key Features

### Authentication
- JWT-based authentication with refresh tokens
- Secure route protection
- Role-based access control

### Client Management
- Client profiles with goals and limitations
- Progress tracking and notes
- Client communication tools

### Exercise Library
- 1324+ exercises with animated GIFs
- Advanced filtering and search
- Exercise recommendations

### Workout Builder
- Drag-and-drop workout creation
- Exercise substitutions
- Program templates

### Progress Tracking
- Visual progress charts
- Photo progress tracking
- Measurement tracking

### Mobile Optimization
- Offline workout capability
- Touch-optimized interface
- Quick exercise logging

## 🔌 API Integration

The frontend connects to the backend API at `http://localhost:4000/api` by default.

### Key Endpoints
- **Authentication**: `/auth/login`, `/auth/register`, `/auth/refresh`
- **Clients**: `/clients/*` - Client management
- **Exercises**: `/exercises/*` - Exercise library
- **Workouts**: `/workouts/*` - Workout management
- **Programs**: `/programs/*` - Program management

### Error Handling
- Global error boundary for unexpected errors
- API error interception and user-friendly messages
- Retry mechanisms for network failures

## 🧪 Testing

### Testing Strategy
- **Unit Tests**: Component logic and utilities
- **Integration Tests**: Component interactions
- **E2E Tests**: Full user workflows (future)

### Testing Tools
- **Jest**: Test runner and framework
- **React Testing Library**: Component testing
- **Testing Library Jest DOM**: DOM matchers

### Coverage Goals
- **Branches**: 70%+
- **Functions**: 70%+
- **Lines**: 70%+
- **Statements**: 70%+

## 🚀 Performance Optimizations

### Image Optimization
- Next.js automatic image optimization
- Lazy loading for exercise GIFs
- WebP/AVIF format support

### Bundle Optimization
- Code splitting by routes
- Tree shaking for unused code
- Compression and minification

### Caching Strategy
- Static asset caching (30 days for exercise GIFs)
- API response caching where appropriate
- Service worker for offline functionality

### Monitoring
- Core Web Vitals tracking
- Performance metrics in development
- Error boundary logging

## 🔒 Security

### Security Measures
- Content Security Policy headers
- XSS protection
- CSRF protection
- Secure headers configuration

### Authentication
- JWT tokens with short expiry
- Refresh token rotation
- Secure HTTP-only cookies (backend)

### Data Protection
- Input validation and sanitization
- No sensitive data in frontend storage
- Secure API communication

## 🌍 Internationalization (Future)

The application is prepared for internationalization:
- Next.js i18n support ready
- String externalization pattern
- RTL support considerations

## 📝 Development Guidelines

### Code Style
- TypeScript strict mode enabled
- ESLint and Prettier for consistency
- Conventional commit messages

### Component Guidelines
- Use TypeScript for all components
- Implement proper prop types
- Follow atomic design principles
- Include accessibility attributes

### State Management
- Jotai for atomic state management
- Local component state for UI-only state
- Server state via React Query (future)

### File Naming
- **Components**: PascalCase (e.g., `ClientCard.tsx`)
- **Hooks**: camelCase with 'use' prefix (e.g., `useClients.ts`)
- **Utilities**: camelCase (e.g., `formatDate.ts`)
- **Types**: PascalCase (e.g., `Client.ts`)

## 🚨 Troubleshooting

### Common Issues

#### Build Errors
```bash
# Clear Next.js cache
npm run clean
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

#### TypeScript Errors
```bash
# Run type checking
npm run type-check

# Check tsconfig.json paths
# Ensure all imports use correct paths
```

#### Styling Issues
```bash
# Regenerate Tailwind CSS
npx tailwindcss build
```

#### API Connection Issues
- Check backend is running on port 4000
- Verify NEXT_PUBLIC_API_URL in .env.local
- Check CORS settings in backend

### Debug Mode
Set `NEXT_PUBLIC_DEBUG=true` in your environment to enable:
- Detailed error messages
- Performance metrics
- API request/response logging

## 📞 Support

For technical support:
- Check the GitHub issues
- Review the documentation in `/docs`
- Contact the development team

## 🔄 Updates and Maintenance

### Dependency Updates
```bash
# Check for updates
npm outdated

# Update dependencies
npm update

# Update major versions carefully
npm install package@latest
```

### Security Updates
```bash
# Audit for vulnerabilities
npm audit

# Fix automatically
npm audit fix
```

---

## 📄 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

---

**Built with ❤️ for fitness professionals by the EvoFit team**