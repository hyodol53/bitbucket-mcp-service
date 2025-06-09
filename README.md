# Bitbucket MCP Server

Bitbucket API integration for Model Context Protocol (MCP) server. This server allows you to read various information from Bitbucket repositories and integrates seamlessly with Claude Desktop and other MCP clients.

## Features

- Repository basic information query
- Commit list and detailed information query
- Commit diff query
- Branch and tag list query
- Pull request list query
- File and directory content query
- Support for both public and private repositories
- Configurable default workspace

## Installation

### Global Installation (Recommended)

```bash
npm install -g bitbucket-mcp-service
```

### Using npx (No installation required)

```bash
npx bitbucket-mcp-service
```

### Local Installation

```bash
npm install bitbucket-mcp-service
```

### 2. Bitbucket Authentication Setup

You need to create a Bitbucket App Password:

1. Go to Bitbucket account settings
2. Select App passwords menu
3. Create new App Password (Required permission: Repositories - Read)
4. Set environment variables:

```bash
export BITBUCKET_USERNAME="your_username"
export BITBUCKET_APP_PASSWORD="your_app_password"
export BITBUCKET_DEFAULT_WORKSPACE="your_default_workspace_url"
```

### 3. MCP Client Configuration

Add the following to your Claude Desktop or other MCP client configuration:

#### Using Global Installation

```json
{
  "mcpServers": {
    "bitbucket": {
      "command": "bitbucket-mcp-service",
      "env": {
        "BITBUCKET_USERNAME": "your_username",
        "BITBUCKET_APP_PASSWORD": "your_app_password",
        "BITBUCKET_DEFAULT_WORKSPACE": "your_default_workspace_url"
      }
    }
  }
}
```

#### Using npx

```json
{
  "mcpServers": {
    "bitbucket": {
      "command": "npx",
      "args": ["bitbucket-mcp-service"],
      "env": {
        "BITBUCKET_USERNAME": "your_username",
        "BITBUCKET_APP_PASSWORD": "your_app_password",
        "BITBUCKET_DEFAULT_WORKSPACE": "your_default_workspace_url"
      }
    }
  }
}
```

#### Using Local Installation

```json
{
  "mcpServers": {
    "bitbucket": {
      "command": "node",
      "args": ["./node_modules/bitbucket-mcp-service/build/src/index.js"],
      "env": {
        "BITBUCKET_USERNAME": "your_username",
        "BITBUCKET_APP_PASSWORD": "your_app_password",
        "BITBUCKET_DEFAULT_WORKSPACE": "your_default_workspace_url"
      }
    }
  }
}
```

## Available Tools

### get_repository_info
Query basic information about a repository.

**Parameters:**
- `repo_slug`: Repository name/slug
- `workspace` (optional): Bitbucket workspace name

### get_commits
Query commit list.

**Parameters:**
- `repo_slug`: Repository name/slug
- `workspace` (optional): Bitbucket workspace name
- `branch` (optional): Branch name
- `limit` (optional): Number of commits to retrieve (default: 10, max: 100)

### get_commit_detail
Query detailed information about a specific commit.

**Parameters:**
- `repo_slug`: Repository name/slug
- `commit_id`: Commit hash/ID
- `workspace` (optional): Bitbucket workspace name

### get_commit_diff
Query changes (diff) for a specific commit.

**Parameters:**
- `repo_slug`: Repository name/slug
- `commit_id`: Commit hash/ID
- `workspace` (optional): Bitbucket workspace name

### get_branches
Query branch list in the repository.

**Parameters:**
- `repo_slug`: Repository name/slug
- `workspace` (optional): Bitbucket workspace name

### get_tags
Query tag list in the repository.

**Parameters:**
- `repo_slug`: Repository name/slug
- `workspace` (optional): Bitbucket workspace name

### get_pull_requests
Query pull request list.

**Parameters:**
- `repo_slug`: Repository name/slug
- `workspace` (optional): Bitbucket workspace name
- `state` (optional): PR status (OPEN, MERGED, DECLINED, SUPERSEDED)

### get_file_content
Query content of a specific file.

**Parameters:**
- `repo_slug`: Repository name/slug
- `file_path`: File path
- `workspace` (optional): Bitbucket workspace name
- `branch` (optional): Branch name (default: main)

### get_directory_content
Query directory contents.

**Parameters:**
- `repo_slug`: Repository name/slug
- `workspace` (optional): Bitbucket workspace name
- `directory_path` (optional): Directory path (default: root)
- `branch` (optional): Branch name (default: main)

## Usage Examples

With default workspace configured, you can use in MCP client:

```
Show recent 20 commits from myrepo: get_commits repo_slug="myrepo" limit=20
Show specific commit details: get_commit_detail repo_slug="myrepo" commit_id="abc123"
Show file content: get_file_content repo_slug="myrepo" file_path="README.md"
```

## Notes

1. Bitbucket App Password is required (regular password cannot be used)
2. Public repositories can be queried without authentication for some information, but authentication is required for full functionality
3. Consider API rate limits when using
4. Proper permission management is needed for repositories containing sensitive information

## Development

This project is written in TypeScript and uses the MCP SDK.

### Clone and Setup

```bash
git clone https://github.com/hyodol53/bitbucket-mcp-service.git
cd bitbucket-mcp-service
npm install
```

### Development Commands

```bash
# Build the project
npm run build

# Run in development mode
npm run dev

# Run the built server
npm start
```

### Testing

You can test the server using the provided test.http file with REST Client extension in VS Code.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License