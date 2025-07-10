# frontend/Dockerfile

# Use Nginx as the base image for serving static files
FROM nginx:alpine

# Copy the frontend application files to the Nginx default public directory
COPY . /usr/share/nginx/html

# Expose port 80 for web traffic
EXPOSE 80

# Start Nginx when the container launches
CMD ["nginx", "-g", "daemon off;"]
