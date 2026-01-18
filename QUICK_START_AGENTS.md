# Quick Start: Building Agents with Claude Agent SDK

## 🚀 Get Started in 5 Minutes

### 1. Verify Installation
```bash
# Check that everything is installed
python -c "import claude_agent_sdk; print('✅ SDK installed:', claude_agent_sdk.__version__)"
python -c "import anthropic; print('✅ Anthropic SDK installed:', anthropic.__version__)"
```

Expected output:
```
✅ SDK installed: 0.1.18
✅ Anthropic SDK installed: 0.75.0
```

### 2. Create Your First Agent (30 seconds)

**Option A: Use a Template**
```bash
# Copy a template
cp .claude/templates/basic-agent-template.md .claude/agents/my-agent.md

# Edit it with your favorite editor
notepad .claude/agents/my-agent.md  # Windows
# or
code .claude/agents/my-agent.md     # VS Code
# or
nano .claude/agents/my-agent.md     # Linux/Mac
```

**Option B: From Scratch**
```bash
# Create new agent file
touch .claude/agents/my-first-agent.md
```

Add this content:
```markdown
---
name: my-first-agent
description: My first custom agent
model: claude-sonnet-4.5
tools: [read, write, bash]
permissionMode: ask
---

# My First Agent

You are a helpful assistant that helps with [specific task].

## What You Do
1. [Task 1]
2. [Task 2]
3. [Task 3]

## How You Work
- [Guideline 1]
- [Guideline 2]
```

### 3. Use Your Agent in Claude Code

**In Claude Code chat:**
```
User: "Use my-first-agent to [do something]"
```

Claude Code will automatically:
1. Find your agent in `.claude/agents/`
2. Load the agent configuration
3. Delegate the task to your agent
4. Return the results

### 4. Try Example Agents

**Fitness Data Analyzer:**
```bash
# The example is already created at:
# .claude/examples/fitness-data-analyzer.md

# Copy it to agents directory to use it
cp .claude/examples/fitness-data-analyzer.md .claude/agents/
```

**Usage in Claude Code:**
```
User: "Use fitness-data-analyzer to analyze my workout log in data/workouts.json"
```

**Workout Planner:**
```bash
# Copy the workout planner
cp .claude/examples/workout-planner.md .claude/agents/
```

**Usage in Claude Code:**
```
User: "Use workout-planner to create a 3-day strength program for me"
```

### 5. Programmatic Agent Creation (Python)

**Run the example script:**
```bash
# Set your API key first
export ANTHROPIC_API_KEY="your-key-here"  # Linux/Mac
# or
set ANTHROPIC_API_KEY=your-key-here       # Windows CMD
# or
$env:ANTHROPIC_API_KEY="your-key-here"    # Windows PowerShell

# Run the example
python .claude/examples/agent-builder-sdk.py
```

This demonstrates:
- Creating agents dynamically
- Parallel agent execution
- Sequential workflows
- Custom fitness agents

---

## 📚 Common Use Cases

### Use Case 1: Code Review
```bash
# Copy the code reviewer template
cp .claude/templates/code-reviewer-template.md .claude/agents/code-reviewer.md

# Use it
# In Claude Code: "Use code-reviewer to review src/auth.py"
```

### Use Case 2: Test Generation
```bash
# Copy the test generator template
cp .claude/templates/test-generator-template.md .claude/agents/test-generator.md

# Use it
# In Claude Code: "Use test-generator to create tests for src/api.py"
```

### Use Case 3: Research
```bash
# Copy the research template
cp .claude/templates/research-agent-template.md .claude/agents/researcher.md

# Use it
# In Claude Code: "Use researcher to find best practices for Python async programming"
```

### Use Case 4: Multi-Agent Workflow
```
In Claude Code:
"Use code-reviewer, test-generator, and researcher to:
1. Review src/auth.py
2. Generate tests based on the review
3. Research best practices for the identified issues"
```

Claude Code will:
1. Delegate to code-reviewer
2. Pass findings to test-generator
3. Use researcher to find solutions
4. Synthesize all results

---

## 🎯 Agent Creation Cheatsheet

### Minimal Agent (Copy-Paste)
```markdown
---
name: agent-name
description: What this agent does
model: claude-sonnet-4.5
tools: [read, write]
---

# Agent Name

You are a specialized agent for [purpose].

Your tasks:
- [Task 1]
- [Task 2]
```

