ARG ALPINE_VERSION=3.22
ARG NODE_VERSION=22.21.1

# LTS Image builder.
FROM node:${NODE_VERSION}-alpine${ALPINE_VERSION} AS builder

# Create app directory inside the image.
WORKDIR /app

# Copy package and lock files.
COPY --chown=node:node package.json ./
COPY --chown=node:node pnpm-lock.yaml ./

# To bundle the app's source code inside the Docker image.
COPY --chown=node:node tsconfig.json ./
COPY --chown=node:node types.d.ts ./
COPY --chown=node:node ./config ./config
COPY --chown=node:node ./src/app ./src/app
COPY --chown=node:node ./src/app.ts ./src/app.ts

# Install all dependencies for build (including dev).
RUN corepack enable && pnpm install --frozen-lockfile

# Run the build script.
RUN pnpm run build


# LTS Image runner.
FROM node:${NODE_VERSION}-alpine${ALPINE_VERSION}

# Install su-exec utility (Alpine doesn't have it by default).
RUN apk add --no-cache su-exec

# Enable Corepack globally for the Node.js installation.
# This ensures `pnpm` is available system-wide.
RUN corepack enable && \
  mkdir -p /home/node/.cache/node/corepack && \
  chown -R node:node /home/node/.cache && \
  # Enable and prepare corepack AS the node user.
  su-exec node corepack enable && \
  su-exec node corepack prepare pnpm@10.23.0 --activate

# To bundle the app's source code inside the Docker image.
COPY --chown=node:node --from=builder /app/package.json ./
COPY --chown=node:node --from=builder /app/pnpm-lock.yaml ./
COPY --chown=node:node --from=builder /app/config ./config
COPY --chown=node:node --from=builder /app/build ./build
COPY --chown=node:node --from=builder /app/src/app/specs ./build/app/specs

# Install app dependencies (production only).
RUN pnpm install --prod --ignore-scripts --frozen-lockfile

# Change user to run app.
USER node

# Expose the port where the app will run.
EXPOSE 9889

# Start the application
CMD [ "pnpm", "start" ]
