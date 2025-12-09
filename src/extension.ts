import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { Pool } from 'pg';

let dbPool: Pool | null = null;

export function activate(context: vscode.ExtensionContext) {
    console.log('Copilot Chat Exporter is now active');

    // Initialize database connection if enabled
    const config = vscode.workspace.getConfiguration('copilotChatExporter');
    if (config.get('databaseEnabled')) {
        initDatabase();
    }

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('copilot-chat-exporter.exportCurrentSession', exportCurrentSession)
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('copilot-chat-exporter.exportAllSessions', exportAllSessions)
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('copilot-chat-exporter.setupAutoExport', setupAutoExport)
    );

    // Monitor chat panel state (if API becomes available)
    // Currently VS Code doesn't expose Copilot Chat API
    // This is a placeholder for future implementation
}

export function deactivate() {
    if (dbPool) {
        dbPool.end();
    }
}

function initDatabase() {
    const config = vscode.workspace.getConfiguration('copilotChatExporter');
    const dbConfig: any = config.get('databaseConfig');

    dbPool = new Pool({
        host: dbConfig.host,
        port: dbConfig.port,
        database: dbConfig.database,
        user: dbConfig.user,
        password: dbConfig.password || ''
    });

    vscode.window.showInformationMessage('Database connection initialized');
}

async function exportCurrentSession() {
    vscode.window.showWarningMessage(
        '⚠️ VS Code does not currently provide an API to access Copilot Chat sessions programmatically. ' +
        'Manual export via File > Export Chat is required.'
    );

    const choice = await vscode.window.showInformationMessage(
        'Would you like to open the chat export guide?',
        'Yes', 'No'
    );

    if (choice === 'Yes') {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (workspaceFolder) {
            const guidePath = path.join(
                workspaceFolder.uri.fsPath,
                '.github/scripts/IMPORT_INSTRUCTIONS.md'
            );
            
            if (fs.existsSync(guidePath)) {
                const doc = await vscode.workspace.openTextDocument(guidePath);
                vscode.window.showTextDocument(doc);
            }
        }
    }
}

async function exportAllSessions() {
    vscode.window.showInformationMessage(
        'To export all chat sessions: \n' +
        '1. Click on Copilot Chat icon\n' +
        '2. Use "Export Chat" from the menu\n' +
        '3. Save to .github/chats/ directory\n' +
        '4. Run import script to load into database'
    );
}

async function setupAutoExport() {
    const config = vscode.workspace.getConfiguration('copilotChatExporter');
    const currentValue = config.get('autoExport');

    const newValue = await vscode.window.showQuickPick(
        ['Enable', 'Disable'],
        {
            placeHolder: `Auto-export is currently ${currentValue ? 'enabled' : 'disabled'}`
        }
    );

    if (newValue) {
        await config.update('autoExport', newValue === 'Enable', vscode.ConfigurationTarget.Workspace);
        vscode.window.showInformationMessage(
            `Auto-export ${newValue === 'Enable' ? 'enabled' : 'disabled'}. ` +
            '(Note: Requires VS Code API support for Copilot Chat)'
        );
    }
}

// Helper function to export session data (for when API becomes available)
async function exportSessionData(sessionData: any) {
    const config = vscode.workspace.getConfiguration('copilotChatExporter');
    const outputDir = config.get('outputDirectory') as string;
    const formats = config.get('exportFormat') as string[];

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
        vscode.window.showErrorMessage('No workspace folder open');
        return;
    }

    const fullOutputPath = path.join(workspaceFolder.uri.fsPath, outputDir);

    // Create directory if it doesn't exist
    if (!fs.existsSync(fullOutputPath)) {
        fs.mkdirSync(fullOutputPath, { recursive: true });
    }

    const date = new Date().toISOString().split('T')[0];
    const timestamp = Date.now();

    // Export JSON
    if (formats.includes('json')) {
        const jsonPath = path.join(fullOutputPath, `${date}-${timestamp}.json`);
        fs.writeFileSync(jsonPath, JSON.stringify(sessionData, null, 2));
        vscode.window.showInformationMessage(`Exported to ${jsonPath}`);
    }

    // Export Markdown
    if (formats.includes('markdown')) {
        const mdPath = path.join(fullOutputPath, `${date}.md`);
        const markdown = generateMarkdown(sessionData);
        fs.writeFileSync(mdPath, markdown);
        vscode.window.showInformationMessage(`Exported to ${mdPath}`);
    }

    // Export to database
    if (config.get('databaseEnabled') && dbPool) {
        await exportToDatabase(sessionData);
    }
}

function generateMarkdown(sessionData: any): string {
    return `# Chat Session - ${new Date().toLocaleDateString()}

## Summary
- **Date**: ${new Date().toISOString()}
- **Messages**: ${sessionData.messages?.length || 0}
- **Focus**: ${sessionData.focus || 'General'}

## Conversation

${sessionData.messages?.map((msg: any, idx: number) => 
    `### Message ${idx + 1} (${msg.role})\n\n${msg.content}\n`
).join('\n') || 'No messages'}

---
*Exported by Copilot Chat Exporter*
`;
}

async function exportToDatabase(sessionData: any) {
    if (!dbPool) return;

    try {
        const client = await dbPool.connect();
        
        await client.query('BEGIN');

        const result = await client.query(`
            INSERT INTO chat_sessions (
                session_date, 
                status, 
                focus,
                timestamp_start
            ) VALUES ($1, $2, $3, $4)
            RETURNING id
        `, [
            new Date().toISOString().split('T')[0],
            'COMPLETED',
            sessionData.focus || 'Exported Chat Session',
            new Date().toISOString()
        ]);

        const sessionId = result.rows[0].id;

        // Insert conversation turns
        if (sessionData.messages) {
            for (let i = 0; i < sessionData.messages.length; i++) {
                const msg = sessionData.messages[i];
                await client.query(`
                    INSERT INTO session_timeline (
                        session_id,
                        phase_number,
                        phase_name,
                        focus,
                        status,
                        start_date
                    ) VALUES ($1, $2, $3, $4, $5, $6)
                `, [
                    sessionId,
                    i + 1,
                    `Message ${i + 1}`,
                    msg.content.substring(0, 500),
                    'COMPLETED',
                    new Date().toISOString().split('T')[0]
                ]);
            }
        }

        await client.query('COMMIT');
        client.release();

        vscode.window.showInformationMessage(`Exported to database (Session ID: ${sessionId})`);
    } catch (error) {
        vscode.window.showErrorMessage(`Database export failed: ${error}`);
    }
}
