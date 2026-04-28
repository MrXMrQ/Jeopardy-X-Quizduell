# Dockerfile (im Hauptverzeichnis)
FROM node:20-alpine

WORKDIR /app

# Kopiere zuerst nur die package.json Dateien für besseres Caching
COPY package*.json ./

# Installiere die Abhängigkeiten
RUN npm install

# Kopiere den gesamten restlichen Code
COPY . .

# Vite muss zwingend mit dem Flag --host gestartet werden, 
# damit es außerhalb des Docker-Containers erreichbar ist!
CMD ["npm", "run", "dev", "--", "--host"]