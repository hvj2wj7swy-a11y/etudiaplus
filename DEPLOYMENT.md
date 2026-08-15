# Déploiement d'Étudia+

Ce guide couvre le déploiement d'Étudia+ en production.

## Déploiement avec Docker Compose

### 1. Créer un fichier `docker-compose.yml`

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: edudia_db
      POSTGRES_USER: edudia_user
      POSTGRES_PASSWORD: your_secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/schema.sql:/docker-entrypoint-initdb.d/schema.sql
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U edudia_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      DB_HOST: postgres
      DB_PORT: 5432
      DB_USER: edudia_user
      DB_PASSWORD: your_secure_password
      DB_NAME: edudia_db
      NODE_ENV: production
      JWT_SECRET: your_secret_key_change_this
      FRONTEND_URL: http://localhost:3000
    ports:
      - "5000:5000"
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - ./backend/uploads:/app/uploads

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    environment:
      REACT_APP_API_URL: http://localhost:5000/api
    ports:
      - "3000:3000"
    depends_on:
      - backend

volumes:
  postgres_data:
```

### 2. Créer un `Dockerfile` pour le backend

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN mkdir -p uploads

EXPOSE 5000

CMD ["npm", "start"]
```

### 3. Créer un `Dockerfile` pour le frontend

```dockerfile
FROM node:18-alpine as builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/build /usr/share/nginx/html
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### 4. Démarrer avec Docker Compose

```bash
docker-compose up -d
```

## Déploiement sur Heroku

### Backend

```bash
cd backend

# Créer une app Heroku
heroku create your-app-name-api

# Ajouter les variables d'environnement
heroku config:set \
  DB_HOST=your_postgres_host \
  DB_USER=your_user \
  DB_PASSWORD=your_password \
  JWT_SECRET=your_secret_key

# Déployer
git push heroku main
```

### Frontend

```bash
cd frontend

# Créer une app Heroku
heroku create your-app-name-frontend

# Ajouter la variable d'environnement
heroku config:set \
  REACT_APP_API_URL=https://your-app-name-api.herokuapp.com/api

# Déployer
git push heroku main
```

## Déploiement sur AWS

### RDS (PostgreSQL)

1. Créer une instance RDS PostgreSQL
2. Configurer les groupes de sécurité
3. Exécuter le schéma SQL

### EC2 (Backend et Frontend)

1. Créer une instance EC2 Ubuntu
2. Installer Node.js et npm
3. Installer pm2 pour la gestion des processus
4. Déployer le backend et frontend

```bash
# Installer PM2
npm install -g pm2

# Démarrer les applications
pm2 start server.js --name "edudia-backend"
pm2 start npm --name "edudia-frontend" -- start

# Sauvegarder la configuration PM2
pm2 save
```

### CloudFront (CDN)

Créer une distribution CloudFront pour servir le frontend avec un cache performant.

## Déploiement sur DigitalOcean

### Droplet

1. Créer un Droplet Ubuntu 22.04
2. Installer Docker et Docker Compose
3. Cloner le repository
4. Utiliser `docker-compose up -d`

### Managed Database

1. Créer une base de données PostgreSQL gérée
2. Configurer les variables d'environnement

## Variables d'environnement en production

```env
# PostgreSQL
DB_HOST=prod-db.example.com
DB_PORT=5432
DB_USER=edudia_user
DB_PASSWORD=super_secure_password_min_32_chars
DB_NAME=edudia_db

# Server
PORT=5000
NODE_ENV=production

# JWT (générer une clé sécurisée)
JWT_SECRET=use_openssl_rand_base64_32

# API
API_BASE_URL=https://api.edudia.com
FRONTEND_URL=https://edudia.com

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=/app/uploads
```

## Monitoring et Logs

### PM2 Monitoring

```bash
pm2 web        # Accès web sur localhost:9615
pm2 logs       # Voir les logs
pm2 monit      # Monitoring en temps réel
```

### CloudWatch (AWS)

Configurer CloudWatch pour monitorer les logs et les métriques.

### Sentry (Error Tracking)

Intégrer Sentry pour le tracking des erreurs en production.

## Backup et Recovery

### PostgreSQL Backup

```bash
pg_dump -U edudia_user -d edudia_db > backup_$(date +%Y%m%d).sql
```

### Restore

```bash
psql -U edudia_user -d edudia_db < backup_20240115.sql
```

## Performance et Optimisation

1. **Caching**: Ajouter Redis pour le caching
2. **CDN**: Utiliser CloudFront ou Cloudflare
3. **Compression**: Activer gzip sur nginx
4. **Load Balancing**: Mettre en place un équilibrage de charge
5. **Rate Limiting**: Limiter les requêtes API
6. **Database Optimization**: Ajouter des index, optimiser les requêtes

---

**Consultez la documentation officielle de votre plateforme de déploiement pour plus de détails.**
