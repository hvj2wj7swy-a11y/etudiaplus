# API Documentation - Étudia+

## Base URL
```
http://localhost:5000/api
```

## Format des réponses

Toutes les réponses sont en JSON avec la structure suivante:

```json
{
  "success": true,
  "message": "Message de succès",
  "data": { /* données */ }
}
```

## Authentification

Toutes les routes protégées nécessitent un header `Authorization`:

```
Authorization: Bearer <JWT_TOKEN>
```

---

## 🔐 Authentification `/api/auth`

### POST `/api/auth/register`
**Inscription**

```json
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123",
  "firstName": "Jean",
  "lastName": "Dupont",
  "school": "Université de Montréal",
  "program": "Informatique",
  "session": "Automne 2024"
}
```

**Response (201)**
```json
{
  "success": true,
  "message": "Inscription réussie",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "first_name": "Jean",
      "last_name": "Dupont",
      "role": "student",
      "points": 0,
      "created_at": "2024-01-15T10:00:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### POST `/api/auth/login`
**Connexion**

```json
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

**Response (200)**
```json
{
  "success": true,
  "message": "Connexion réussie",
  "data": {
    "user": { /* user object */ },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### GET `/api/auth/verify`
**Vérifier le token JWT**

```
GET /api/auth/verify
Authorization: Bearer <token>
```

**Response (200)**
```json
{
  "success": true,
  "data": {
    "user": { /* user object */ }
  }
}
```

---

## 👤 Utilisateurs `/api/users`

### GET `/api/users/profile`
**Obtenir le profil de l'utilisateur connecté**

```
GET /api/users/profile
Authorization: Bearer <token>
```

**Response (200)**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "first_name": "Jean",
      "last_name": "Dupont",
      "school": "Université de Montréal",
      "program": "Informatique",
      "points": 50,
      "is_active": true
    }
  }
}
```

### PUT `/api/users/profile`
**Mettre à jour le profil utilisateur**

```json
PUT /api/users/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "Jean",
  "lastName": "Dupont",
  "school": "Université de Montréal",
  "program": "Informatique",
  "session": "Hiver 2025",
  "profilePhotoUrl": "https://example.com/photo.jpg"
}
```

### GET `/api/users/top-contributors`
**Obtenir les meilleurs contributeurs**

```
GET /api/users/top-contributors?limit=10
```

**Response (200)**
```json
{
  "success": true,
  "data": {
    "contributors": [
      {
        "id": 1,
        "first_name": "Alice",
        "last_name": "Durand",
        "points": 500,
        "documents_count": 15
      }
    ]
  }
}
```

### GET `/api/users/:id/public`
**Obtenir les informations publiques d'un utilisateur**

```
GET /api/users/1/public
```

---

## 📄 Documents `/api/documents`

### POST `/api/documents/upload`
**Téléverser un document**

```
POST /api/documents/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

FormData:
- file: <File> (PDF, Word, PowerPoint max 10MB)
- title: "Notes de Calcul 101"
- description: "Résumé du chapitre 5"
- school: "Université de Montréal"
- program: "Informatique"
- courseCode: "IFT1025"
- courseName: "Introduction à l'informatique"
```

**Response (201)**
```json
{
  "success": true,
  "message": "Document téléversé avec succès",
  "data": {
    "document": {
      "id": 1,
      "title": "Notes de Calcul 101",
      "file_url": "/uploads/1234567890-notes.pdf",
      "status": "pending",
      "uploaded_by": 1,
      "created_at": "2024-01-15T10:00:00Z"
    }
  }
}
```

### GET `/api/documents`
**Obtenir tous les documents**

```
GET /api/documents?status=approved&program=Informatique&search=calcul&limit=20&offset=0
```

**Query Parameters:**
- `status`: pending, approved, rejected (défaut: approved)
- `program`: Programme d'études
- `courseCode`: Code du cours
- `search`: Recherche par titre ou description
- `limit`: Nombre de résultats (défaut: 20, max: 100)
- `offset`: Décalage pour pagination

