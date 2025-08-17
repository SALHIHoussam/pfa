# Étape 1 : Build React
FROM node:20 as build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Étape 2 : Serveur Nginx
FROM nginx:alpine

# Copier le build React dans Nginx
COPY --from=build /app/build /usr/share/nginx/html

# Copier une config nginx custom (optionnel)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
