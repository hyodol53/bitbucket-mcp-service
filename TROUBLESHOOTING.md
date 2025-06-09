# MCP Connection Troubleshooting Guide

## Diagnostic Steps

### 1. Check Claude Desktop Logs
Check Claude Desktop logs to verify MCP server connection status.

### 2. Verify Configuration File Location
Claude Desktop configuration file location on Windows:
- `%APPDATA%\Claude\claude_desktop_config.json`
- Or `C:\Users\[username]\AppData\Roaming\Claude\claude_desktop_config.json`

### 3. Correct Configuration File Content
```json
{
  "mcpServers": {
    "bitbucket": {
      "command": "node",
      "args": ["D:/tmp/bitbucket-mcp-server/build/src/index.js"],
      "env": {
        "BITBUCKET_USERNAME": "actual_username",
        "BITBUCKET_APP_PASSWORD": "actual_app_password",
        "BITBUCKET_DEFAULT_WORKSPACE": "actual_workspace"
      }
    }
  }
}
```

### 4. Testing Methods

#### A. Check MCP Connection
In a new conversation:
```
Are there any available tools or MCP servers?
```

#### B. Specific Requests
```
Show recent 10 commits from myrepo repository in bitbucket
```
(Replace with actual workspace and repo names)

#### C. Step-by-step Approach
```
1. "Use get_commits tool to..."
2. "Use bitbucket MCP to..."
```

### 5. Common Issues

1. **Environment Variable Issues**: BITBUCKET_USERNAME, BITBUCKET_APP_PASSWORD, or BITBUCKET_DEFAULT_WORKSPACE are incorrect
2. **Path Issues**: build/src/index.js path is incorrect
3. **Permission Issues**: App Password permissions are insufficient
4. **Claude Desktop Restart**: Not restarted after configuration changes
5. **Workspace Issues**: Default workspace not set or incorrect

### 6. Manual Testing
Test MCP server directly in terminal:
```cmd
cd D:\tmp\bitbucket-mcp-server
set BITBUCKET_USERNAME=your_username
set BITBUCKET_APP_PASSWORD=your_app_password
set BITBUCKET_DEFAULT_WORKSPACE=your_workspace
npm start
```

If the server starts successfully, you should see "Bitbucket MCP Server running on stdio" message.

### 7. Workspace Configuration

#### Finding Your Workspace Name
1. Go to your Bitbucket repository URL
2. URL format: `https://bitbucket.org/[WORKSPACE]/[REPOSITORY]`
3. The WORKSPACE part is what you need for BITBUCKET_DEFAULT_WORKSPACE

#### Testing with Workspace
- With default workspace: "Show commits from engine repository"
- Without default workspace: "Show commits from myworkspace/engine repository"

### 8. Debug Information
When asking for help, provide:
1. Claude Desktop version
2. Configuration file content (with credentials masked)
3. Error messages from Claude Desktop logs
4. Results of manual testing
5. Bitbucket workspace and repository names you're trying to access