**Response (200)**
```json
{
  "success": true,
  "data": {
    "documents": [
      {
        "id": 1,
        "title": "Notes de Calcul",
        "program": "Informatique",
        "course_code": "IFT1025",
        "average_rating": 4.5,
        "download_count": 45,
        "first_name": "Jean",
        "last_name": "Dupont"
      }
    ]
  }
}
```

### GET `/api/documents/:id`
**Obtenir un document spécifique**

```
GET /api/documents/1
```

### POST `/api/documents/:id/rate`
**Évaluer un document**

```json
POST /api/documents/1/rate
Authorization: Bearer <token>
Content-Type: application/json

{
  "rating": 5,
  "comment": "Excellentes notes, très claires!"
}
```

### POST `/api/documents/:id/report`
**Signaler un document**

```json
POST /api/documents/1/report
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "Contenu inapproprié",
  "description": "Ce document contient du contenu offensant..."
}
```

### GET `/api/documents/user/:userId`
**Obtenir les documents d'un utilisateur**

```
GET /api/documents/user/1?limit=20&offset=0
```

---

## 💬 Forum `/api/forum`

### POST `/api/forum/questions`
**Créer une question**

```json
POST /api/forum/questions
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Comment résoudre l'équation x² + 5x + 6 = 0?",
  "content": "Je n'arrive pas à comprendre les étapes...",
  "category": "Mathématiques"
}
```

**Response (201)**
```json
{
  "success": true,
  "message": "Question créée",
  "data": {
    "question": {
      "id": 1,
      "title": "Comment résoudre...",
      "asked_by": 1,
      "category": "Mathématiques",
      "view_count": 0,
      "is_resolved": false,
      "created_at": "2024-01-15T10:00:00Z"
    }
  }
}
```

### GET `/api/forum/questions`
**Obtenir les questions**

```
GET /api/forum/questions?category=Mathématiques&search=équation&isResolved=false&limit=20&offset=0
```

**Query Parameters:**
- `category`: Catégorie de discussion
- `search`: Recherche par titre ou contenu
- `isResolved`: true/false
- `limit`: Nombre de résultats (défaut: 20)
- `offset`: Décalage pour pagination

### GET `/api/forum/questions/:id`
**Obtenir une question spécifique**

```
GET /api/forum/questions/1
```

### POST `/api/forum/questions/:questionId/answers`
**Créer une réponse**

```json
POST /api/forum/questions/1/answers
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Vous devez utiliser la formule quadratique: x = (-b ± √(b²-4ac)) / 2a"
}
```

### GET `/api/forum/questions/:questionId/answers`
**Obtenir les réponses d'une question**

```
GET /api/forum/questions/1/answers?limit=50&offset=0
```

### POST `/api/forum/answers/:answerId/vote`
**Voter sur une réponse**

```json
POST /api/forum/answers/1/vote
Authorization: Bearer <token>
Content-Type: application/json

{
  "voteType": "up"  // ou "down"
}
```

### POST `/api/forum/answers/:answerId/mark-solution`
**Marquer une réponse comme solution**

```
POST /api/forum/answers/1/mark-solution
Authorization: Bearer <token>
```

---

## 📊 Tableau de bord `/api/dashboard`

### GET `/api/dashboard`
**Obtenir les données du tableau de bord**

```
GET /api/dashboard
Authorization: Bearer <token>
```

**Response (200)**
```json
{
  "success": true,
  "data": {
    "recentDocuments": [...],
    "recentQuestions": [...],
    "userStatistics": {
      "documents_uploaded": 5,
      "documents_approved": 4,
      "questions_asked": 3,
      "answers_provided": 8,
      "helpful_answers": 5
    },
    "points": 50,
    "topContributors": [...]
  }
}
```

### GET `/api/dashboard/statistics/:userId`
**Obtenir les statistiques détaillées d'un utilisateur**

```
GET /api/dashboard/statistics/1
Authorization: Bearer <token>
```

---

## Codes d'erreur

| Code | Signification |
|------|---------------|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 500 | Internal Server Error |

---

**Dernière mise à jour: 2024-01-15**
