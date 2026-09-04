FROM node:20-alpine

# Install PostgreSQL 16 client tools (pg_dump, pg_restore, psql)
RUN apk add --no-cache postgresql16-client bash

WORKDIR /app

COPY package*.json tsconfig.json ./
RUN npm install

COPY src/ ./src/
RUN npm run build

# Make dist/index.js executable
RUN chmod +x dist/index.js && npm link

# Create default backup mount volume
VOLUME ["/backups"]
WORKDIR /backups

ENTRYPOINT ["supavault"]
CMD ["--help"]
