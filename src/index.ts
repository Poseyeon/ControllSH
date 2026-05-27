/**
 * @file Main entry point for the ControllSH TUI application.
 * Manages the transition between the login screen and the interactive shell.
 */

import * as blessed from 'blessed';
import { login } from './api';
import * as fs from 'fs';
import * as path from 'path';

/**
 * The main screen object for the Terminal User Interface (TUI).
 * Configured for maximum compatibility with remote PTY environments.
 */
export const screen = blessed.screen({
  smartCSR: true,
  title: 'ControllSH TUI',
  fullUnicode: true,
  terminal: 'xterm-256color',
  ignoreDock: true
});

/**
 * Delayed initialization to ensure the PTY connection is fully established
 * before the first render cycle.
 */
setTimeout(() => {
    screen.render();
}, 100);

/**
 * Global resize listener to maintain UI integrity during terminal window changes.
 */
screen.on('resize', () => {
  screen.render();
});

/**
 * Path to the ASCII art logo file.
 */
const logoPath = path.join(process.cwd(), 'public', 'ascii-logo.txt');

/**
 * Processed ASCII art string, converted to Braille characters for high-density rendering.
 */
let logoArt = '';

if (fs.existsSync(logoPath)) {
  const fullArt = fs.readFileSync(logoPath, 'utf8');
  const lines = fullArt.split('\n');
  const h = lines.length;
  const w = Math.max(...lines.map(l => l.length));
  
  const scaledLines: string[] = [];
  for (let y = 0; y < Math.ceil(h / 4); y++) {
    let scaledLine = '';
    for (let x = 0; x < Math.ceil(w / 4); x++) {
      let byte = 0;
      const getPixel = (ox: number, oy: number) => {
        const char = (lines[y * 4 + oy] || '')[x * 4 + ox];
        return char && char !== ' ';
      };

      if (getPixel(0, 0) || getPixel(1, 0)) byte |= 0x01;
      if (getPixel(0, 1) || getPixel(1, 1)) byte |= 0x02;
      if (getPixel(0, 2) || getPixel(1, 2)) byte |= 0x04;
      if (getPixel(0, 3) || getPixel(1, 3)) byte |= 0x40;
      
      if (getPixel(2, 0) || getPixel(3, 0)) byte |= 0x08;
      if (getPixel(2, 1) || getPixel(3, 1)) byte |= 0x10;
      if (getPixel(2, 2) || getPixel(3, 2)) byte |= 0x20;
      if (getPixel(2, 3) || getPixel(3, 3)) byte |= 0x80;
      
      scaledLine += byte === 0 ? ' ' : String.fromCharCode(0x2800 + byte);
    }
    scaledLines.push(scaledLine);
  }
  logoArt = scaledLines.join('\n');
}

/**
 * UI element representing the ASCII logo box.
 */
export const logoBox = blessed.box({
  parent: screen,
  top: 1,
  left: 'center',
  width: '100%',
  height: 9,
  content: logoArt,
  align: 'center',
  style: {
    fg: 'white'
  }
});

/**
 * Login Form Elements
 */

/**
 * Container form for all login-related inputs.
 */
export const loginForm = blessed.form({
  parent: screen,
  keys: true,
  left: 'center',
  top: 12,
  width: '50%',
  height: 12,
  bg: 'blue',
  border: {
    type: 'line'
  },
  content: 'Login'
});

/**
 * Input field for the company identifier.
 */
export const companyInput = blessed.textbox({
  parent: loginForm,
  name: 'company',
  top: 2,
  left: 1,
  height: 3,
  width: '90%',
  content: 'Company',
  border: {
    type: 'line'
  },
  label: ' Company ',
  inputOnFocus: true
});

/**
 * Input field for the username.
 */
export const usernameInput = blessed.textbox({
  parent: loginForm,
  name: 'username',
  top: 5,
  left: 1,
  height: 3,
  width: '90%',
  border: {
    type: 'line'
  },
  label: ' Username ',
  inputOnFocus: true
});

/**
 * Input field for the password (masked).
 */
