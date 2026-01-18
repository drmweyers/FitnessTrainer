# Claude Agent Development Environment

This directory contains your Claude agent development environment, including custom agents, templates, and examples.

## 📁 Directory Structure

```
.claude/
├── agents/          # Your custom agents (actively used by Claude Code)
├── templates/       # Templates for creating new agents
├── examples/        # Example agents and SDK usage
└── README.md        # This file
```

## 🚀 Quick Start

### Create Your First Agent

**Option 1: From Template**
```bash
cp templates/basic-agent-template.md agents/my-agent.md
# Edit agents/my-agent.md to customize
```

**Option 2: From Example**
```bash
cp examples/fitness-data-analyzer.md agents/
# Ready to use immediately
```

**Option 3: From Scratch**
```bash
# Create new file
touch agents/my-custom-agent.md
```

Then add:
```markdown
---
name: my-custom-agent
description: What this agent does
model: claude-sonnet-4.5
tools: [read, write]
---

# My Custom Agent

You are a specialized agent for [purpose].
```

### Use Your Agent

**In Claude Code:**
```
You: "Use my-custom-agent to [task]"
```

## 📚 Available Resources

### Templates
- `templates/basic-agent-template.md` - Minimal agent structure
- `templates/code-reviewer-template.md` - Code review specialist
- `templates/test-generator-template.md` - Test generation specialist
- `templates/research-agent-template.md` - Research specialist

### Examples
- `examples/fitness-data-analyzer.md` - Fitness data analysis agent
- `examples/workout-planner.md` - Workout planning agent
- `examples/agent-builder-sdk.py` - Python SDK usage examples

### Documentation
- `../AGENT_DEVELOPMENT_GUIDE.md` - Comprehensive development guide
- `../QUICK_START_AGENTS.md` - 5-minute quick start
- `../CLAUDE_CODE_INTEGRATION.md` - Integration with Claude Code

## 🎯 Common Agent Types

### Code Quality
- Code reviewers
- Refactoring specialists
- Style enforcers

### Testing
- Test generators
- Coverage analyzers
- Test runners

### Research
- Documentation researchers
- Best practice finders
- Technology comparators

### Domain-Specific (Your Project)
- Fitness data analyzers
- Workout planners
- Nutrition advisors
- Progress trackers

## 💡 Tips

1. **Start Simple**: Use templates, modify gradually
2. **Test Incrementally**: Try simple tasks first
3. **Use Clear Names**: Make it obvious what each agent does
4. **Document Well**: Future you will thank you
5. **Share**: Commit useful agents to version control

## 🔧 Troubleshooting

**Agent not found?**
- Check filename matches agent name
- Verify file is in `agents/` directory
- Restart Claude Code

**Agent not working?**
- Verify YAML frontmatter is valid
- Check system prompt is clear
- Try simpler task first
- Use more powerful model

**Need help?**
- Read `../AGENT_DEVELOPMENT_GUIDE.md`
- Check `../QUICK_START_AGENTS.md`
- Review example agents

## 📖 Learning Path

1. **Read**: `../QUICK_START_AGENTS.md` (5 minutes)
2. **Try**: Copy and use an example agent (5 minutes)
3. **Create**: Make your first custom agent (10 minutes)
4. **Learn**: Read `../AGENT_DEVELOPMENT_GUIDE.md` (30 minutes)
5. **Master**: Experiment with SDK `examples/agent-builder-sdk.py`

## 🆘 Support

**Documentation:**
- [Claude Agent SDK Docs](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Subagents Guide](https://code.claude.com/docs/en/sub-agents)
- [GitHub Repository](https://github.com/anthropics/claude-agent-sdk-python)

**Community:**
- [Awesome Claude Code Subagents](https://github.com/VoltAgent/awesome-claude-code-subagents)

---

**Happy Agent Building!** 🤖
