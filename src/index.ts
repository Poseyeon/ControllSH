// src/index.ts
import * as blessed from 'blessed';
import axios from 'axios';

// Create a screen object.
const screen = blessed.screen({
  smartCSR: true,
  title: 'REST API TUI'
});

// Create a box for the response
const responseBox = blessed.box({
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
  }
});

// Create an input for the API endpoint
const endpointInput = blessed.textbox({
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
  }
});

// Create a button to send the request
const sendButton = blessed.button({
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
  }
});

// Append our elements to the screen.
screen.append(responseBox);
screen.append(endpointInput);
screen.append(sendButton);

// Handle button click
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

// Focus on the input
endpointInput.focus();

// Quit on Escape, q, or Control-C.
screen.key(['escape', 'q', 'C-c'], (ch, key) => {
  return process.exit(0);
});

// Render the screen.
screen.render();
