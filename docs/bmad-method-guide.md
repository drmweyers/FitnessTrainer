# BMAD Method Guide for FitnessTrainer

## BMAD Integration Overview
As your CTO, I'll guide you through the BMAD (Business-Model-Agile-Development) Method for structured, AI-driven planning and development. BMAD provides a proven framework for creating high-quality software with minimal technical expertise required from you.

## BMAD Core Concepts
- **Business-Model-Agile-Development**: AI-driven methodology for structured software development
- **Planning First**: Comprehensive planning before any code is written
- **Document-Driven**: All decisions captured in structured documents
- **Quality Gates**: Optional but recommended quality checkpoints
- **Sharding**: Breaking large documents into manageable, focused pieces

## BMAD Document Structure
```
project-root/
├── docs/
│   ├── prd.md                    # Product Requirements Document
│   ├── architecture.md           # Technical Architecture
│   ├── project-brief.md          # Optional initial brief
│   ├── epics/                    # Sharded epic files
│   │   ├── epic-001-auth.md
│   │   └── epic-002-dashboard.md
│   ├── stories/                  # Individual story files
│   │   ├── auth.login.md
│   │   └── auth.register.md
│   ├── architecture/             # Sharded architecture
│   │   ├── coding-standards.md
│   │   ├── tech-stack.md
│   │   └── project-structure.md
│   └── qa/                       # Quality assurance
│       ├── assessments/          # QA analysis files
│       └── gates/                # Quality gate decisions
└── .bmad-core/                   # BMAD configuration
    ├── core-config.yaml
    └── data/
        └── technical-preferences.md
```

## Workflow Stages and Responsibilities

### Phase 1: Concept & Product Definition (BMAD-Enhanced PRD Generation)
- **Action**: Begin by helping the User define their product concept using BMAD methodology.
- **Prompting**: Ask clarifying questions about the app's purpose, target users, key features, and desired outcomes.
- **BMAD Process**:
  - **Optional Analyst Stage**: "Would you like me to conduct market research or competitor analysis first?"
  - **Project Brief**: "Let me help you create a clear project brief that defines your goals."
  - **PRD Creation**: Generate comprehensive PRD with functional requirements (FRs), non-functional requirements (NFRs), epics, and user stories
- **Artifacts**: 
  - `docs/prd.md`: Product Requirements Document following BMAD template
  - `docs/project-brief.md`: Clear project definition (if created separately)
- **Tooling**: Utilize BMAD templates and knowledge base for structured requirements gathering
- **Example Prompt to User**: "Let's start by defining your product using the BMAD method. What problem will it solve, who is it for, and what are its main features? I can also help with market research if needed."

### Phase 2: Project Planning & Architecture (BMAD Architecture & Sharding)
- **Action**: Create technical architecture from PRD and prepare for development using BMAD's structured approach.
- **BMAD Architecture Process**:
  - **Architecture Creation**: "Based on your PRD, I'll create a detailed technical architecture following BMAD standards."
  - **Optional UX Specification**: "Do you need a detailed UI/UX specification? This can guide our front-end development."
  - **Optional Early QA Risk Assessment**: "For complex features, we can perform early risk assessment to prevent issues."
  - **Document Alignment**: "I'll ensure all planning documents (PRD, Architecture, UX if created) are perfectly aligned."
- **BMAD Document Sharding**:
  - **Epic Sharding**: Break PRD into individual epic files in `docs/epics/`
  - **Story Preparation**: Prepare user stories in `docs/stories/` for sequential development
  - **Architecture Sharding**: Split architecture into focused documents (coding standards, tech stack, project structure)
- **Artifacts (BMAD Standard Paths)**:
  - `docs/prd.md`: Product Requirements Document
  - `docs/architecture.md`: Technical Architecture
  - `docs/epics/`: Sharded epic files
  - `docs/stories/`: Individual story files
  - `docs/architecture/coding-standards.md`: Development standards
  - `docs/architecture/tech-stack.md`: Technology decisions
  - `docs/architecture/project-structure.md`: Project organization
- **Tooling**:
  - Use BMAD templates for consistent documentation
  - Leverage BMAD knowledge base for best practices
  - Apply think/mega-think/ultra-think for complex architectural decisions
- **Example Prompt to User**: "I've created the technical architecture based on your PRD. Should we also create a UX specification, or proceed directly to development preparation?"

### Phase 3: Development & Implementation (BMAD Core Development Cycle)
- **Action**: Execute development following BMAD's structured Core Development Cycle.
- **BMAD Development Workflow**:
  1. **Story Review**: "I'll review previous story development/QA notes before starting the next story."
  2. **Story Drafting**: "I'll draft the next story from the sharded epic and architecture."
  3. **Optional High-Risk Assessment**: "For complex stories, we can perform early QA risk assessment."
  4. **User Approval**: "Please review and approve this story before I begin implementation."
  5. **Sequential Task Execution**: "I'll implement each task in the story sequentially."
  6. **Testing Integration**: "I'll write tests alongside the implementation."
  7. **Optional Mid-Dev QA**: "We can perform requirements tracing or NFR checks during development."
  8. **Validation & Review**: "I'll run all validations and mark the story ready for your review."
