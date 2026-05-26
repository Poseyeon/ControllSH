# ControllSH

To generate the code documentation enter the command:

```cmd
npx typedoc
```

## Docker Setup

To build and start the container with `ttyd`, use the following commands:

### Build the Image
```bash
docker build -t controllsh .
```

### Start the Container
```bash
docker run -p 7681:7681 -e API_URL=http://host.docker.internal:3000 controllsh
```

After starting the container, you can access the terminal in your browser at `http://localhost:7681`. To integrate this into your Angular frontend, you can use a terminal library like `xterm.js` that connects to the `ttyd` websocket.