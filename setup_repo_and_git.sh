#!/bin/bash

# --- Agent 1: Git Repository Fixer ---
echo "🔧 Agent 1: fixing Git configuration..."

# 1. Initialize the root directory as a git repo if it isn't one
if [ ! -d ".git" ]; then
    echo "Initializing new Git repository in $(pwd)..."
    git init
    
    # Rename master to main (standard practice)
    git branch -m main
    
    echo "✅ Repository initialized."
else
    echo "ℹ️  Git repository already exists."
fi

# 2. Create .gitignore to prevent committing the massive export file or system files
if [ ! -f ".gitignore" ]; then
    echo "Creating .gitignore..."
    cat <<EOT >> .gitignore
.DS_Store
node_modules/
# Ignore the massive raw export file (too big for standard git)
github-copilot-chat-export-all-nov-7.json
# Ignore temp logs
*.log
EOT
    echo "✅ .gitignore created."
fi

# 3. Stage the specific folders you were trying to add
echo "Staging .github directory and scripts..."
git add .github/chats/ .github/scripts/ .github/workflows/

echo "✅ Files staged. You can now run 'git commit -m \"Initial setup\"'"

# --- Agent 2 Handoff ---
echo ""
echo "📂 Agent 2: Preparing environment for large file extraction..."
# Ensure the output directories exist
mkdir -p .github/chats/historical
mkdir -p .github/scripts

echo "✅ Setup complete. Please run 'node .github/scripts/process_large_export.js' next."