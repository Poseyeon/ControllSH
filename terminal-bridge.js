/**
 * @file Terminal bridge server.
 * Establishes a WebSocket server that bridges a pseudo-terminal (PTY) 
 * to a frontend using raw data transmission.
 */

const os = require('os');
const pty = require('node-pty');
const WebSocket = require('ws');

/**
 * The default shell to use for the PTY process.
 * @type {string}
 */
const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';

/**
 * The WebSocket server instance.
 * @type {WebSocket.Server}
 */
const wss = new WebSocket.Server({ port: 7681 });

console.log('Terminal bridge started on port 7681');

/**
 * Event listener for new WebSocket connections.
 * Handles the spawning of the PTY process and bridging data between 
 * the WebSocket and the PTY.
 */
wss.on('connection', (ws) => {
    console.log('Frontend connected to terminal');

    /**
     * The spawned PTY process running the Node.js application.
     * @type {pty.IPty}
     */
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

    /**
     * Forwards data from the PTY process to the WebSocket client.
     */
    ptyProcess.onData((data) => {
        if (ws.readyState === WebSocket.OPEN) {
            // Sending binary data is safer for complex TUI/Unicode
            ws.send(Buffer.from(data, 'utf-8'));
        }
    });

    /**
     * Handles incoming messages from the WebSocket client.
     * Supports raw terminal input and specific JSON messages for resizing.
     */
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

    /**
     * Cleans up the PTY process when the WebSocket connection is closed.
     */
    ws.on('close', () => {
        console.log('Frontend disconnected');
        ptyProcess.kill();
    });
});
