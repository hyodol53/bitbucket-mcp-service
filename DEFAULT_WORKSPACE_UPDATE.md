# Default Workspace Configuration - Update Complete!

## Major Changes

### 1. Environment Variable Added
- `BITBUCKET_DEFAULT_WORKSPACE`: Default workspace configuration

### 2. Tool Parameter Changes
- All tools now have `workspace` as optional parameter
- Only `repo_slug` remains as required parameter
- Automatically uses default workspace when workspace is not provided

### 3. Improved Usage
You can now use it simply like this:

**Previous method (still supported):**
```
"Show recent commits from myworkspace/engine repository"
```

**New simplified method:**
```
"Show recent commits from engine repository"
```

### 4. Claude Desktop Configuration Update

Add the default workspace to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "bitbucket": {
      "command": "node",
      "args": ["D:/bitbucket-mcp-service/build/src/index.js"],
      "env": {
        "BITBUCKET_USERNAME": "actual_username",
        "BITBUCKET_APP_PASSWORD": "actual_app_password",
        "BITBUCKET_DEFAULT_WORKSPACE": "actual_workspace_name"
      }
    }
  }
}
```

### 5. Build and Test

```cmd
cd D:\bitbucket-mcp-service
npm run build
```

Then restart Claude Desktop and test:

```
Show recent commits from engine repository
```

You no longer need to specify the workspace every time!