# Story 012-07: Configure Platform

**Parent Epic**: [EPIC-012 - Admin Dashboard](../epics/epic-012-admin-dashboard.md)
**Story ID**: STORY-012-07
**Priority**: P1 (High)
**Story Points**: 5
**Sprint**: Sprint 14

## User Story
**As an** admin
**I want to** configure platform settings
**So that I** can control features and customize the platform

## Acceptance Criteria
- [ ] Feature flag management interface
- [ ] Global system settings configuration
- [ ] Email template customization
- [ ] Notification settings management
- [ ] Rate limit controls
- [ ] Maintenance mode scheduling
- [ ] API configuration options
- [ ] Integration settings management
- [ ] Configuration version control
- [ ] Rollback capabilities
- [ ] Setting change history

## Technical Implementation

### Frontend Tasks
1. **ConfigManager Component** - Main configuration interface
2. **FeatureFlags Component** - Feature toggle management
3. **EmailTemplates Component** - Email template editor
4. **NotificationSettings Component** - Notification preferences
5. **RateLimits Component** - Rate limit configuration
6. **MaintenanceMode Component** - Maintenance scheduling

### Backend Tasks
1. **Configuration Endpoints**
   ```typescript
   GET /api/admin/config - Get all configuration
   PUT /api/admin/config - Update configuration
   GET /api/admin/feature-flags - Get feature flags
   POST /api/admin/feature-flags - Create feature flag
   PUT /api/admin/feature-flags/:id - Update feature flag
   DELETE /api/admin/feature-flags/:id - Delete feature flag
   GET /api/admin/email-templates - Get email templates
   PUT /api/admin/email-templates/:id - Update template
   POST /api/admin/maintenance - Schedule maintenance
   GET /api/admin/config/history - Get change history
   POST /api/admin/config/rollback - Rollback configuration
   ```

2. **ConfigService**
   ```typescript
   class ConfigService {
     async getConfiguration(): Promise<PlatformConfiguration>
     async updateConfiguration(config: Partial<PlatformConfiguration>): Promise<void>
     async getFeatureFlags(): Promise<FeatureFlag[]>
     async updateFeatureFlag(flagId: string, updates: any): Promise<void>
     async scheduleMaintenance(maintenance: MaintenanceSchedule): Promise<void>
     async rollbackConfig(version: string): Promise<void>
   }
   ```

### Data Models
```typescript
interface PlatformConfiguration {
  featureFlags: FeatureFlag[];
  systemSettings: SystemSettings;
  emailSettings: EmailSettings;
  notificationSettings: NotificationSettings;
  rateLimits: RateLimitConfig[];
  apiSettings: APISettings;
  integrations: IntegrationConfig[];
  version: string;
  lastUpdated: Date;
  updatedBy: string;
}

interface FeatureFlag {
  id: string;
  name: string;
  key: string;
  description: string;
  isEnabled: boolean;
  rolloutPercentage: number;
  userSegments?: string[];
  conditions?: FlagCondition[];
  createdAt: Date;
  updatedAt: Date;
}

interface SystemSettings {
  platformName: string;
  supportEmail: string;
  maintenanceMode: boolean;
  maintenanceMessage?: string;
  registrationOpen: boolean;
  maxClientsPerTrainer: number;
  trialPeriodDays: number;
  currency: string;
}

interface EmailSettings {
  templates: EmailTemplate[];
  senderName: string;
  senderEmail: string;
  replyToEmail: string;
}

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

interface RateLimitConfig {
  endpoint: string;
  requestsPerMinute: number;
  requestsPerHour: number;
  burstLimit: number;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
  category: 'transactional' | 'marketing' | 'notification';
}

interface MaintenanceSchedule {
  startTime: Date;
  endTime: Date;
  message: string;
  notifyUsers: boolean;
}

interface ConfigHistory {
  id: string;
  version: string;
  changes: any;
  previousConfig: any;
  changedBy: string;
  changedAt: Date;
  rollbackAvailable: boolean;
}
```

