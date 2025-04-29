# Use official Node.js slim image
FROM node:20-alpine

# Set working directory inside the container
WORKDIR /app

# Only copy package.json and package-lock.json first
COPY package.json package-lock.json* ./

# Install dependencies inside the container
RUN npm install

# Then copy the rest of the frontend files
COPY . .

# Default command keeps container alive (you manually npm run dev inside)
CMD ["tail", "-f", "/dev/null"]
