/**
 * Agent 2: Data Archivist
 * Script: process_large_export.js
 * Purpose: Stream-read the 289MB export file and split it into individual files
 * by session, avoiding memory crashes.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// CONFIGURATION
const SOURCE_FILE = path.join(__dirname, '../../github-copilot-chat-export-all-nov-7.json');
const OUTPUT_DIR = path.join(__dirname, '../chats/historical');

// Ensure output dir exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log(`🔍 Agent 2: scanning ${SOURCE_FILE}...`);

if (!fs.existsSync(SOURCE_FILE)) {
    console.error("❌ Source export file not found. Please ensure the file exists at the path above.");
    process.exit(1);
}

// We use a stream because 289MB is large for a single string buffer
const fileStream = fs.createReadStream(SOURCE_FILE);
const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
});

let sessionCount = 0;
let buffer = '';
let isReadingSession = false;

// NOTE: This logic assumes the export file is a JSON array of objects.
// Since standard JSON parses the whole file at once, we are doing a
// "poor man's stream parse" looking for object boundaries if it's formatted.
// If it is one single line minified JSON, we fall back to a different strategy.

console.log("⏳ Reading stream (this may take a moment)...");

// STRATEGY B: The file is likely a valid JSON array. 
// For 289MB, Node.js (V8) can typically handle JSON.parse() if you have 
// enough RAM (approx 1GB free). We will try the direct parse first as it's cleaner.
// If this fails, we would need a library like 'stream-json'.

try {
    const fileContent = fs.readFileSync(SOURCE_FILE, 'utf8');
    console.log("✅ File loaded into memory. Parsing JSON...");
    
    const data = JSON.parse(fileContent);
    
    // Check if it's the expected structure (array of sessions)
    // Adjust 'requests' based on your previous logs indicating "requests array at line 15"
    const sessions = Array.isArray(data) ? data : (data.requests || []);

    console.log(`✅ JSON Parsed. Found ${sessions.length} sessions.`);

    sessions.forEach((session, index) => {
        // Extract a date
        let dateStr = 'unknown-date';
        let timestamp = new Date().toISOString();

        // Try to find a timestamp in common fields
        if (session.createdAt) timestamp = session.createdAt;
        else if (session.timestamp) timestamp = session.timestamp;
        else if (session.date) timestamp = session.date;

        try {
            const dateObj = new Date(timestamp);
            if (!isNaN(dateObj)) {
                dateStr = dateObj.toISOString().split('T')[0];
            }
        } catch (e) { }

        // Create a unique filename
        const filename = `${dateStr}_session_${index + 1}.json`;
        const filePath = path.join(OUTPUT_DIR, filename);

        // Save individual session
        fs.writeFileSync(filePath, JSON.stringify(session, null, 2));
        sessionCount++;
        
        if (sessionCount % 50 === 0) process.stdout.write('.');
    });

    console.log(`\n\n🎉 Success! Extracted ${sessionCount} sessions to ${OUTPUT_DIR}`);
    console.log("💡 You can now git add these files (if they aren't too large individually).");

} catch (err) {
    if (err.message.includes("Invalid string length") || err.message.includes("heap")) {
        console.error("\n❌ Error: File is too large for standard memory parsing.");
        console.error("recommendation: Run 'npm install stream-json' and use a streaming parser library.");
    } else {
        console.error("\n❌ Error parsing JSON:", err.message);
    }
}