# ChurnMetrics Project Memory

This file serves as a permanent memory for the ChurnMetrics project, documenting accessible tools, services, and connectivity to prioritize CLI/API usage over browser interactions.

## 🛠 Accessible Tools & Connectivity

| Tool | Status | Path / Version | Notes |
| :--- | :--- | :--- | :--- |
| **Vercel CLI** | ✅ Logged In | `/Users/ali/.npm-global/bin/vercel` | Connected to Vercel account. |
| **Atlas CLI** | ✅ Logged In | `/opt/homebrew/bin/atlas` | MongoDB Atlas management. |
| **GCloud CLI** | ✅ Logged In | `gcloud` | Account: `aak.aliahmadk@gmail.com` |
| **Mongosh** | ✅ Installed | `v2.8.2` | Local/Remote MongoDB shell. |
| **Docker** | ⚠️ Installed | `/Users/ali/.docker/bin/docker` | Daemon not running or not logged in. |
| **GitHub (gh)** | ❌ Not Found | - | Use `github` MCP server for operations. |
| **Kubectl** | ⚠️ Installed | - | No context currently set. |
| **Go** | ✅ Installed | - | Go development environment ready. |
| **Python** | ✅ Installed | - | Python 3.13 / venv available in project. |

## 🔗 Project Services (from .env)
- **MongoDB**: Configured via `MONGODB_URI`.
- **Vercel Blob**: Token available.
- **FastAPI**: Backend URL configured.
- **Vite**: Frontend base URL configured.

## 📜 Development Guidelines
1. **Prefer CLI/API**: Always use the terminal tools (Vercel, Atlas, GCloud, etc.) or MCP tools (GitHub, MongoDB) before resorting to the browser.
2. **Persistence**: Refer to this `CLAUDE.md` file at the start of every session to recall the environment setup.
3. **Connectivity First**: If a service seems disconnected, attempt to re-authenticate via CLI before asking the user for browser interaction.

## 🧠 Memory Persistence
To add or update this memory:
- Edit this `CLAUDE.md` file with new tool discoveries or configuration changes.
- Use the `memory` command (if available) or simply tell me to "Update the project memory."
