# Processus d'installation et configuration d'Étudia+

## 1. Configuration de la base de données PostgreSQL

### Créer la base de données et l'utilisateur

```sql
-- Accéder à PostgreSQL
sudo -u postgres psql

-- Créer la base de données
CREATE DATABASE edudia_db;

-- Créer l'utilisateur
CREATE USER edudia_user WITH PASSWORD 'your_secure_password_here';

-- Accorder les permissions
ALTER ROLE edudia_user SET client_encoding TO 'utf8';
ALTER ROLE edudia_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE edudia_user SET default_transaction_deferrable TO on;
ALTER ROLE edudia_user SET default_transaction_read_only TO off;
GRANT ALL PRIVILEGES ON DATABASE edudia_db TO edudia_user;

-- Quitter
\q
```

### Importer le schéma

```bash
psql -U edudia_user -d edudia_db < database/schema.sql
```

## 2. Configuration du Backend

### Étape 1 : Installer les dépendances

```bash
cd backend
npm install
```

### Étape 2 : Configurer les variables d'environnement

```bash
cp .env.example .env
```

Éditer le fichier `.env` :

```env
# PostgreSQL Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=edudia_user
DB_PASSWORD=your_secure_password_here
DB_NAME=edudia_db

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_super_secret_key_change_in_production_12345
JWT_EXPIRE=7d

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads

# API Configuration
API_BASE_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000
```

### Étape 3 : Créer le dossier uploads

```bash
mkdir uploads
touch uploads/.gitkeep
```

### Étape 4 : Démarrer le backend

```bash
# Mode développement (avec nodemon)
npm run dev

# Mode production
npm start
```

Le backend sera disponible sur: `http://localhost:5000`

## 3. Configuration du Frontend

### Étape 1 : Installer les dépendances

```bash
cd frontend
npm install
```

### Étape 2 : Configurer les variables d'environnement

```bash
cp .env.example .env
```

Éditer le fichier `.env` :

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_MAX_FILE_SIZE=10485760
```

### Étape 3 : Démarrer le frontend

```bash
npm start
```

L'application sera disponible sur: `http://localhost:3000`

## 4. Test du système

### Créer un compte test

1. Aller sur `http://localhost:3000/register`
2. Remplir le formulaire d'inscription
3. Cliquer sur "S'inscrire"

### Tester les fonctionnalités

- ✅ Connexion/Déconnexion
- ✅ Profil utilisateur
- ✅ Téléversement de document
- ✅ Recherche de documents
- ✅ Création de questions au forum
- ✅ Réponses aux questions
- ✅ Tableau de bord

## 5. Structure des fichiers

```
Étudia+/
├── backend/
│   ├── src/
│   │   ├── app.js              # Configuration Express
│   │   ├── models/             # Modèles de données
│   │   │   ├── User.js
│   │   │   ├── Document.js
│   │   │   ├── ForumQuestion.js
│   │   │   └── ForumAnswer.js
│   │   ├── routes/             # Routes API
│   │   │   ├── authRoutes.js
│   │   │   ├── userRoutes.js
│   │   │   ├── documentRoutes.js
│   │   │   ├── forumRoutes.js
│   │   │   └── dashboardRoutes.js
│   │   ├── controllers/        # Logique métier
│   │   │   ├── authController.js
│   │   │   ├── userController.js
│   │   │   ├── documentController.js
│   │   │   ├── forumController.js
│   │   │   └── dashboardController.js
│   │   ├── middleware/         # Middlewares
│   │   │   └── authMiddleware.js
│   │   ├── config/             # Configuration
│   │   │   └── database.js
│   │   └── utils/              # Utilitaires
│   │       └── tokenUtils.js
│   ├── uploads/                # Dossier des fichiers téléversés
│   ├── server.js               # Point d'entrée
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── App.js              # Composant principal
│   │   ├── index.js            # Point d'entrée React
│   │   ├── pages/              # Pages
│   │   │   ├── LoginPage.js
│   │   │   ├── RegisterPage.js
│   │   │   ├── DashboardPage.js
│   │   │   ├── DocumentsPage.js
│   │   │   ├── ForumPage.js
│   │   │   └── UploadPage.js
│   │   ├── components/         # Composants
│   │   │   ├── Navigation.js
│   │   │   └── ProtectedRoute.js
│   │   ├── services/           # Services API
│   │   │   └── api.js
│   │   ├── context/            # Contexte React
│   │   │   └── AuthContext.js
│   │   └── styles/             # Styles
│   │       └── main.css
│   ├── public/
│   │   └── index.html
│   ├── package.json
│   └── .env
│
├── database/
│   ├── schema.sql              # Schéma PostgreSQL
│   └── init.sql                # Données initiales
│
└── README.md
```

## 6. Dépannage

### Port déjà utilisé

Si le port 5000 ou 3000 est déjà utilisé:

```bash
# Backend - Changer le port
PORT=5001 npm run dev

# Frontend - Changer le port
PORT=3001 npm start
```

### Erreur de connexion à PostgreSQL

Vérifier les paramètres de connexion dans `.env`:
- Nom d'utilisateur et mot de passe corrects
- Base de données créée
- PostgreSQL en cours d'exécution

### Erreur CORS

S'assurer que le `FRONTEND_URL` dans `.env` du backend correspond au port du frontend.

## 7. Commandes utiles

```bash
# Backend
npm install        # Installer les dépendances
npm run dev       # Démarrer en mode développement
npm start         # Démarrer en mode production

# Frontend
npm install        # Installer les dépendances
npm start          # Démarrer l'application
npm build          # Créer un build production
npm test           # Exécuter les tests
```

## 8. Prochaines étapes

1. Déployer sur un serveur (Heroku, AWS, DigitalOcean)
2. Mettre en place un système de cache (Redis)
3. Ajouter des tests unitaires et d'intégration
4. Configurer un pipeline CI/CD
5. Ajouter une application mobile (React Native)
6. Intégrer Cloudinary pour le stockage des fichiers

---

**Bonne chance avec Étudia+!** 🎉