export const passwordInput = blessed.textbox({
  parent: loginForm,
  name: 'password',
  top: 8,
  left: 1,
  height: 3,
  width: '90%',
  border: {
    type: 'line'
  },
  label: ' Password ',
  censor: true,
  inputOnFocus: true
});

/**
 * Submission button for the login form.
 */
export const loginButton = blessed.button({
  parent: loginForm,
  name: 'submit',
  top: 10,
  left: 'center',
  width: 10,
  height: 3,
  content: 'Login',
  align: 'center',
  valign: 'middle',
  border: {
    type: 'line'
  },
  style: {
    bg: 'green',
    focus: {
      bg: 'red'
    }
  }
});

/**
 * Shell UI Elements
 */

/**
 * Main container for the shell interface.
 * Provides a classic dark theme.
 */
export const shellContainer = blessed.box({
  parent: screen,
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  style: {
    bg: 'black'
  },
  hidden: true
});

/**
 * Log display for the shell output.
 */
export const shellOutput = blessed.log({
  parent: shellContainer,
  top: 0,
  left: 0,
  width: '100%',
  bottom: 1,
  tags: true,
  style: {
    fg: 'white',
    bg: 'black'
  },
  scrollable: true,
  alwaysScroll: true,
  scrollbar: {
    ch: ' ',
    style: {
      bg: 'blue'
    }
  }
});

/**
 * Container for the prompt label.
 */
export const promptLabel = blessed.box({
  parent: shellContainer,
  bottom: 0,
  left: 0,
  width: 12,
  height: 1,
  content: 'controllsh> ',
  style: {
    fg: 'white',
    bg: 'black',
    bold: true
  }
});

/**
 * Text box for entering shell commands.
 */
export const shellInput = blessed.textbox({
  parent: shellContainer,
  bottom: 0,
  left: 12,
  width: '100%-12',
  height: 1,
  inputOnFocus: true,
  style: {
    fg: 'white',
    bg: 'black'
  }
});

/**
 * Transitions the UI from the login screen to the interactive shell.
 */
function showShellUI(): void {
  loginForm.hide();
  logoBox.hide();
  
  shellContainer.show();
  
  shellOutput.log('{bold}Welcome to ControllSH Shell{/bold}');
  shellOutput.log('Type help to see available commands.');
  shellOutput.log('-------------------------------------------');
  
  shellInput.focus();
  screen.render();
}

/**
 * Handler for shell command submission.
 */
shellInput.on('submit', (value: string) => {
  const command = value.trim().toLowerCase();
  shellInput.clearValue();
  
  if (command) {
    shellOutput.log(`controllsh> ${command}`);
    
    switch (command) {
      case 'help':
        shellOutput.log('{bold}Available Commands:{/bold}');
        shellOutput.log('  help     - Show this help message');
        shellOutput.log('  clear    - Clear the terminal');
        shellOutput.log('  exit     - Close the session');
        shellOutput.log('  whoami   - Display current session info');
        break;
      case 'clear':
        shellOutput.setContent('');
        break;
      case 'exit':
        process.exit(0);
        break;
      case 'whoami':
        shellOutput.log('User: {bold}Admin{/bold}');
        shellOutput.log('Role: {bold}Superuser{/bold}');
        break;
      default:
        shellOutput.log(`{red-fg}Unknown command:{/red-fg} ${command}`);
    }
  }
  
  shellInput.focus();
  screen.render();
});

/**
 * Handler for login form submission.
 */
loginButton.on('press', async () => {
  const company = companyInput.getValue();
  const username = usernameInput.getValue();
  const password = passwordInput.getValue();

  if (company && username && password) {
    try {
      const res = await login(company, username, password);
      if (res.status === 201 || res.status === 200) {
        showShellUI();
      } else {
        loginForm.setContent(`Login Failed: ${res.status}`);
        screen.render();
      }
    } catch (error: any) {
        loginForm.setContent(`Error: ${error.message}`);
        screen.render();
    }
  }
});

/**
 * Initial focus on the company input field.
 */
companyInput.focus();

/**
 * Global key listener for application termination.
 */
screen.key(['escape', 'q', 'C-c'], () => {
  return process.exit(0);
});

/**
 * Initial screen render call.
 */
screen.render();
