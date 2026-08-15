# Guide de développement - Étudia+

## Standards de code

### JavaScript/Node.js

#### Nommage

```javascript
// Variables et fonctions: camelCase
const userName = 'Jean';
function calculateAverage() { }

// Classes: PascalCase
class UserController { }

// Constantes: UPPER_SNAKE_CASE
const MAX_FILE_SIZE = 10485760;
```

#### Conventions

```javascript
// Toujours utiliser const par défaut
const user = getUserData();

// Utiliser let seulement si la variable change
let counter = 0;
counter++;

// Éviter var
// var isActive = true; ❌

// Fonctions asynchrones
async function getUser(id) {
  try {
    const user = await database.query('SELECT * FROM users WHERE id = $1', [id]);
    return user;
  } catch (error) {
    console.error('Erreur:', error);
    throw error;
  }
}

// Destructuring
const { email, firstName, lastName } = userData;
const [first, ...rest] = arrayData;
```

#### Commentaires

```javascript
/**
 * Description de la fonction
 * @param {type} paramName - Description du paramètre
 * @returns {type} Description de la valeur retournée
 */
function calculateTotal(price, tax) {
  return price * (1 + tax / 100);
}

// Commentaire inline pour logique complexe
const result = values.filter(v => v > threshold); // Filtrer par seuil
```

### React

#### Composants fonctionnels

```javascript
/**
 * Composant UserCard - Afficher les informations d'un utilisateur
 */
const UserCard = ({ user, onSelect }) => {
  const handleClick = () => {
    onSelect(user.id);
  };

  return (
    <Card onClick={handleClick}>
      <Card.Body>
        <Card.Title>{user.firstName} {user.lastName}</Card.Title>
      </Card.Body>
    </Card>
  );
};

export default UserCard;
```

#### Hooks

```javascript
const MyComponent = () => {
  // État
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Effet
  useEffect(() => {
    fetchUsers();
  }, []);

  // Contexte
  const { user } = useAuth();

  return (
    // JSX
  );
};
```

## Structure du code

### Backend

```
src/
├── app.js              # Configuration Express
├── models/
│   ├── User.js         # Logique métier utilisateurs
│   ├── Document.js     # Logique métier documents
│   └── ...
├── controllers/
│   ├── userController.js       # Gestionnaires de routes
│   └── ...
├── routes/
│   ├── userRoutes.js           # Définition des routes
│   └── ...
├── middleware/
│   └── authMiddleware.js       # Middlewares
├── config/
│   └── database.js             # Configuration DB
└── utils/
    └── tokenUtils.js           # Fonctions utilitaires
```

### Frontend

```
src/
├── pages/              # Pages principales
│   ├── LoginPage.js
│   ├── DashboardPage.js
│   └── ...
├── components/         # Composants réutilisables
│   ├── Navigation.js
│   ├── ProtectedRoute.js
│   └── ...
├── services/           # Appels API
│   └── api.js
├── context/            # Contextes React
│   └── AuthContext.js
├── styles/             # Styles CSS
│   └── main.css
├── App.js              # Composant principal
└── index.js            # Point d'entrée
```

## Bonnes pratiques

### Gestion des erreurs

```javascript
// Backend
try {
  const result = await operation();
  res.json({ success: true, data: result });
} catch (error) {
  console.error('Erreur:', error);
  res.status(500).json({
    success: false,
    message: 'Erreur lors de l\'opération'
  });
}

// Frontend
try {
  const data = await api.get('/endpoint');
  setData(data);
} catch (error) {
  setError(error.response?.data?.message || 'Erreur');
}
```

### Validation des données

```javascript
// Backend - Utiliser express-validator
const { body, validationResult } = require('express-validator');

router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('firstName').trim().notEmpty(),
  body('lastName').trim().notEmpty()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // Continuer...
});

// Frontend - Validation basique
const handleSubmit = (e) => {
  e.preventDefault();
  if (!email || !password) {
    setError('Tous les champs sont requis');
    return;
  }
  // Soumettre...
};
```

### Sécurité

```javascript
// Toujours hasher les mots de passe
const bcrypt = require('bcryptjs');
const passwordHash = await bcrypt.hash(password, 10);

// Utiliser JWT pour l'authentification
const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });

// Limiter l'accès aux données sensibles
const { password_hash, ...userWithoutPassword } = user;
return userWithoutPassword;

// Valider et nettoyer les entrées
const sanitizedInput = input.trim().toLowerCase();
```

## Tests

### Tests unitaires (Jest)

```javascript
describe('User Model', () => {
  test('should create a new user', async () => {
    const user = await User.create({
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Jean'
    });
    
    expect(user.email).toBe('test@example.com');
    expect(user.id).toBeDefined();
  });

  test('should hash the password', async () => {
    const user = await User.create({
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Jean'
    });
    
    expect(user.password_hash).not.toBe('password123');
  });
});
```

### Tests d'intégration

```javascript
describe('Auth API', () => {
  test('POST /api/auth/register should create a new user', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Jean',
        lastName: 'Dupont'
      });
    
    expect(response.status).toBe(201);
    expect(response.body.data.token).toBeDefined();
  });
});
```

## Checkliste avant commit

- ✅ Le code suit les conventions d'utilisation
- ✅ Tous les commentaires sont à jour
- ✅ Les console.log() de debug sont supprimés
- ✅ Les tests passent
- ✅ Pas de dépendances inutiles
- ✅ Les variables d'environnement sont utilisées
- ✅ La gestion des erreurs est correcte
- ✅ Le code est lisible et maintenable

## Git Workflow

```bash
# Créer une branche
git checkout -b feature/description

# Faire des commits réguliers
git add .
git commit -m "feat: description brève"

# Pousser les changements
git push origin feature/description

# Faire une Pull Request
# - Description claire
# - Tests passant
# - Code review

# Merger après approbation
git checkout main
git merge feature/description
```

## Commandes utiles

```bash
# Backend
npm install              # Installer les dépendances
npm run dev             # Démarrer en développement
npm test                # Exécuter les tests
npm run lint            # Vérifier le code (si ESLint configuré)

# Frontend
npm install              # Installer les dépendances
npm start               # Démarrer l'application
npm build               # Créer un build production
npm test                # Exécuter les tests
```

## Debugging

### Backend

```javascript
// Logs structurés
console.log('✅ Succès:', data);
console.error('❌ Erreur:', error);
console.warn('⚠️ Attention:', warning);

// Debugger Node.js
// Ajouter dans package.json: "debug": "node --inspect server.js"
// Accéder à: chrome://inspect
```

### Frontend

```javascript
// React DevTools: Extension Chrome
// Redux DevTools: Extension Chrome (si Redux utilisé)
// Breakpoints: Outils développeur du navigateur (F12)
// Console: Pour logs et tests
```

---

**Suivez ces guidelines pour maintenir une base de code de qualité!**
