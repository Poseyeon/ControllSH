# --- Build Stage ---
FROM node:20-bookworm AS builder

# Install build dependencies for native modules (node-pty)
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
# Compile TypeScript to JavaScript
RUN npx tsc

# --- Runtime Stage ---
FROM node:20-bookworm-slim

# Install runtime dependencies and setup locales for UTF-8 support
RUN apt-get update && apt-get install -y \
    python3 \
    locales \
    && sed -i -e 's/# en_US.UTF-8 UTF-8/en_US.UTF-8 UTF-8/' /etc/locale.gen \
    && locale-gen \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Set environment variables for UTF-8 and Terminal
ENV LANG=en_US.UTF-8
ENV LANGUAGE=en_US:en
ENV LC_ALL=en_US.UTF-8
ENV TERM=xterm-256color
ENV NODE_ENV=production

# Copy built files
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/terminal-bridge.js ./terminal-bridge.js

# Expose the WebSocket port
EXPOSE 7681

# Start the raw WebSocket-PTY bridge
CMD ["node", "terminal-bridge.js"]
