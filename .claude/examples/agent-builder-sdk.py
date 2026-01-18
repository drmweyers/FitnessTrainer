#!/usr/bin/env python3
"""
Claude Agent SDK - Programmatic Agent Builder Example

This script demonstrates how to create and use agents programmatically
using the Claude Agent SDK.

Usage:
    python agent-builder-sdk.py
"""

import asyncio
import os
from typing import List, Dict, Optional
from claude_agent_sdk import query

# Set your API key
# Option 1: Environment variable
# export ANTHROPIC_API_KEY="your-key-here"

# Option 2: Set in code (not recommended for production)
# os.environ["ANTHROPIC_API_KEY"] = "your-key-here"


class AgentBuilder:
    """
    Builder class for creating Claude agents dynamically.
    """

    @staticmethod
    def create_code_reviewer(strictness: str = "normal") -> Dict:
        """
        Create a code review agent with configurable strictness.

        Args:
            strictness: "lenient", "normal", or "strict"

        Returns:
            Agent configuration dict
        """
        strictness_prompts = {
            "lenient": "Focus on critical issues only. Be pragmatic.",
            "normal": "Balance thoroughness with practicality. Standard review depth.",
            "strict": "Maximum scrutiny. Catch every potential issue, no matter how small."
        }

        model_selection = {
            "lenient": "claude-3.5-haiku",
            "normal": "claude-sonnet-4.5",
            "strict": "claude-sonnet-4.5"
        }

        return {
            "name": f"reviewer-{strictness}",
            "description": f"Code reviewer with {strictness} standards",
            "model": model_selection[strictness],
            "systemPrompt": f"""
You are a code reviewer with {strictness} standards.

{strictness_prompts[strictness]}

Review focus areas:
1. Security vulnerabilities (SQL injection, XSS, CSRF, etc.)
2. Logic errors and edge cases
3. Performance bottlenecks
4. Code maintainability and readability
5. Best practices adherence

Provide findings with severity levels:
- CRITICAL: Security/data loss issues
- HIGH: Bugs affecting functionality
- MEDIUM: Code quality issues
- LOW: Minor improvements

Be specific: Always reference line numbers and provide actionable fixes.
"""
        }

    @staticmethod
    def create_test_generator(framework: str = "pytest") -> Dict:
        """
        Create a test generation agent for specific testing framework.

        Args:
            framework: "pytest", "unittest", "jest", etc.

        Returns:
            Agent configuration dict
        """
        framework_specific = {
            "pytest": {
                "imports": "import pytest\nfrom unittest.mock import Mock, patch",
                "decorator": "@pytest.fixture",
                "assertion": "assert result == expected"
            },
            "unittest": {
                "imports": "import unittest\nfrom unittest.mock import Mock, patch",
                "decorator": "@classmethod\ndef setUpClass(cls):",
                "assertion": "self.assertEqual(result, expected)"
            },
            "jest": {
                "imports": "import { jest } from '@jest/globals';",
                "decorator": "beforeEach(() => {",
                "assertion": "expect(result).toBe(expected)"
            }
        }

        config = framework_specific.get(framework, framework_specific["pytest"])

        return {
            "name": f"test-gen-{framework}",
            "description": f"Generates {framework} tests with high coverage",
            "model": "claude-sonnet-4.5",
            "systemPrompt": f"""
You are a test generation specialist for {framework}.

Generate comprehensive tests including:
1. Happy path scenarios
2. Edge cases (empty, null, boundary values)
3. Error cases (invalid inputs, exceptions)
4. Integration scenarios
5. Performance tests (if relevant)

Use {framework} conventions:
{config['imports']}

Test structure:
- AAA pattern (Arrange, Act, Assert)
- Descriptive test names
- One test, one concept
- Mock external dependencies

Ensure:
- 90%+ code coverage
- All branches tested
- Clear test documentation
- Fast execution (mock slow operations)
"""
        }

    @staticmethod
    def create_research_agent(topic_focus: Optional[str] = None) -> Dict:
        """
        Create a research agent with optional topic specialization.

        Args:
            topic_focus: Optional specific topic to focus on

        Returns:
            Agent configuration dict
        """
        focus_prompt = f"\n\nSpecialized focus: {topic_focus}" if topic_focus else ""

        return {
            "name": "researcher" + (f"-{topic_focus.lower().replace(' ', '-')}" if topic_focus else ""),
            "description": f"Research agent" + (f" specializing in {topic_focus}" if topic_focus else ""),
            "model": "claude-sonnet-4.5",
            "systemPrompt": f"""
You are a thorough researcher who finds and synthesizes information.{focus_prompt}

Research process:
1. Understand the question
2. Search for authoritative sources
3. Evaluate credibility
4. Extract relevant information
5. Synthesize findings
6. Provide citations

Trusted sources:
- Official documentation
- Authoritative blogs (core maintainers, developer advocates)
- High-quality Stack Overflow answers
- Well-maintained GitHub repositories
- Recent articles (prefer <1 year old)

Output format:
## Research Summary
[2-3 sentence overview]

## Key Findings
1. Finding with source
2. Finding with source

## Detailed Analysis
[In-depth explanation]

## Recommendations
[Actionable next steps]

## Resources
[Cited sources with URLs]
"""
        }


