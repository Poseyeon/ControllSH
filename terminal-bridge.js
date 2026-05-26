const os = require('os');
const pty = require('node-pty');
const WebSocket = require('ws');

const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';

// Start the WebSocket server on port 7681
const wss = new WebSocket.Server({ port: 7681 });

console.log('Terminal bridge started on port 7681');

wss.on('connection', (ws) => {
    console.log('Frontend connected to terminal');

    // Spawn the actual terminal process (your app)
    const ptyProcess = pty.spawn('node', ['dist/index.js'], {
        name: 'xterm-256color',
        cols: 150, // Increased width for the wide logo
        rows: 40,
        cwd: process.cwd(),
        env: { 
            ...process.env, 
            TERM: 'xterm-256color',
            LANG: 'en_US.UTF-8',
            LC_ALL: 'en_US.UTF-8',
            API_URL: process.env.API_URL || 'http://host.docker.internal:3000'
        }
    });

    // Send data from PTY to Frontend (Raw Binary)
    ptyProcess.onData((data) => {
        if (ws.readyState === WebSocket.OPEN) {
            // Sending binary data is safer for complex TUI/Unicode
            ws.send(Buffer.from(data, 'utf-8'));
        }
    });

    // Receive data from Frontend and write to PTY (Raw)
    ws.on('message', (message) => {
        let data;
        if (Buffer.isBuffer(message)) {
            data = message.toString();
        } else if (typeof message === 'string') {
            data = message;
        } else {
            // Handle ArrayBuffer from some WebSocket implementations
            data = Buffer.from(message).toString();
        }
        
        // Check for resize message from xterm.js (often sent as a stringified JSON)
        try {
            if (data.startsWith('{')) {
                const json = JSON.parse(data);
                if (json.type === 'resize' && json.cols && json.rows) {
                    ptyProcess.resize(json.cols, json.rows);
                    return;
                }
            }
        } catch (e) {}

        ptyProcess.write(data);
    });

    ws.on('close', () => {
        console.log('Frontend disconnected');
        ptyProcess.kill();
    });
});
