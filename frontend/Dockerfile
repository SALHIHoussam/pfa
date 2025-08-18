# Étape 1 : Build React
FROM node:20 as build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Étape 2 : Serveur Nginx
FROM nginx:alpine

# Supprime la configuration par défaut
RUN rm -rf /etc/nginx/conf.d/default.conf

# Copie notre configuration Nginx personnalisée
COPY nginx.conf /etc/nginx/conf.d/

# Copie le build React
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
