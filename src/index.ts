/**
 * @file Main entry point for the REST API TUI application.
 * Handles the login flow and transitions to the main request interface.
 */

import * as blessed from 'blessed';
import axios from 'axios';
import { login } from './api';

/**
 * The main screen object for the TUI.
 */
export const screen = blessed.screen({
  smartCSR: true,
  title: 'REST API TUI'
});

/**
 * Main UI Elements (hidden initially)
 */

/**
 * Box to display API responses.
 */
export const responseBox = blessed.box({
  top: 0,
  left: 0,
  width: '100%',
  height: '90%',
  content: '{bold}API Response{/bold}',
  tags: true,
  border: {
    type: 'line'
  },
  style: {
    fg: 'white',
    bg: 'black',
    border: {
      fg: '#f0f0f0'
    }
  },
  hidden: true
});

/**
 * Text input for the API endpoint URL.
 */
export const endpointInput = blessed.textbox({
  bottom: 0,
  left: 0,
  width: '80%',
  height: 3,
  inputOnFocus: true,
  border: {
    type: 'line'
  },
  style: {
    fg: 'white',
    bg: 'black',
    border: {
        fg: '#f0f0f0'
    },
    focus: {
        border: {
            fg: 'blue'
        }
    }
  },
  hidden: true
});

/**
 * Button to trigger the API request.
 */
export const sendButton = blessed.button({
  bottom: 0,
  right: 0,
  width: '20%',
  height: 3,
  content: 'Send',
  align: 'center',
  valign: 'middle',
  border: {
    type: 'line'
  },
  style: {
    fg: 'white',
    bg: 'blue',
    border: {
        fg: '#f0f0f0'
    },
    focus: {
        bg: 'green'
    },
    hover: {
        bg: 'green'
    }
  },
  hidden: true
});

/**
 * Login UI Elements
 */

/**
 * Form container for login inputs.
 */
export const loginForm = blessed.form({
  parent: screen,
  keys: true,
  left: 'center',
  top: 'center',
  width: '50%',
  height: 12,
  bg: 'blue',
  border: {
    type: 'line'
  },
  content: 'Login'
});

/**
 * Input field for the company name.
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
 * Input field for the password (censored).
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
 * Button to submit the login form.
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


// Append main elements (initially hidden)
screen.append(responseBox);
screen.append(endpointInput);
screen.append(sendButton);

/**
 * Hides the login form and displays the main API interface.
 */
function showMainUI() {
  loginForm.hide();
  responseBox.show();
  endpointInput.show();
  sendButton.show();
  endpointInput.focus();
  screen.render();
}

// Handle login submission
loginButton.on('press', async () => {
  const company = companyInput.getValue();
  const username = usernameInput.getValue();
  const password = passwordInput.getValue();

  if (company && username && password) {
    try {
      const res = await login(company, username, password);
      if (res.status === 201) {
        showMainUI();
      } else {
        // Simple error handling
        loginForm.setContent(`Login Failed: ${res.status}`);
        screen.render();
      }
    } catch (error: any) {
        loginForm.setContent(`Error: ${error.message}`);
        screen.render();
    }
  }
});

// Handle button click for main UI
sendButton.on('press', async () => {
  const endpoint = endpointInput.getValue();
  if (endpoint) {
    responseBox.setContent('Loading...');
    screen.render();
    try {
      const response = await axios.get(endpoint);
      responseBox.setContent(JSON.stringify(response.data, null, 2));
    } catch (error: any) {
      responseBox.setContent(`Error: ${error.message}`);
    }
    screen.render();
  }
});

// Focus on company input initially
companyInput.focus();

// Quit on Escape, q, or Control-C.
screen.key(['escape', 'q', 'C-c'], (ch, key) => {
  return process.exit(0);
});

// Render the screen.
screen.render();


