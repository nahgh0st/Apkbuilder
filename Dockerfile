FROM node:18-alpine

# Install required dependencies
RUN apk add --no-cache \
    openjdk17 \
    gradle \
    git \
    bash \
    unzip \
    wget

# Set Java home
ENV JAVA_HOME=/usr/lib/jvm/java-17-openjdk
ENV PATH=$PATH:$JAVA_HOME/bin

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Create directories for uploads and builds
RUN mkdir -p uploads builds outputs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:3000/ || exit 1

# Start application
CMD ["npm", "start"]
