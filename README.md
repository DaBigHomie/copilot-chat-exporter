# Copilot Chat Exporter

VS Code extension for exporting GitHub Copilot chat sessions to JSON, Markdown, and PostgreSQL database.

## 🎯 Purpose

Automate the backup and storage of GitHub Copilot chat sessions for:
- Historical analysis and review
- Learning from past conversations
- Sharing insights with team members
- Building a searchable knowledge base

## ⚠️ Current Limitation

**VS Code does not currently expose a public API to access GitHub Copilot chat data programmatically.**

This extension provides:
1. ✅ Database schema and import scripts
2. ✅ Configuration for auto-export (when API becomes available)
3. ✅ Helper commands for manual export workflow
4. ⏳ Placeholder for future automated export (awaiting VS Code API)

## 🚀 Quick Start

### 1. Install Extension

```bash
cd copilot-chat-exporter
npm install
npm run compile
```

### 2. Configure Settings

Add to your workspace `.vscode/settings.json`:

```json
{
  "copilotChatExporter.outputDirectory": ".github/chats",
  "copilotChatExporter.exportFormat": ["json", "markdown"],
  "copilotChatExporter.autoExport": true,
  "copilotChatExporter.databaseEnabled": true,
  "copilotChatExporter.databaseConfig": {
    "host": "localhost",
    "port": 5432,
    "database": "copilot_chats",
    "user": "dame"
  }
}
```

### 3. Manual Export Workflow (Current)

Since VS Code doesn't provide chat export API:

1. **Export Chat Manually**:
   - Click Copilot Chat icon in Activity Bar
   - Click "..." menu → "Export Chat"
   - Save to `exported-ai-chats/` directory

2. **Import to Database**:
   ```bash
   cd .github/scripts
   export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"
   DB_USER=dame node import-cumulative-export-to-db.js
   ```

3. **Query Your Chats**:
   ```sql
   SELECT phase_number, focus 
   FROM session_timeline 
   WHERE session_id = 1 
   ORDER BY phase_number 
   LIMIT 10;
   ```

## 📦 Commands

| Command | Description |
|---------|-------------|
| `Copilot Chat Exporter: Export Current Session` | Guide for manual export |
| `Copilot Chat Exporter: Export All Sessions` | Instructions for bulk export |
| `Copilot Chat Exporter: Setup Auto-Export` | Enable/disable auto-export |

## 🗄️ Database Schema

The extension uses a PostgreSQL database with 9 tables:

- `chat_sessions` - Main session records
- `session_timeline` - Individual conversation turns
- `session_repositories` - Repos involved
- `session_commits` - Commits made
- `session_agents` - AI agents used
- `session_files` - Files modified
- `session_validations` - Quality checks
- `session_artifacts` - Build outputs
- `session_documents` - Documentation created

**Schema Location**: `../.github/scripts/chat-sessions-schema.sql`

## 🔮 Future Enhancement

When VS Code exposes Copilot Chat API:
- ✅ Auto-export on chat close
- ✅ Real-time session monitoring
- ✅ Automatic database sync
- ✅ Session tagging and categorization
- ✅ Search and replay past conversations

## 📊 Query Examples

```sql
-- Recent sessions
SELECT session_date, focus, primary_achievement
FROM chat_sessions
ORDER BY session_date DESC
LIMIT 10;

-- Conversation turns from specific session
SELECT phase_number, LEFT(focus, 100) as preview
FROM session_timeline
WHERE session_id = 1
ORDER BY phase_number;

-- Total turns by session
SELECT cs.session_date, COUNT(st.id) as total_turns
FROM chat_sessions cs
LEFT JOIN session_timeline st ON cs.id = st.session_id
GROUP BY cs.session_date
ORDER BY cs.session_date DESC;
```

## 🛠️ Development

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch mode
npm run watch

# Package extension
npm run package
```

## 📝 Configuration

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `outputDirectory` | string | `.github/chats` | Export destination |
| `exportFormat` | array | `["json", "markdown"]` | Output formats |
| `autoExport` | boolean | `false` | Auto-export on close |
| `databaseEnabled` | boolean | `false` | Enable DB export |
| `databaseConfig` | object | See above | PostgreSQL settings |

## 🔗 Related Scripts

- `../.github/scripts/setup-database.sh` - Database setup
- `../.github/scripts/import-cumulative-export-to-db.js` - Import script
- `../.github/scripts/chat-sessions-schema.sql` - Database schema

## 📄 License

MIT

## 🤝 Contributing

This extension is a workaround for the lack of Copilot Chat API. Once VS Code provides official API access, this extension will be updated to support full automation.

**Current Status**: ⏳ Awaiting VS Code Copilot Chat API

**Issue Tracker**: https://github.com/microsoft/vscode/issues
