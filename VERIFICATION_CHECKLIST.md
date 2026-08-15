# ✅ Checklist de vérification - Étudia+

Cette checklist vous aidera à vérifier que votre installation est complète et correcte.

## 🔍 Vérification de la structure des fichiers

### Backend
```bash
cd backend
ls -la

# Vous devriez voir:
✓ src/           (dossier avec models, controllers, routes, etc.)
✓ uploads/       (dossier pour fichiers)
✓ server.js      (fichier)
✓ package.json   (fichier)
✓ .env.example   (fichier)
✓ .gitignore     (fichier)
```

### Frontend
```bash
cd ../frontend
ls -la

# Vous devriez voir:
✓ src/           (dossier avec pages, components, services, etc.)
✓ public/        (dossier avec index.html)
✓ package.json   (fichier)
✓ .env.example   (fichier)
✓ .gitignore     (fichier)
```

### Database
```bash
cd ../database
ls -la

# Vous devriez voir:
✓ schema.sql     (fichier SQL)
```

### Documentation
```bash
cd ..
ls -la *.md

# Vous devriez voir:
✓ README.md
✓ QUICKSTART.md
✓ INSTALLATION.md
✓ API_DOCUMENTATION.md
✓ USER_GUIDE.md
✓ DEVELOPMENT_GUIDE.md
✓ DEPLOYMENT.md
✓ PROJECT_STRUCTURE.md
✓ INDEX.md
```

## 🛠️ Vérification de l'installation

### Prérequis

```bash
# Vérifier Node.js
node --version
# Devrait afficher: v16.0.0 ou supérieur

# Vérifier npm
npm --version
# Devrait afficher: 7.0.0 ou supérieur

# Vérifier PostgreSQL
psql --version
# Devrait afficher: psql (PostgreSQL) 12.0 ou supérieur
```

### Configuration Backend

```bash
cd backend

# Vérifier .env existe
ls -la .env
# Devrait afficher: .env

# Vérifier package.json
cat package.json | grep "name"
# Devrait contenir: edudia-plus-backend

# Vérifier dependencies
npm ls --depth=0
# Devrait lister: express, pg, bcryptjs, jsonwebtoken, etc.
```

### Configuration Frontend

```bash
cd ../frontend

# Vérifier .env existe
ls -la .env
# Devrait afficher: .env

# Vérifier package.json
cat package.json | grep "name"
# Devrait contenir: edudia-plus-frontend

# Vérifier dependencies
npm ls --depth=0
# Devrait lister: react, react-router-dom, bootstrap, axios, etc.
```

### Base de données

```bash
# Se connecter à PostgreSQL
psql -U edudia_user -d edudia_db

# Vérifier les tables
\dt
# Devrait lister:
# ├─ users
# ├─ documents
# ├─ document_ratings
# ├─ document_reports
# ├─ forum_questions
# ├─ forum_answers
# ├─ answer_votes
# ├─ forum_notifications
# ├─ user_statistics
# └─ ...

# Quitter
\q
```

## 🚀 Test de démarrage

### Backend

```bash
cd backend

# Démarrer le serveur
npm run dev

# Vérifier les logs:
# ✅ Serveur Étudia+ démarré sur le port 5000
# ✅ Connecté à PostgreSQL
```

### Frontend (dans un nouveau terminal)

```bash
cd frontend

# Démarrer l'application
npm start

# Vérifier:
# ✅ Application ouverte sur http://localhost:3000
# ✅ Page de connexion/inscription visible
```

## 🌐 Test des endpoints API

### Option 1: Utiliser curl

```bash
# Tester l'API
curl http://localhost:5000/api/users/top-contributors

# Devrait retourner un JSON avec les contributeurs
# Ou un message d'erreur si l'API n'est pas prête
```

### Option 2: Utiliser Postman

1. Télécharger Postman: https://www.postman.com/downloads/
2. Créer une requête GET vers: `http://localhost:5000/api/users/top-contributors`
3. Envoyer la requête
4. Vérifier la réponse JSON

## 📝 Test fonctionnel

### Test d'inscription

1. Aller sur http://localhost:3000/register
2. Remplir le formulaire:
   - Prénom: Jean
   - Nom: Dupont
   - Email: test@example.com
   - Mot de passe: password123
   - Établissement: Université Test
   - Programme: Informatique
3. Cliquer "S'inscrire"
4. ✓ Redirection vers dashboard
5. ✓ Affichage du prénom dans la navigation

