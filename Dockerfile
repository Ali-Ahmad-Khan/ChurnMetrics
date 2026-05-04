FROM python:3.11-slim

# Install Node.js
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean

WORKDIR /app

# Copy Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy package files for both client and server
COPY client/package.json client/
COPY server/package.json server/

# Install dependencies
RUN cd client && npm install
RUN cd server && npm install

# Copy all source code
COPY . .

# Build the React frontend
RUN cd client && VITE_API_BASE=/api npm run build

# Set environment variables
ENV NODE_ENV=production
ENV FASTAPI_URL=http://127.0.0.1:8000
ENV PORT=7860

# Make the start script executable
RUN chmod +x start.sh

# Expose the standard Hugging Face port
EXPOSE 7860

# Start both servers
CMD ["./start.sh"]
