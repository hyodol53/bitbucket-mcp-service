#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";

// Bitbucket API 클라이언트 클래스
class BitbucketClient {
  private baseUrl = "https://api.bitbucket.org/2.0";
  private auth?: { username: string; password: string };

  constructor(username?: string, appPassword?: string) {
    if (username && appPassword) {
      this.auth = { username, password: appPassword };
    }
  }

  private async makeRequest(endpoint: string, params?: Record<string, any>) {
    const url = `${this.baseUrl}/${endpoint}`;
    console.error(`Making request to: ${url}`);
    const config: any = {
      url: url,
      method: 'GET',
      params,
    };

    if (this.auth) {
      config.auth = this.auth;
    }

    try {
      const response = await axios(config);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new McpError(
          ErrorCode.InternalError,
          `Bitbucket API Error: ${error.response.status} - ${error.response.data?.error?.message || error.message}`
        );
      }
      throw new McpError(ErrorCode.InternalError, `Request failed: ${error.message}`);
    }
  }

  // 저장소 정보 조회
  async getRepository(workspace: string, repoSlug: string) {
    return await this.makeRequest(`repositories/${workspace}/${repoSlug}`);
  }

  // 커밋 목록 조회
  async getCommits(workspace: string, repoSlug: string, branch?: string, limit: number = 10) {
    const params: any = { pagelen: limit };
    if (branch) {
      params.include = branch;
    }
    const endpoint = `repositories/${workspace}/${repoSlug}/commits`;
    console.error(`Getting commits from: ${this.baseUrl}/${endpoint}`);
    return await this.makeRequest(endpoint, params);
  }

  // 특정 커밋 상세 정보 조회
  async getCommit(workspace: string, repoSlug: string, commitId: string) {
    return await this.makeRequest(`repositories/${workspace}/${repoSlug}/commit/${commitId}`);
  }

  // 커밋의 변경사항 조회
  async getCommitDiff(workspace: string, repoSlug: string, commitId: string) {
    return await this.makeRequest(`repositories/${workspace}/${repoSlug}/diff/${commitId}`);
  }

  // 브랜치 목록 조회
  async getBranches(workspace: string, repoSlug: string) {
    return await this.makeRequest(`repositories/${workspace}/${repoSlug}/refs/branches`);
  }

  // 태그 목록 조회
  async getTags(workspace: string, repoSlug: string) {
    return await this.makeRequest(`repositories/${workspace}/${repoSlug}/refs/tags`);
  }

  // 풀 리퀘스트 목록 조회
  async getPullRequests(workspace: string, repoSlug: string, state: string = 'OPEN') {
    return await this.makeRequest(`repositories/${workspace}/${repoSlug}/pullrequests`, { state });
  }

  // 파일 내용 조회
  async getFileContent(workspace: string, repoSlug: string, path: string, branch: string = 'main') {
    return await this.makeRequest(`repositories/${workspace}/${repoSlug}/src/${branch}/${path}`);
  }

  // 디렉토리 내용 조회
  async getDirectoryContent(workspace: string, repoSlug: string, path: string = '', branch: string = 'main') {
    const endpoint = path ? `repositories/${workspace}/${repoSlug}/src/${branch}/${path}` 
                          : `repositories/${workspace}/${repoSlug}/src/${branch}`;
    return await this.makeRequest(endpoint);
  }
}

// MCP 서버 설정
const server = new Server(
  {
    name: "bitbucket-mcp",
    version: "0.1.0",
  }
);

// Bitbucket 클라이언트 인스턴스
let bitbucketClient: BitbucketClient;

// 환경변수에서 인증 정보 및 기본 워크스페이스 읽기
const BITBUCKET_USERNAME = process.env.BITBUCKET_USERNAME;
const BITBUCKET_APP_PASSWORD = process.env.BITBUCKET_APP_PASSWORD;
const BITBUCKET_DEFAULT_WORKSPACE = process.env.BITBUCKET_DEFAULT_WORKSPACE;

