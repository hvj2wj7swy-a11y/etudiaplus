# 📚 Étudia+ - Plateforme Académique pour Étudiants

Étudia+ est une plateforme web et mobile destinée aux étudiants pour faciliter le partage de ressources académiques, l'entraide et la réussite scolaire.

## 🎯 Objectif

Créer un écosystème collaboratif où les étudiants peuvent :
- Partager des ressources académiques (documents, notes, résumés)
- Obtenir de l'aide via un forum étudiant
- Contribuer à la communauté et gagner des points
- Suivre leur progression académique

## 👥 Types d'utilisateurs

- **Étudiants** : Utilisateurs principaux qui contribuent et accèdent aux ressources
- **Administrateurs** : Modèrent le contenu et gèrent la plateforme

## 🚀 Fonctionnalités MVP

### 1. **Authentification**
- ✅ Inscription par email et mot de passe
- ✅ Connexion sécurisée avec JWT
- ✅ Profil utilisateur avec informations académiques

### 2. **Bibliothèque de documents**
- ✅ Téléversement de documents (PDF, Word, PowerPoint)
- ✅ Classement par établissement, programme et cours
- ✅ Recherche de documents
- ✅ Téléchargement des documents
- ✅ Évaluation des documents (1-5 étoiles)
- ✅ Signalement de contenu inapproprié

### 3. **Système de contribution**
- ✅ Attribution de points pour chaque document approuvé
- ✅ Classement des meilleurs contributeurs

### 4. **Forum étudiant**
- ✅ Création de questions
- ✅ Réponses aux questions
- ✅ Votes positifs sur les réponses utiles
- ✅ Catégories de discussion
- ✅ Notifications (prévu pour v2)

### 5. **Tableau de bord**
- ✅ Documents récemment ajoutés
- ✅ Questions récentes du forum
- ✅ Statistiques personnelles
- ✅ Points et classement

## 🏗️ Architecture

```
Étudia+/
├── backend/                 # API Node.js/Express
│   ├── src/
│   │   ├── models/         # Modèles de base de données
│   │   ├── routes/         # Définition des routes API
│   │   ├── controllers/    # Logique métier
│   │   ├── middleware/     # Authentification, validation
│   │   ├── config/         # Configuration (DB, JWT)
│   │   ├── utils/          # Fonctions utilitaires
│   │   └── app.js          # Configuration Express
│   ├── server.js           # Point d'entrée
│   ├── package.json
│   ├── .env.example
│   └── .gitignore
│
├── frontend/                # Application React
│   ├── src/
│   │   ├── pages/          # Pages principales
│   │   ├── components/     # Composants réutilisables
│   │   ├── services/       # Appels API
│   │   ├── context/        # Contexte React (Auth)
│   │   ├── styles/         # Styles CSS
│   │   ├── App.js          # Composant principal
│   │   └── index.js        # Point d'entrée
│   ├── public/
│   ├── package.json
│   ├── .env.example
│   └── .gitignore
│
├── database/                # Scripts de base de données
│   ├── schema.sql          # Schéma SQL
│   └── init.sql            # Données initiales
│
└── README.md
```

## 🛠️ Technologies

### Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **PostgreSQL** - Base de données
- **JWT** - Authentification
- **Multer** - Gestion des téléversements

### Frontend
- **React** - Bibliothèque UI
- **React Router** - Navigation
- **Bootstrap** - Design responsive
- **Axios** - Client HTTP

### DevOps
- **.env** - Gestion des variables d'environnement
- **CORS** - Sécurité des requêtes cross-origin

## 📋 Installation et configuration

### Prérequis
- Node.js 16+ et npm
- PostgreSQL 12+
- Git

### Configuration du Backend

1. **Cloner le projet**
```bash
cd backend
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configurer l'environnement**
```bash
cp .env.example .env
# Modifier .env avec vos paramètres PostgreSQL
```

4. **Créer la base de données**
```bash
psql -U postgres
CREATE DATABASE edudia_db;
CREATE USER edudia_user WITH PASSWORD 'votre_mot_de_passe';
GRANT ALL PRIVILEGES ON DATABASE edudia_db TO edudia_user;
\q

# Importer le schéma
psql -U edudia_user -d edudia_db -f ../database/schema.sql
```

5. **Démarrer le serveur**
```bash
npm run dev  # Mode développement avec nodemon
# ou
npm start   # Mode production
```

Le serveur sera accessible sur `http://localhost:5000`

### Configuration du Frontend

1. **Accéder au dossier frontend**
```bash
cd frontend
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configurer l'environnement**
```bash
cp .env.example .env
# Vérifier que REACT_APP_API_URL pointe vers le backend
```

4. **Démarrer l'application**
```bash
npm start
```

L'application sera accessible sur `http://localhost:3000`

## 📚 API Documentation

### Authentification

**Inscription**
```
POST /api/auth/register
Body: {
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  school?: string,
  program?: string,
  session?: string
}
```

**Connexion**
```
POST /api/auth/login
Body: {
  email: string,
  password: string
}
Response: {
  token: JWT,
  user: User
}
```

### Documents

**Téléverser un document**
```
POST /api/documents/upload
Headers: Authorization: Bearer {token}
FormData: {
  file: File,
  title: string,
  description?: string,
  school: string,
  program: string,
  courseCode: string,
  courseName?: string
}
```

**Obtenir les documents**
```
GET /api/documents?status=approved&program=Informatique&search=calcul&limit=20&offset=0
```

### Forum

**Créer une question**
```
POST /api/forum/questions
Headers: Authorization: Bearer {token}
Body: {
  title: string,
  content: string,
  category: string
}
```

**Créer une réponse**
```
POST /api/forum/questions/:questionId/answers
Headers: Authorization: Bearer {token}
Body: {
  content: string
}
```

**Voter sur une réponse**
```
POST /api/forum/answers/:answerId/vote
Headers: Authorization: Bearer {token}
Body: {
  voteType: "up" | "down"
}
```

## 📈 Prochaines étapes (v2)

- [ ] Notifications en temps réel
- [ ] Outils d'étude (générateur de fiches, QCM)
- [ ] Système de messagerie privée
- [ ] Intégration Cloudinary pour stockage fichiers
- [ ] Application mobile (React Native)
- [ ] Système de badges et récompenses
- [ ] Planificateur d'étude
- [ ] Tests automatisés (Jest, React Testing Library)

## 👨‍💻 Contribution

Les contributions sont bienvenues! Veuillez :
1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📝 Licence

Ce projet est sous licence MIT - voir le fichier LICENSE pour plus de détails.

## 📞 Support

Pour toute question ou problème, veuillez ouvrir une issue sur GitHub.

---

**Créé par l'équipe Étudia+** 📚✨
