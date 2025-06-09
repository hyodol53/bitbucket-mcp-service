# Bitbucket MCP Server Installation and Setup Guide

## Quick Start

### 1. Install Dependencies
```bash
cd D:\bitbucket-mcp-service
npm install
```

### 2. Build Project
```bash
npm run build
```

### 3. Create Bitbucket App Password
1. Log in to Bitbucket website
2. Click profile icon → Personal settings
3. Select App passwords menu
4. Click Create app password
5. Enter Label (e.g., "MCP Server")
6. Check **Repositories - Read** permission
7. Click Create and copy the generated password (save it securely as you won't see it again)

### 4. Set Environment Variables (Windows)
```cmd
set BITBUCKET_USERNAME=your_username
set BITBUCKET_APP_PASSWORD=your_app_password
set BITBUCKET_DEFAULT_WORKSPACE=your_default_workspace
```

Or in PowerShell:
```powershell
$env:BITBUCKET_USERNAME="your_username"
$env:BITBUCKET_APP_PASSWORD="your_app_password"
$env:BITBUCKET_DEFAULT_WORKSPACE="your_default_workspace"
```

### 5. Test Run
```bash
npm start
```

## Claude Desktop Integration

To use with Claude Desktop, you need to modify the configuration file.

### Claude Desktop Configuration Location (Windows):
`%APPDATA%\Claude\claude_desktop_config.json`

### Configuration File Content:
```json
{
  "mcpServers": {
    "bitbucket": {
      "command": "node",
      "args": ["D:/bitbucket-mcp-service/build/src/index.js"],
      "env": {
        "BITBUCKET_USERNAME": "your_actual_username",
        "BITBUCKET_APP_PASSWORD": "your_actual_app_password",
        "BITBUCKET_DEFAULT_WORKSPACE": "your_actual_workspace"
      }
    }
  }
}
```

**Important**: Replace `your_actual_username`, `your_actual_app_password`, and `your_actual_workspace` with real values.

### Workspace Configuration
- **BITBUCKET_DEFAULT_WORKSPACE**: Your default Bitbucket workspace name
- This allows you to query repositories by name only: "Show commits from engine repository"
- Without this, you'd need to specify: "Show commits from myworkspace/engine repository"
- You can still override by specifying workspace in individual requests

### Restart Claude Desktop
After modifying the configuration file, completely close and restart Claude Desktop.

## Usage Examples

With default workspace configured, you can ask Claude:

```
"Show recent 20 commits from engine repository"
```

```
"Display README.md content from myproject repository"
```

```
"List branches in api-server repository"
```

## Troubleshooting

### 1. Authentication Errors
- Verify App Password is correctly generated
- Ensure username and App Password are accurate
- Confirm Repositories Read permission is granted

### 2. Build Errors
```bash
npm install
npm run build
```

### 3. Tools Not Visible in Claude Desktop
- Completely restart Claude Desktop
- Verify configuration file path is correct
- Check JSON syntax is valid

### 4. Path Errors
- Use forward slashes `/` or double backslashes `\\` in Windows paths
- Absolute paths are recommended

## Supported Features

1. **Repository Information**: Basic info, settings, metadata
2. **Commit Management**: List, details, changes (diff)
3. **Branches/Tags**: Query all branches and tags
4. **Pull Requests**: List PRs with status filtering
5. **Files/Directories**: Content query and structure exploration

Now you can run `npm install` in local directory to get started!