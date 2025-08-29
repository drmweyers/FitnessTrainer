# Claude Code Router Configuration

## Overview
Claude Code Router is configured to use native Claude models by default. Alternative models (like Qwen) can be used when needed.

## Running Claude Code

### Default: Use Native Claude Models
```powershell
cd <project-directory>
claude code
```
This uses Claude models directly through your Anthropic account.

### Alternative: Use with Router Proxy (when needed)
```powershell
cd <project-directory>
claude code --api-proxy http://127.0.0.1:8080
```
This routes through the proxy but still uses native Claude by default.

## Switching to Alternative Models

### When Claude Credits Run Out
Switch to Qwen models using the `/model` command within Claude Code:

**Available Qwen Models:**
- `/model openrouter-qwen,qwen/qwen-2.5-72b-instruct` - General purpose (recommended)
- `/model openrouter-qwen,qwen/qwen-2.5-coder-32b-instruct` - Optimized for coding
- `/model openrouter-qwen,qwen/qwq-32b-preview` - Best for reasoning tasks
- `/model openrouter-qwen,qwen/qwen-2-vl-72b-instruct` - Vision-language model

**Other Available Models via OpenRouter:**
- `/model openrouter,google/gemini-2.5-pro-preview` - Gemini Pro
- `/model openrouter,anthropic/claude-3.5-sonnet` - Claude via OpenRouter
- `/model openrouter,deepseek/deepseek-chat` - DeepSeek

### Quick Alias for PowerShell
Add to your PowerShell profile for quick access:
```powershell
function claude-qwen {
    claude code --api-proxy http://127.0.0.1:8080 --model openrouter-qwen,qwen/qwen-2.5-72b-instruct
}
```

## Router Service Management

### Check Router Status
```powershell
Get-Process | Where-Object {$_.CommandLine -like "*claude-code-router*"}
```

### Restart Router Service
```powershell
# Stop existing service
Get-Process | Where-Object {$_.CommandLine -like "*claude-code-router*"} | Stop-Process -Force

# Start service
Start-Process node -ArgumentList "C:\Users\drmwe\AppData\Roaming\npm\node_modules\@musistudio\claude-code-router\dist\cli.js", "start" -NoNewWindow
```

## Configuration Location
- Router config: `~/.claude-code-router/config.json`
- Logs: `~/.claude-code-router/claude-code-router.log`

## Best Practices
1. Use native Claude models by default for all tasks
2. Only switch to alternative models (like Qwen) when absolutely necessary
3. Monitor usage to maintain optimal performance
4. Prioritize Claude models for their superior capabilities and consistency

## Model Switching (Only When Necessary)

**NOTE**: Model switching should only be used when Claude credits are exhausted or for specific testing purposes.

If you need to switch models, first ensure Claude Code is running with the router:
```powershell
claude code --api-proxy http://127.0.0.1:8080
```

Then use these commands within Claude Code:

### When you say "change to qwen3":
```
/model openrouter,qwen/qwen3-coder:free
```

### Other Quick Commands:
- **"change to qwen coder"**: `/model openrouter-qwen,qwen/qwen-2.5-coder-32b-instruct`
- **"change to qwen general"**: `/model openrouter-qwen,qwen/qwen-2.5-72b-instruct`
- **"change to qwen reasoning"**: `/model openrouter-qwen,qwen/qwq-32b-preview`
- **"change to local qwen"**: `/model ollama,qwen2.5-coder:latest`
- **"change to gemini"**: `/model openrouter,google/gemini-2.5-pro-preview`
- **"change to deepseek"**: `/model openrouter,deepseek/deepseek-chat`
