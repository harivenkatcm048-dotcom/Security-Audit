# ==============================================================================
# Nexentra Security Audit Engine - Docker Container for Render / Cloud Hosting
# ==============================================================================
# Combines Node.js 20 LTS runtime with Python 3.11+ for heuristic security audits
FROM node:20-bookworm-slim

# Install Python 3, pip, curl, git, and networking utilities
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    curl \
    git \
    dnsutils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 1. Install Python dependencies for the core audit engine
COPY requirements.txt ./
RUN pip3 install --no-cache-dir --break-system-packages -r requirements.txt

# 2. Install Node.js backend dependencies
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm install --production

# 3. Copy full project source code
WORKDIR /app
COPY . .

# 4. Create reports directory with write permissions
RUN mkdir -p /app/reports && chmod -R 777 /app/reports

# 5. Environment configuration
ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000

# 6. Start the Node.js API backend
CMD ["node", "backend/server.js"]