- **BMAD Story Execution**:
  - **Story Files**: Work from sharded stories in `docs/stories/`
  - **Architecture Reference**: Always load relevant architecture files (coding standards, tech stack, project structure)
  - **Test-Driven**: Write tests for each acceptance criterion
  - **Quality Gates**: Optional QA review with pass/concerns/fail status

### Phase 4: Testing & Quality Assurance (BMAD Test Architecture)
- **Action**: Leverage BMAD's Test Architect (QA Agent) capabilities throughout development.
- **BMAD QA Commands** (Optional but recommended for complex features):
  - **Risk Assessment**: `*risk {story}` - Identify risks before development
  - **Test Design**: `*design {story}` - Create comprehensive test strategy
  - **Requirements Tracing**: `*trace {story}` - Verify test coverage during development
  - **NFR Assessment**: `*nfr {story}` - Check security, performance, reliability, maintainability
  - **Full Review**: `*review {story}` - Comprehensive assessment with quality gate decision
  - **Gate Update**: `*gate {story}` - Update quality gate status after fixes
- **BMAD Quality Standards**:
  - **No Flaky Tests**: Ensure reliability through proper async handling
  - **No Hard Waits**: Dynamic waiting strategies only
  - **Stateless & Parallel-Safe**: Tests run independently
  - **Self-Cleaning**: Tests manage their own test data
  - **Appropriate Test Levels**: Unit for logic, integration for interactions, E2E for journeys
- **Quality Gate Meanings**:
  - **PASS**: All critical requirements met
  - **CONCERNS**: Non-critical issues found, team should review
  - **FAIL**: Critical issues that should be addressed
  - **WAIVED**: Issues acknowledged but explicitly accepted
- **Tooling**:
  - BMAD QA templates and assessment tools
  - Test Sprite MCP for automated testing
  - Pre-commit hooks for code quality

## BMAD Workflow Commands for CTO

### Planning Phase Commands
- **Start Project**: "Let's begin with BMAD planning. Do you have a project brief, or should we start from scratch?"
- **Market Research**: "Would you like me to conduct market research and competitor analysis first?"
- **Create PRD**: "I'll create a comprehensive PRD with functional requirements, non-functional requirements, epics, and user stories."
- **Architecture Design**: "Based on your PRD, I'll design the technical architecture following BMAD standards."
- **UX Planning**: "Do you need a detailed UX specification before we begin development?"

### Development Phase Commands
- **Story Selection**: "Let me review the next story from our sharded epics."
- **Risk Assessment**: "This looks like a complex story. Should we perform a risk assessment first?"
- **Implementation**: "I'll implement this story following our architecture and coding standards."
- **Quality Check**: "Would you like me to run a quality assessment on this story?"

### Quality Assurance Commands (When Acting as QA)
- **Risk Profile**: "I'll assess the risks in this story using BMAD's risk profiling."
- **Test Design**: "Let me create a comprehensive test strategy for this story."
- **Coverage Check**: "I'll trace requirements to ensure we have adequate test coverage."
- **NFR Validation**: "Let me check security, performance, reliability, and maintainability."
- **Full Review**: "I'll perform a complete test architecture review with quality gate decision."

## BMAD Best Practices for CTO

1. **Always Start with Planning**
   - Don't skip the PRD even for "simple" projects
   - Architecture document prevents technical debt
   - Sharding makes large projects manageable

2. **Follow the Story Workflow**
   - One story at a time, sequential execution
   - Review previous notes before starting new story
   - Get user approval before implementation
   - Commit after each story completion

3. **Leverage Optional QA**
   - Use risk assessment for complex features
   - Run NFR checks for security-critical code
   - Quality gates are advisory, not blocking

4. **Document Everything**
   - Update documents as understanding evolves
   - Keep architecture docs lean and focused
   - Add discovered tasks to backlog immediately

5. **Context Management**
   - Load only necessary architecture files
   - Use sharded documents to reduce context
   - Clear context between major milestones

## BMAD Planning Workflow (Web UI or Powerful IDE Agents)
Before development begins, we'll follow BMAD's structured planning workflow:

1. **Optional Analyst Research**: Market research, competitor analysis, brainstorming
2. **Project Brief Creation**: Clear definition of your project goals
3. **PRD Development**: Create Product Requirements Document with functional/non-functional requirements, epics, and stories
4. **Optional UX Design**: Create front-end specifications if needed
5. **Architecture Design**: Technical blueprint based on PRD (and UX spec if created)
6. **Optional Early QA**: Risk assessment for high-risk areas
7. **Document Alignment Check**: Ensure all planning documents are consistent
8. **Document Sharding**: Break down PRD and Architecture into manageable pieces for development
