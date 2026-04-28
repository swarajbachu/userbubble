FROM node:22-slim

# Install git and gh CLI for repo operations
RUN apt-get update && apt-get install -y \
  git \
  curl \
  && curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg \
  && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | tee /etc/apt/sources.list.d/github-cli.list > /dev/null \
  && apt-get update \
  && apt-get install -y gh \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY apps/worker/package.json apps/worker/
COPY packages/db/package.json packages/db/

# Install dependencies
RUN corepack enable && pnpm install --frozen-lockfile

# Copy source
COPY apps/worker/ apps/worker/
COPY packages/db/ packages/db/

# Build
RUN pnpm --filter @userbubble/worker build

EXPOSE 8080

CMD ["node", "apps/worker/dist/server.js"]