### Full-Featured Agent (Copy-Paste)
```markdown
---
name: full-featured-agent
description: Comprehensive agent with all features
model: claude-sonnet-4.5
tools: [read, write, edit, bash, grep, glob, web-search]
permissionMode: ask
skills: [other-agent-name]  # Can call other agents
---

# Full Featured Agent

## Role
You are a [specialized role].

## Responsibilities
1. [Responsibility 1]
2. [Responsibility 2]

## Process
1. [Step 1]
2. [Step 2]
3. [Step 3]

## Guidelines
- [Guideline 1]
- [Guideline 2]

## Output Format
[Describe expected output]
```

### Available Tools
```yaml
tools:
  - read        # Read files
  - write       # Create new files
  - edit        # Edit existing files
  - bash        # Run shell commands
  - grep        # Search file contents
  - glob        # Find files by pattern
  - web-search  # Search the internet
  - task        # Delegate to other agents
```

### Available Models
```yaml
model: claude-sonnet-4.5      # Best balance (recommended)
model: claude-3.5-haiku       # Fast & cost-effective
model: claude-opus-4          # Most powerful
```

### Permission Modes
```yaml
permissionMode: ask           # Ask before each tool use (recommended)
permissionMode: allow-all     # Auto-approve all (use with caution)
```

---

## 🔧 Troubleshooting

### Agent Not Found
```
Error: Agent "my-agent" not found
```

**Fix:**
1. Check file exists: `.claude/agents/my-agent.md`
2. Check filename matches name in YAML frontmatter
3. Restart Claude Code to reload agents

### Permission Errors
```
Error: Tool "bash" not permitted
```

**Fix:**
Add the tool to your agent's `tools` list:
```yaml
tools: [read, write, bash]
```

### API Key Issues
```
Error: ANTHROPIC_API_KEY not set
```

**Fix (for SDK usage only):**
```bash
# Linux/Mac
export ANTHROPIC_API_KEY="your-key-here"

# Windows CMD
set ANTHROPIC_API_KEY=your-key-here

# Windows PowerShell
$env:ANTHROPIC_API_KEY="your-key-here"
```

**Note:** Claude Code handles API keys automatically. You only need to set this for standalone Python scripts.

### Agent Not Responding as Expected
**Fix:**
1. Make the system prompt more specific
2. Add examples of expected behavior
3. Use a more powerful model (claude-sonnet-4.5 or claude-opus-4)
4. Provide more context in the prompt

---

## 💡 Pro Tips

### Tip 1: Start Simple
```markdown
✅ Start with basic agent
❌ Don't over-engineer initially

Basic is fine:
---
name: helper
description: Helps with X
model: claude-sonnet-4.5
tools: [read]
---

You help with X by doing Y.
```

### Tip 2: Use Agent Composition
```markdown
Create specialized agents that work together:
- analyzer (reads data)
- processor (transforms data)
- reporter (creates summaries)

Main conversation: "Use all three agents to analyze data.csv"
```

### Tip 3: Test with Simple Tasks First
```
❌ Don't start with: "Build entire application"
✅ Start with: "Review this one function"
```

### Tip 4: Leverage Examples
```bash
# Browse existing examples
ls .claude/examples/

# Copy and modify
cp .claude/examples/fitness-data-analyzer.md .claude/agents/my-analyzer.md
# Then customize for your needs
```

### Tip 5: Use Templates for Consistency
```bash
# All your code reviewers use the same template
cp .claude/templates/code-reviewer-template.md .claude/agents/strict-reviewer.md
# Just change the strictness level in the prompt
```

---

## 📖 Next Steps

1. **Read the full guide**: `AGENT_DEVELOPMENT_GUIDE.md`
2. **Try the examples**: Run `.claude/examples/agent-builder-sdk.py`
3. **Create your first real agent**: Use a template as starting point
4. **Experiment**: Try different models, tools, and prompts
5. **Share**: Contribute your agents to the community

---

## 🆘 Need Help?

**Documentation:**
- Full Guide: `AGENT_DEVELOPMENT_GUIDE.md`
- Templates: `.claude/templates/`
- Examples: `.claude/examples/`

**Official Resources:**
- [Claude Agent SDK Docs](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Subagents Guide](https://code.claude.com/docs/en/sub-agents)
- [GitHub Repository](https://github.com/anthropics/claude-agent-sdk-python)

**Community:**
- [Awesome Claude Code Subagents](https://github.com/VoltAgent/awesome-claude-code-subagents)

---

**Happy Agent Building! 🤖**
