#!/bin/bash

# --- Agent 3: Automation Architect ---
# Run this script at the end of your day or active session.

DATE=$(date +%Y-%m-%d)
TIMESTAMP=$(date +%H:%M:%S)
CHAT_DIR=".github/chats"
CURRENT_SESSION="$CHAT_DIR/$DATE.md"

echo "🤖 Agent 3: Saving daily snapshot for $DATE..."

# 1. Run the extraction script (assuming you have one for live extraction)
# If not, we create a placeholder or copy the manual buffer
if [ -f "extract-and-save-sessions.js" ]; then
    node extract-and-save-sessions.js
else
    echo "⚠️  Live extraction script not found. Saving git state snapshot only."
fi

# 2. Git Safety Check
if [ ! -d ".git" ]; then
    echo "❌ Error: Not a git repo. Run setup_repo_and_git.sh first."
    exit 1
fi

# 3. Add and Commit
echo "📦 Staging new chat logs..."
git add .github/chats/

# Check if there are changes to commit
if git diff-index --quiet HEAD --; then
    echo "✅ No changes to save since last snapshot."
else
    git commit -m "docs(chats): auto-save session $DATE at $TIMESTAMP"
    echo "✅ Snapshot committed locally."
fi

# 4. Stat Summary
echo "📊 Current Stats:"
COUNT=$(find .github/chats -name "*.json" | wc -l)
echo "   Total Saved Sessions: $COUNT"