if (!BITBUCKET_DEFAULT_WORKSPACE) {
  console.error("Warning: BITBUCKET_DEFAULT_WORKSPACE not set. You'll need to provide workspace in each request.");
}

bitbucketClient = new BitbucketClient(BITBUCKET_USERNAME, BITBUCKET_APP_PASSWORD);

// 도구 목록 정의
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_repository_info",
        description: "Get basic information about a Bitbucket repository including name, description, language, creation date, and other metadata. Use this when the user asks about repository details or wants to know about a specific repository. You can provide just the repository name if a default workspace is configured.",
        inputSchema: {
          type: "object",
          properties: {
            repo_slug: {
              type: "string", 
              description: "Repository slug/name (the repository name as it appears in the URL)"
            },
            workspace: {
              type: "string",
              description: "Bitbucket workspace name (optional if BITBUCKET_DEFAULT_WORKSPACE is set)"
            }
          },
          required: ["repo_slug"]
        }
      },
      {
        name: "get_commits",
        description: "Get a list of recent commits from a Bitbucket repository. Use this when the user asks about recent commits, commit history, or what was recently changed in a repository. This tool can show commit messages, authors, dates, and commit hashes. You can provide just the repository name if a default workspace is configured.",
        inputSchema: {
          type: "object",
          properties: {
            repo_slug: {
              type: "string",
              description: "Repository slug/name (the repository name as it appears in the URL)"
            },
            workspace: {
              type: "string",
              description: "Bitbucket workspace name (optional if BITBUCKET_DEFAULT_WORKSPACE is set)"
            },
            branch: {
              type: "string",
              description: "Branch name (optional, defaults to main branch if not specified)"
            },
            limit: {
              type: "number",
              description: "Number of commits to retrieve (default: 10, max: 100)",
              minimum: 1,
              maximum: 100
            }
          },
          required: ["repo_slug"]
        }
      },
      {
        name: "get_commit_detail",
        description: "Get detailed information about a specific commit. You can provide just the repository name if a default workspace is configured.",
        inputSchema: {
          type: "object",
          properties: {
            repo_slug: {
              type: "string",
              description: "Repository slug/name"
            },
            commit_id: {
              type: "string",
              description: "Commit hash/ID"
            },
            workspace: {
              type: "string",
              description: "Bitbucket workspace name (optional if BITBUCKET_DEFAULT_WORKSPACE is set)"
            }
          },
          required: ["repo_slug", "commit_id"]
        }
      },
      {
        name: "get_commit_diff",
        description: "Get the diff/changes for a specific commit. You can provide just the repository name if a default workspace is configured.",
        inputSchema: {
          type: "object",
          properties: {
            repo_slug: {
              type: "string",
              description: "Repository slug/name"
            },
            commit_id: {
              type: "string",
              description: "Commit hash/ID"
            },
            workspace: {
              type: "string",
              description: "Bitbucket workspace name (optional if BITBUCKET_DEFAULT_WORKSPACE is set)"
            }
          },
          required: ["repo_slug", "commit_id"]
        }
      },
      {
        name: "get_branches",
        description: "Get list of branches in the repository. You can provide just the repository name if a default workspace is configured.",
        inputSchema: {
          type: "object",
          properties: {
            repo_slug: {
              type: "string",
              description: "Repository slug/name"
            },
            workspace: {
              type: "string",
              description: "Bitbucket workspace name (optional if BITBUCKET_DEFAULT_WORKSPACE is set)"
            }
          },
          required: ["repo_slug"]
        }
      },
      {
        name: "get_tags",
        description: "Get list of tags in the repository. You can provide just the repository name if a default workspace is configured.",
        inputSchema: {
          type: "object",
          properties: {
            repo_slug: {
              type: "string",
              description: "Repository slug/name"
            },
            workspace: {
              type: "string",
              description: "Bitbucket workspace name (optional if BITBUCKET_DEFAULT_WORKSPACE is set)"
            }
          },
          required: ["repo_slug"]
        }
      },
      {
        name: "get_pull_requests",
        description: "Get list of pull requests in the repository. You can provide just the repository name if a default workspace is configured.",
        inputSchema: {
          type: "object",
          properties: {
            repo_slug: {
              type: "string",
              description: "Repository slug/name"
            },
            workspace: {
              type: "string",
              description: "Bitbucket workspace name (optional if BITBUCKET_DEFAULT_WORKSPACE is set)"
            },
            state: {
              type: "string",
              description: "Pull request state (OPEN, MERGED, DECLINED, SUPERSEDED)",
              enum: ["OPEN", "MERGED", "DECLINED", "SUPERSEDED"]
            }
          },
          required: ["repo_slug"]
        }
      },
      {
        name: "get_file_content",
        description: "Get content of a specific file from the repository. You can provide just the repository name if a default workspace is configured.",
        inputSchema: {
          type: "object",
          properties: {
            repo_slug: {
              type: "string",
              description: "Repository slug/name"
            },
            file_path: {
              type: "string",
              description: "Path to the file"
            },
            workspace: {
              type: "string",
              description: "Bitbucket workspace name (optional if BITBUCKET_DEFAULT_WORKSPACE is set)"
            },
            branch: {
              type: "string",
              description: "Branch name (default: main)"
            }
          },
          required: ["repo_slug", "file_path"]
        }
      },
      {
        name: "get_directory_content",
        description: "Get contents of a directory in the repository. You can provide just the repository name if a default workspace is configured.",
        inputSchema: {
          type: "object",
          properties: {
            repo_slug: {
              type: "string",
              description: "Repository slug/name"
            },
            workspace: {
              type: "string",
              description: "Bitbucket workspace name (optional if BITBUCKET_DEFAULT_WORKSPACE is set)"
            },
            directory_path: {
              type: "string",
              description: "Path to the directory (empty for root)"
            },
            branch: {
              type: "string",
              description: "Branch name (default: main)"
            }
          },
          required: ["repo_slug"]
        }
      }
    ]
  };
});

