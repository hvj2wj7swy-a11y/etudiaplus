# 🚀 Guide de démarrage rapide - Étudia+

Bienvenue dans **Étudia+** ! Voici comment commencer en 5 minutes.

## ⚡ Installation rapide

### 1️⃣ Prérequis

- Node.js 16+ ([Télécharger](https://nodejs.org))
- PostgreSQL 12+ ([Télécharger](https://www.postgresql.org/download))
- Git ([Télécharger](https://git-scm.com))

### 2️⃣ Configuration de la base de données

```bash
# Accéder à PostgreSQL
sudo -u postgres psql

# Exécuter dans la console PostgreSQL:
CREATE DATABASE edudia_db;
CREATE USER edudia_user WITH PASSWORD 'password123';
ALTER ROLE edudia_user SET client_encoding TO 'utf8';
ALTER ROLE edudia_user SET default_transaction_isolation TO 'read committed';
GRANT ALL PRIVILEGES ON DATABASE edudia_db TO edudia_user;
\q

# Importer le schéma
psql -U edudia_user -d edudia_db < database/schema.sql
```

### 3️⃣ Configuration du Backend

```bash
cd backend

# Copier et éditer les variables d'environnement
cp .env.example .env

# Éditer .env avec vos paramètres PostgreSQL
# (utilisez un éditeur de texte)

# Installer les dépendances
npm install

# Démarrer le serveur
npm run dev
```

✅ Backend prêt sur `http://localhost:5000`

### 4️⃣ Configuration du Frontend

```bash
cd ../frontend

# Copier les variables d'environnement
cp .env.example .env

# Installer les dépendances
npm install

# Démarrer l'application
npm start
```

✅ Frontend prêt sur `http://localhost:3000`

## 🎯 Premières étapes

### 1. Créer un compte

1. Ouvrir `http://localhost:3000`
2. Cliquer sur "S'inscrire"
3. Remplir le formulaire avec vos informations
4. Cliquer sur "S'inscrire"

### 2. Explorer les fonctionnalités

- **Tableau de bord** 📊 : Vue d'ensemble de vos activités
- **Documents** 📄 : Parcourir la bibliothèque
- **Forum** 💬 : Poser des questions, répondre
- **Téléverser** 📤 : Partager vos documents

### 3. Tester les fonctionnalités

#### Téléverser un document
1. Cliquer sur "Téléverser"
2. Remplir le formulaire
3. Ajouter un fichier (PDF, Word ou PowerPoint)
4. Cliquer sur "Téléverser le document"

#### Poser une question
1. Aller au Forum
2. Cliquer sur "Poser une question"
3. Écrire votre question
4. Publier

#### Répondre à une question
1. Sélectionner une question
2. Écrire votre réponse
3. Publier
4. Voter sur les réponses utiles

## 📚 Documentation complète

| Document | Contenu |
|----------|---------|
| [README.md](README.md) | Vue d'ensemble du projet |
| [INSTALLATION.md](INSTALLATION.md) | Installation détaillée |
| [API_DOCUMENTATION.md](API_DOCUMENTATION.md) | Endpoints API complets |
| [USER_GUIDE.md](USER_GUIDE.md) | Guide d'utilisation |
| [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md) | Guide pour développeurs |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Déploiement en production |
| [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) | Structure du projet |

## 🔧 Commandes utiles

### Backend

```bash
cd backend

npm install              # Installer les dépendances
npm run dev             # Mode développement (avec nodemon)
npm start               # Mode production
```

### Frontend

```bash
cd frontend

npm install              # Installer les dépendances
npm start               # Lancer l'application
npm build               # Build pour production
npm test                # Exécuter les tests
```

## 🐛 Dépannage

### Erreur: "Cannot find module"
```bash
# Réinstaller les dépendances
rm -rf node_modules package-lock.json
npm install
```

### Erreur: "Port already in use"
```bash
# Backend sur un autre port
PORT=5001 npm run dev

# Frontend sur un autre port
PORT=3001 npm start
```

### Erreur PostgreSQL
- Vérifier que PostgreSQL est en cours d'exécution
- Vérifier les paramètres dans `.env`
- Vérifier que la base de données est créée

### API n'est pas accessible
- Vérifier que le backend fonctionne: `http://localhost:5000`
- Vérifier que CORS est configuré correctement
- Consulter la console du navigateur pour les erreurs

## 📊 Architecture

```
Frontend (React)
    ↓ HTTP/HTTPS
API (Express.js)
    ↓ SQL
PostgreSQL
```

## 🎓 Apprendre plus

- **React**: https://react.dev
- **Express**: https://expressjs.com
- **PostgreSQL**: https://www.postgresql.org/docs
- **Bootstrap**: https://getbootstrap.com

## 💡 Conseils

✅ **À faire**
- Lire la [documentation d'installation](INSTALLATION.md)
- Consulter les [guides de développement](DEVELOPMENT_GUIDE.md)
- Vérifier les [variables d'environnement](backend/.env.example)
- Tester l'[API](API_DOCUMENTATION.md) avec Postman

❌ **À ne pas faire**
- Commettre les fichiers `.env` ou `node_modules`
- Utiliser des mots de passe faibles en production
- Exposer les clés secrètes dans le code

## 🚀 Prochaines étapes

1. ✅ Installation complétée
2. 📖 Lire la [documentation complète](README.md)
3. 🛠️ Consulter le [guide de développement](DEVELOPMENT_GUIDE.md)
4. 📝 Implémenter des fonctionnalités supplémentaires
5. 🚀 Déployer en production ([guide](DEPLOYMENT.md))

## 📞 Besoin d'aide?

1. Consulter la [FAQ](README.md#faq)
2. Lire les [guides](.)
3. Vérifier les logs: `npm run dev` affiche les erreurs
4. Consulter la [documentation API](API_DOCUMENTATION.md)

---

**Félicitations! 🎉 Vous êtes prêt à utiliser Étudia+!**

**Bon développement! 💻✨**
