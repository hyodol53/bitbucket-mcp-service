#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError, } from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";
// Bitbucket API 클라이언트 클래스
class BitbucketClient {
    baseUrl = "https://api.bitbucket.org/2.0";
    auth;
    constructor(username, appPassword) {
        if (username && appPassword) {
            this.auth = { username, password: appPassword };
        }
    }
    async makeRequest(endpoint, params) {
        const config = {
            url: `${this.baseUrl}${endpoint}`,
            method: 'GET',
            params,
        };
        if (this.auth) {
            config.auth = this.auth;
        }
        try {
            const response = await axios(config);
            return response.data;
        }
        catch (error) {
            if (error.response) {
                throw new McpError(ErrorCode.InternalError, `Bitbucket API Error: ${error.response.status} - ${error.response.data?.error?.message || error.message}`);
            }
            throw new McpError(ErrorCode.InternalError, `Request failed: ${error.message}`);
        }
    }
    // 저장소 정보 조회
    async getRepository(workspace, repoSlug) {
        return await this.makeRequest(`/repositories/${workspace}/${repoSlug}`);
    }
    // 커밋 목록 조회
    async getCommits(workspace, repoSlug, branch, limit = 10) {
        const params = { pagelen: limit };
        if (branch) {
            params.include = branch;
        }
        return await this.makeRequest(`/repositories/${workspace}/${repoSlug}/commits`, params);
    }
    // 특정 커밋 상세 정보 조회
    async getCommit(workspace, repoSlug, commitId) {
        return await this.makeRequest(`/repositories/${workspace}/${repoSlug}/commit/${commitId}`);
    }
    // 커밋의 변경사항 조회
    async getCommitDiff(workspace, repoSlug, commitId) {
        return await this.makeRequest(`/repositories/${workspace}/${repoSlug}/diff/${commitId}`);
    }
    // 브랜치 목록 조회
    async getBranches(workspace, repoSlug) {
        return await this.makeRequest(`/repositories/${workspace}/${repoSlug}/refs/branches`);
    }
    // 태그 목록 조회
    async getTags(workspace, repoSlug) {
        return await this.makeRequest(`/repositories/${workspace}/${repoSlug}/refs/tags`);
    }
    // 풀 리퀘스트 목록 조회
    async getPullRequests(workspace, repoSlug, state = 'OPEN') {
        return await this.makeRequest(`/repositories/${workspace}/${repoSlug}/pullrequests`, { state });
    }
    // 파일 내용 조회
    async getFileContent(workspace, repoSlug, path, branch = 'main') {
        return await this.makeRequest(`/repositories/${workspace}/${repoSlug}/src/${branch}/${path}`);
    }
    // 디렉토리 내용 조회
    async getDirectoryContent(workspace, repoSlug, path = '', branch = 'main') {
        return await this.makeRequest(`/repositories/${workspace}/${repoSlug}/src/${branch}/${path}`);
    }
}
// MCP 서버 설정
const server = new Server({
    name: "bitbucket-mcp",
    version: "0.1.0",
}, {
    capabilities: {
        tools: {},
    },
});
// Bitbucket 클라이언트 인스턴스
let bitbucketClient;
// 환경변수에서 인증 정보 읽기
const BITBUCKET_USERNAME = process.env.BITBUCKET_USERNAME;
const BITBUCKET_APP_PASSWORD = process.env.BITBUCKET_APP_PASSWORD;
bitbucketClient = new BitbucketClient(BITBUCKET_USERNAME, BITBUCKET_APP_PASSWORD);
// 도구 목록 정의
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "get_repository_info",
                description: "Get basic information about a Bitbucket repository",
                inputSchema: {
                    type: "object",
                    properties: {
                        workspace: {
                            type: "string",
                            description: "Bitbucket workspace name"
                        },
                        repo_slug: {
                            type: "string",
                            description: "Repository slug/name"
                        }
                    },
                    required: ["workspace", "repo_slug"]
                }
            },
            {
                name: "get_commits",
                description: "Get list of commits from a Bitbucket repository",
                inputSchema: {
                    type: "object",
                    properties: {
                        workspace: {
                            type: "string",
                            description: "Bitbucket workspace name"
                        },
                        repo_slug: {
                            type: "string",
                            description: "Repository slug/name"
                        },
                        branch: {
                            type: "string",
                            description: "Branch name (optional)"
                        },
                        limit: {
                            type: "number",
                            description: "Number of commits to retrieve (default: 10, max: 100)",
                            minimum: 1,
                            maximum: 100
                        }
                    },
                    required: ["workspace", "repo_slug"]
                }
            },
            {
                name: "get_commit_detail",
                description: "Get detailed information about a specific commit",
                inputSchema: {
                    type: "object",
                    properties: {
                        workspace: {
                            type: "string",
                            description: "Bitbucket workspace name"
                        },
                        repo_slug: {
                            type: "string",
                            description: "Repository slug/name"
                        },
                        commit_id: {
                            type: "string",
                            description: "Commit hash/ID"
                        }
                    },
                    required: ["workspace", "repo_slug", "commit_id"]
                }
            },
            {
                name: "get_commit_diff",
                description: "Get the diff/changes for a specific commit",
                inputSchema: {
                    type: "object",
                    properties: {
                        workspace: {
                            type: "string",
                            description: "Bitbucket workspace name"
                        },
                        repo_slug: {
                            type: "string",
                            description: "Repository slug/name"
                        },
                        commit_id: {
                            type: "string",
                            description: "Commit hash/ID"
                        }
                    },
                    required: ["workspace", "repo_slug", "commit_id"]
                }
            },
            {
                name: "get_branches",
                description: "Get list of branches in the repository",
                inputSchema: {
                    type: "object",
                    properties: {
                        workspace: {
                            type: "string",
                            description: "Bitbucket workspace name"
                        },
                        repo_slug: {
                            type: "string",
                            description: "Repository slug/name"
                        }
                    },
                    required: ["workspace", "repo_slug"]
                }
            },
            {
                name: "get_tags",
                description: "Get list of tags in the repository",
                inputSchema: {
                    type: "object",
                    properties: {
                        workspace: {
                            type: "string",
                            description: "Bitbucket workspace name"
                        },
                        repo_slug: {
                            type: "string",
                            description: "Repository slug/name"
                        }
                    },
                    required: ["workspace", "repo_slug"]
                }
            },
            {
                name: "get_pull_requests",
                description: "Get list of pull requests in the repository",
                inputSchema: {
                    type: "object",
                    properties: {
                        workspace: {
                            type: "string",
                            description: "Bitbucket workspace name"
                        },
                        repo_slug: {
                            type: "string",
                            description: "Repository slug/name"
                        },
                        state: {
                            type: "string",
                            description: "Pull request state (OPEN, MERGED, DECLINED, SUPERSEDED)",
                            enum: ["OPEN", "MERGED", "DECLINED", "SUPERSEDED"]
                        }
                    },
                    required: ["workspace", "repo_slug"]
                }
            },
            {
                name: "get_file_content",
                description: "Get content of a specific file from the repository",
                inputSchema: {
                    type: "object",
                    properties: {
                        workspace: {
                            type: "string",
                            description: "Bitbucket workspace name"
                        },
                        repo_slug: {
                            type: "string",
                            description: "Repository slug/name"
                        },
                        file_path: {
                            type: "string",
                            description: "Path to the file"
                        },
                        branch: {
                            type: "string",
                            description: "Branch name (default: main)"
                        }
                    },
                    required: ["workspace", "repo_slug", "file_path"]
                }
            },
            {
                name: "get_directory_content",
                description: "Get contents of a directory in the repository",
                inputSchema: {
                    type: "object",
                    properties: {
                        workspace: {
                            type: "string",
                            description: "Bitbucket workspace name"
                        },
                        repo_slug: {
                            type: "string",
                            description: "Repository slug/name"
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
                    required: ["workspace", "repo_slug"]
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
                const { workspace, repo_slug } = args;
                const result = await bitbucketClient.getRepository(workspace, repo_slug);
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
                const { workspace, repo_slug, branch, limit = 10 } = args;
                const result = await bitbucketClient.getCommits(workspace, repo_slug, branch, limit);
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
                const { workspace, repo_slug, commit_id } = args;
                const result = await bitbucketClient.getCommit(workspace, repo_slug, commit_id);
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
                const { workspace, repo_slug, commit_id } = args;
                const result = await bitbucketClient.getCommitDiff(workspace, repo_slug, commit_id);
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
                const { workspace, repo_slug } = args;
                const result = await bitbucketClient.getBranches(workspace, repo_slug);
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
                const { workspace, repo_slug } = args;
                const result = await bitbucketClient.getTags(workspace, repo_slug);
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
                const { workspace, repo_slug, state = "OPEN" } = args;
                const result = await bitbucketClient.getPullRequests(workspace, repo_slug, state);
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
                const { workspace, repo_slug, file_path, branch = "main" } = args;
                const result = await bitbucketClient.getFileContent(workspace, repo_slug, file_path, branch);
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
                const { workspace, repo_slug, directory_path = "", branch = "main" } = args;
                const result = await bitbucketClient.getDirectoryContent(workspace, repo_slug, directory_path, branch);
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
    }
    catch (error) {
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
//# sourceMappingURL=index.js.map