class AgentOrchestrator:
    """
    Orchestrates multiple agents for complex workflows.
    """

    @staticmethod
    async def parallel_code_review(files: List[str]) -> List[Dict]:
        """
        Review multiple files in parallel.

        Args:
            files: List of file paths to review

        Returns:
            List of review results
        """
        reviewer = AgentBuilder.create_code_reviewer("normal")

        tasks = [
            query(
                prompt=f"Review the code in {file}",
                agents=[reviewer]
            )
            for file in files
        ]

        results = await asyncio.gather(*tasks)
        return results

    @staticmethod
    async def sequential_workflow(code_file: str) -> Dict:
        """
        Run a sequential workflow: Review → Test → Research best practices.

        Args:
            code_file: File to analyze

        Returns:
            Combined results
        """
        # Step 1: Code review
        reviewer = AgentBuilder.create_code_reviewer("normal")
        review_result = await query(
            prompt=f"Review {code_file}",
            agents=[reviewer]
        )

        # Step 2: Generate tests based on review findings
        test_gen = AgentBuilder.create_test_generator("pytest")
        test_result = await query(
            prompt=f"Generate tests for {code_file}, focusing on issues found in review",
            agents=[test_gen]
        )

        # Step 3: Research best practices for identified issues
        researcher = AgentBuilder.create_research_agent("code quality")
        research_result = await query(
            prompt="Research best practices for the issues identified in the review",
            agents=[researcher]
        )

        return {
            "review": review_result,
            "tests": test_result,
            "research": research_result
        }

    @staticmethod
    async def orchestrator_pattern(project_path: str) -> Dict:
        """
        Orchestrator-worker pattern: Main agent coordinates specialized workers.

        Args:
            project_path: Path to project to analyze

        Returns:
            Synthesized results
        """
        # Create orchestrator
        orchestrator = {
            "name": "orchestrator",
            "description": "Coordinates multiple specialized agents",
            "model": "claude-sonnet-4.5",
            "systemPrompt": """
You are an orchestrator agent that coordinates specialized workers.

Your role:
1. Analyze the request
2. Determine which specialists to engage
3. Delegate tasks to workers
4. Synthesize results
5. Provide comprehensive summary

Available workers:
- code-reviewer: Reviews code quality
- test-generator: Creates tests
- security-auditor: Checks security
- researcher: Finds best practices

Process:
1. Break down the request
2. Assign tasks to appropriate workers
3. Monitor progress
4. Combine results into actionable report
"""
        }

        result = await query(
            prompt=f"Analyze the project at {project_path}. Coordinate all available agents to provide comprehensive analysis.",
            agents=[orchestrator]
        )

        return result


# Example usage functions
async def example_single_agent():
    """Example: Create and use a single agent."""
    print("=" * 60)
    print("Example 1: Single Agent (Code Reviewer)")
    print("=" * 60)

    reviewer = AgentBuilder.create_code_reviewer("strict")

    result = await query(
        prompt="Review this Python function:\n\ndef login(username, password):\n    cursor.execute(f'SELECT * FROM users WHERE username={username} AND password={password}')\n    return cursor.fetchone()",
        agents=[reviewer]
    )

    print(result)


async def example_parallel_agents():
    """Example: Run multiple agents in parallel."""
    print("\n" + "=" * 60)
    print("Example 2: Parallel Agents (Multiple File Review)")
    print("=" * 60)

    files = ["auth.py", "api.py", "utils.py"]
    results = await AgentOrchestrator.parallel_code_review(files)

    for file, result in zip(files, results):
        print(f"\n--- Review of {file} ---")
        print(result)


async def example_sequential_workflow():
    """Example: Sequential workflow with dependent steps."""
    print("\n" + "=" * 60)
    print("Example 3: Sequential Workflow (Review → Test → Research)")
    print("=" * 60)

    result = await AgentOrchestrator.sequential_workflow("auth.py")

    print("Review Result:", result["review"])
    print("\nTest Result:", result["tests"])
    print("\nResearch Result:", result["research"])


async def example_custom_agents():
    """Example: Create custom agents for specific use case."""
    print("\n" + "=" * 60)
    print("Example 4: Custom Fitness Agent")
    print("=" * 60)

    fitness_analyzer = {
        "name": "fitness-analyzer",
        "description": "Analyzes workout data and provides insights",
        "model": "claude-sonnet-4.5",
        "systemPrompt": """
You are a fitness data analyst and certified personal trainer.

Analyze workout data and provide:
1. Performance trends
2. Progress assessment
3. Recommendations for improvement
4. Recovery needs
5. Nutrition suggestions

Focus on evidence-based advice and actionable recommendations.
"""
    }

    sample_data = """
Workout Log (Last 4 weeks):
Week 1: Bench Press 3x8@100kg, Squat 3x8@140kg
Week 2: Bench Press 3x8@102.5kg, Squat 3x8@140kg
Week 3: Bench Press 3x7@105kg, Squat 3x9@140kg
Week 4: Bench Press 3x6@105kg, Squat 3x8@145kg
"""

    result = await query(
        prompt=f"Analyze this workout data and provide recommendations:\n{sample_data}",
        agents=[fitness_analyzer]
    )

    print(result)


async def main():
    """
    Main function - Run all examples.
    """
    print("\n" + "🤖 CLAUDE AGENT SDK - EXAMPLES\n")

    # Check for API key
    if not os.getenv("ANTHROPIC_API_KEY"):
        print("⚠️  Warning: ANTHROPIC_API_KEY not set!")
        print("Set it with: export ANTHROPIC_API_KEY='your-key-here'")
        print("\nRunning examples without actual API calls (demo only)\n")

    try:
        # Example 1: Single agent
        await example_single_agent()

        # Example 2: Parallel agents
        # await example_parallel_agents()

        # Example 3: Sequential workflow
        # await example_sequential_workflow()

        # Example 4: Custom agent
        # await example_custom_agents()

        print("\n" + "=" * 60)
        print("✅ Examples completed successfully!")
        print("=" * 60)

    except Exception as e:
        print(f"\n❌ Error: {e}")
        print("\nMake sure ANTHROPIC_API_KEY is set correctly.")


if __name__ == "__main__":
    # Run the examples
    asyncio.run(main())