### Test de connexion

1. Cliquer "Déconnexion"
2. Aller sur http://localhost:3000/login
3. Entrer email: test@example.com
4. Entrer mot de passe: password123
5. Cliquer "Se connecter"
6. ✓ Connexion réussie
7. ✓ Redirection vers dashboard

### Test du tableau de bord

1. Vérifier que le tableau de bord charge:
   - [ ] Section "Points" visible
   - [ ] Section "Documents" visible
   - [ ] Section "Questions du forum" visible
   - [ ] Section "Meilleurs contributeurs" visible

### Test de la bibliothèque

1. Aller sur Documents
2. Vérifier:
   - [ ] Page charge correctement
   - [ ] Filtres disponibles
   - [ ] Barre de recherche fonctionne
   - [ ] Bouton "Téléverser" accessible

### Test du forum

1. Aller sur Forum
2. Vérifier:
   - [ ] Questions affichées
   - [ ] Bouton "Poser une question" visible
   - [ ] Filtres disponibles
   - [ ] Bouton "Voir" sur chaque question

### Test du téléversement

1. Aller sur "Téléverser"
2. Remplir le formulaire avec un PDF test
3. Cliquer "Téléverser le document"
4. ✓ Message de succès
5. ✓ Redirection vers Documents

## 🔧 Debugging

### Vérifier les logs backend

```bash
# Terminal du backend
npm run dev

# Vous devriez voir:
✅ Serveur Étudia+ démarré sur le port 5000
✅ Connecté à PostgreSQL
```

### Vérifier les logs frontend

```bash
# Terminal du frontend
npm start

# Vous devriez voir:
✅ Compiled successfully
✅ Application ouvert sur http://localhost:3000
```

### Vérifier la console du navigateur

1. Ouvrir les Developer Tools (F12)
2. Aller sur l'onglet "Console"
3. Vérifier qu'il n'y a pas d'erreurs en rouge
4. Tester les requêtes API

### Vérifier les logs PostgreSQL

```bash
# Se connecter à PostgreSQL
psql -U edudia_user -d edudia_db

# Exécuter une requête test
SELECT COUNT(*) FROM users;

# Devrait retourner le nombre d'utilisateurs
```

## ⚠️ Problèmes courants et solutions

### Erreur: "Cannot find module"

**Solution:**
```bash
# Réinstaller les dépendances
rm -rf node_modules package-lock.json
npm install
```

### Erreur: "Port already in use"

**Solution:**
```bash
# Backend sur un autre port
PORT=5001 npm run dev

# Frontend sur un autre port
PORT=3001 npm start
```

### Erreur: "PostgreSQL connection failed"

**Solution:**
1. Vérifier que PostgreSQL est en cours d'exécution
2. Vérifier les paramètres dans .env
3. Vérifier que la base de données est créée:
   ```bash
   psql -U postgres -l | grep edudia_db
   ```

### Erreur: "Unexpected token < in JSON"

**Solution:**
- L'API retourne du HTML au lieu de JSON
- Vérifier que le backend fonctionne
- Vérifier que REACT_APP_API_URL est correct

## ✅ Checklist finale

- [ ] Dossiers et fichiers créés
- [ ] Node.js et npm installés
- [ ] PostgreSQL installé et démarré
- [ ] Base de données créée
- [ ] Backend configuré (.env)
- [ ] Frontend configuré (.env)
- [ ] Backend démarré avec npm run dev
- [ ] Frontend démarré avec npm start
- [ ] Page de connexion accessible
- [ ] Inscription fonctionne
- [ ] Connexion fonctionne
- [ ] Tableau de bord affiche les données
- [ ] Documents page charge
- [ ] Forum page charge
- [ ] Téléversement possible
- [ ] Pas d'erreur dans la console

## 🎉 Si tous les tests passent!

Félicitations! ✨

Votre installation est complète et fonctionnelle.

**Prochaines étapes:**
1. Créer un compte test
2. Tester toutes les fonctionnalités
3. Lire la documentation
4. Commencer le développement
5. Déployer en production!

## 📞 Si un test échoue

1. Vérifier le message d'erreur
2. Consulter [INSTALLATION.md](INSTALLATION.md#dépannage)
3. Vérifier les logs (terminal + console navigateur)
4. Relire la documentation
5. Chercher la solution online

---

**Bonne chance! 🚀**