### Database Schema
```sql
CREATE TABLE feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  key VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  is_enabled BOOLEAN DEFAULT false,
  rollout_percentage INTEGER DEFAULT 0,
  user_segments TEXT[],
  conditions JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE system_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key VARCHAR(100) NOT NULL UNIQUE,
  config_value JSONB NOT NULL,
  category VARCHAR(50),
  description TEXT,
  is_sensitive BOOLEAN DEFAULT false,
  updated_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  subject VARCHAR(500) NOT NULL,
  body TEXT NOT NULL,
  variables TEXT[],
  category VARCHAR(50) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE config_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version VARCHAR(50) NOT NULL,
  changes JSONB NOT NULL,
  previous_config JSONB,
  changed_by UUID REFERENCES admin_users(id),
  changed_at TIMESTAMP DEFAULT NOW(),
  rollback_available BOOLEAN DEFAULT true
);
```

## Test Cases
1. **Feature Flags** - Create, update, delete feature flags
2. **System Settings** - Update global platform settings
3. **Email Templates** - Customize email templates
4. **Notification Settings** - Configure notification preferences
5. **Rate Limits** - Adjust rate limits for endpoints
6. **Maintenance Mode** - Schedule and activate maintenance
7. **Configuration History** - View change history
8. **Rollback** - Rollback to previous configuration

## UI/UX Mockups
```
Platform Configuration

+--------------------------------------------------------------+
|  Configuration                                                        |
|  ───────────────────────────────────────────────────────────   |
|  Feature Flags                                                  |
|  ┌────────────────────────────────────────────────────────┐   |
|  │ [+] Add Feature Flag                                   │   |
|  │                                                         │   |
|  │ New Workout Builder      [ON]  [100% rollout]  [Edit]  │   |
|  │ Video Upload          [ON]  [50% rollout]   [Edit]  │   |
|  │ Group Training        [OFF] [0% rollout]    [Edit]  │   |
|  │ Nutrition Tracking     [ON]  [Beta only]     [Edit]  │   |
|  └────────────────────────────────────────────────────────┘   |
|                                                              |
|  System Settings                                              |
|  ┌────────────────────────────────────────────────────────┐   |
|  │ Platform Name:        [EvoFit________________]          │   |
|  │ Support Email:        [support@evofit.com___]          │   |
|  │ Registration:         [Open ▼]                         │   |
|  │ Max Clients/Trainer:  [50_____]                        │   |
|  │ Trial Period:         [14_____] days                   │   |
|  │ Currency:             [USD ▼]                          │   |
|  │ [Save Changes]                                        │   |
|  └────────────────────────────────────────────────────────┘   |
|                                                              |
|  Maintenance Mode                                             |
|  ☑ Enable Maintenance Mode                                    |
|  Message: [We'll be right back!]                              |
|  Scheduled: [January 20, 2025 2:00 AM ▼]                      |
|  Duration: [2 hours]                                          |
|  [Schedule]                                                   |
+--------------------------------------------------------------+
```

```
Feature Flag Editor

+----------------------------------+
|  ← Back  Edit Feature Flag       |
+----------------------------------+
|  Name: New Workout Builder       |
|  Key: new_workout_builder        |
|                                  |
|  Status                    [ON]  |
|  Rollout: [100%____________]     |
|                                  |
|  Targeting                       |
|  ┌────────────────────────────┐  |
|  │ ☑ All users                │  |
|  │ ☐ Beta testers             │  |
|  │ ☐ Specific users           │  |
|  │ ☐ User segments            │  |
|  └────────────────────────────┘  |
|                                  |
|  Conditions                      |
|  [+ Add Condition]               |
|  • User created after 2024-01-01 |
|  • User has active subscription  |
|                                  |
|  [Save]  [Cancel]                |
+----------------------------------+
```

## Dependencies
- Configuration management system
- Email service integration
- Feature flag library
- Notification system

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Feature flags working
- [ ] System settings configurable
- [ ] Email templates customizable
- [ ] Notification settings working
- [ ] Rate limits adjustable
- [ ] Maintenance mode functional
- [ ] Configuration history tracked
- [ ] Rollback capability working
- [ ] Unit tests passing
- [ ] Code reviewed
- [ ] Documentation updated

## Notes
- Use feature flags for gradual rollouts
- A/B testing capabilities
- Document all configuration changes
- Test configuration changes in staging
- Monitor feature flag performance
- Clean up old feature flags
- Version control for configurations
- Alert on critical setting changes