// 도구 실행 핸들러
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "get_repository_info": {
        const { repo_slug, workspace } = args as { repo_slug: string; workspace?: string };
        const actualWorkspace = workspace || BITBUCKET_DEFAULT_WORKSPACE;
        if (!actualWorkspace) {
          throw new McpError(ErrorCode.InvalidParams, "Workspace is required. Either provide workspace parameter or set BITBUCKET_DEFAULT_WORKSPACE environment variable.");
        }
        const result = await bitbucketClient.getRepository(actualWorkspace, repo_slug);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case "get_commits": {
        const { repo_slug, workspace, branch, limit = 10 } = args as {
          repo_slug: string;
          workspace?: string;
          branch?: string;
          limit?: number;
        };
        const actualWorkspace = workspace || BITBUCKET_DEFAULT_WORKSPACE;
        if (!actualWorkspace) {
          throw new McpError(ErrorCode.InvalidParams, "Workspace is required. Either provide workspace parameter or set BITBUCKET_DEFAULT_WORKSPACE environment variable.");
        }
        const result = await bitbucketClient.getCommits(actualWorkspace, repo_slug, branch, limit);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case "get_commit_detail": {
        const { repo_slug, commit_id, workspace } = args as {
          repo_slug: string;
          commit_id: string;
          workspace?: string;
        };
        const actualWorkspace = workspace || BITBUCKET_DEFAULT_WORKSPACE;
        if (!actualWorkspace) {
          throw new McpError(ErrorCode.InvalidParams, "Workspace is required. Either provide workspace parameter or set BITBUCKET_DEFAULT_WORKSPACE environment variable.");
        }
        const result = await bitbucketClient.getCommit(actualWorkspace, repo_slug, commit_id);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case "get_commit_diff": {
        const { repo_slug, commit_id, workspace } = args as {
          repo_slug: string;
          commit_id: string;
          workspace?: string;
        };
        const actualWorkspace = workspace || BITBUCKET_DEFAULT_WORKSPACE;
        if (!actualWorkspace) {
          throw new McpError(ErrorCode.InvalidParams, "Workspace is required. Either provide workspace parameter or set BITBUCKET_DEFAULT_WORKSPACE environment variable.");
        }
        const result = await bitbucketClient.getCommitDiff(actualWorkspace, repo_slug, commit_id);
        return {
          content: [
            {
              type: "text",
              text: typeof result === 'string' ? result : JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case "get_branches": {
        const { repo_slug, workspace } = args as { repo_slug: string; workspace?: string };
        const actualWorkspace = workspace || BITBUCKET_DEFAULT_WORKSPACE;
        if (!actualWorkspace) {
          throw new McpError(ErrorCode.InvalidParams, "Workspace is required. Either provide workspace parameter or set BITBUCKET_DEFAULT_WORKSPACE environment variable.");
        }
        const result = await bitbucketClient.getBranches(actualWorkspace, repo_slug);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case "get_tags": {
        const { repo_slug, workspace } = args as { repo_slug: string; workspace?: string };
        const actualWorkspace = workspace || BITBUCKET_DEFAULT_WORKSPACE;
        if (!actualWorkspace) {
          throw new McpError(ErrorCode.InvalidParams, "Workspace is required. Either provide workspace parameter or set BITBUCKET_DEFAULT_WORKSPACE environment variable.");
        }
        const result = await bitbucketClient.getTags(actualWorkspace, repo_slug);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case "get_pull_requests": {
        const { repo_slug, workspace, state = "OPEN" } = args as {
          repo_slug: string;
          workspace?: string;
          state?: string;
        };
        const actualWorkspace = workspace || BITBUCKET_DEFAULT_WORKSPACE;
        if (!actualWorkspace) {
          throw new McpError(ErrorCode.InvalidParams, "Workspace is required. Either provide workspace parameter or set BITBUCKET_DEFAULT_WORKSPACE environment variable.");
        }
        const result = await bitbucketClient.getPullRequests(actualWorkspace, repo_slug, state);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case "get_file_content": {
        const { repo_slug, file_path, workspace, branch = "main" } = args as {
          repo_slug: string;
          file_path: string;
          workspace?: string;
          branch?: string;
        };
        const actualWorkspace = workspace || BITBUCKET_DEFAULT_WORKSPACE;
        if (!actualWorkspace) {
          throw new McpError(ErrorCode.InvalidParams, "Workspace is required. Either provide workspace parameter or set BITBUCKET_DEFAULT_WORKSPACE environment variable.");
        }
        const result = await bitbucketClient.getFileContent(actualWorkspace, repo_slug, file_path, branch);
        return {
          content: [
            {
              type: "text",
              text: typeof result === 'string' ? result : JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case "get_directory_content": {
        const { repo_slug, workspace, directory_path = "", branch = "main" } = args as {
          repo_slug: string;
          workspace?: string;
          directory_path?: string;
          branch?: string;
        };
        const actualWorkspace = workspace || BITBUCKET_DEFAULT_WORKSPACE;
        if (!actualWorkspace) {
          throw new McpError(ErrorCode.InvalidParams, "Workspace is required. Either provide workspace parameter or set BITBUCKET_DEFAULT_WORKSPACE environment variable.");
        }
        const result = await bitbucketClient.getDirectoryContent(actualWorkspace, repo_slug, directory_path, branch);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    throw new McpError(ErrorCode.InternalError, `Tool execution failed: ${error}`);
  }
});

// 서버 시작
const transport = new StdioServerTransport();
server.connect(transport);

console.error("Bitbucket MCP Server running on stdio");