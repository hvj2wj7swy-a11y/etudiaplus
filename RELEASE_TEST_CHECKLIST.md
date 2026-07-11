# RELEASE_TEST_CHECKLIST

## Legende
- [ ] Non teste
- [x] Reussi
- [!] Echec
- [~] Corrige puis reteste

## 1. Authentification
- [!] Inscription avec des donnees valides
- [ ] Refus si un champ obligatoire est vide
- [ ] Refus si le courriel est deja utilise
- [x] Connexion avec les bons identifiants
- [x] Refus avec un mauvais mot de passe
- [x] Persistance de session apres actualisation
- [x] Deconnexion complete
- [x] Acces refuse aux pages protegees apres deconnexion
- [ ] Recuperation ou reinitialisation du mot de passe (si disponible)

## 2. Cours
- [!] Creation d'un cours
- [!] Modification d'un cours
- [!] Suppression annulee
- [!] Suppression confirmee
- [!] Affichage correct dans Agenda, Notes et Documents
- [ ] Aucune donnee d'un autre utilisateur visible

## 3. Agenda
- [x] Creation d'un devoir
- [x] Creation d'un examen
- [!] Modification
- [!] Suppression
- [x] Affichage a la bonne date et a la bonne heure
- [x] Navigation entre les semaines
- [x] Affichage sur mobile
- [x] Evenements cliquables
- [x] Aucune duplication apres double clic

## 4. Notes
- [x] Creation d'un cahier
- [x] Ouverture
- [x] Creation d'une page
- [ ] Ecriture au clavier
- [ ] Dessin a la souris
- [ ] Dessin au doigt
- [ ] Apple Pencil sur iPad (si disponible)
- [ ] Gomme
- [ ] Annuler et retablir
- [x] Sauvegarde automatique
- [x] Fermeture puis reouverture sans perte
- [x] Recherche de cahier
- [x] Duplication de page (si disponible)
- [x] Suppression de page
- [x] Suppression de cahier
- [x] Import PDF (si disponible)
- [x] Export PDF (si disponible)

## 5. Documents
- [x] Import d'un fichier valide
- [ ] Refus d'un format interdit
- [ ] Refus d'un fichier trop volumineux
- [x] Affichage du nom du fichier
- [ ] Telechargement
- [x] Recherche
- [!] Filtre par cours
- [!] Suppression
- [ ] Acces interdit a un document d'un autre utilisateur

## 6. Profil
- [!] Modification du nom
- [x] Modification du programme
- [x] Sauvegarde
- [x] Actualisation de la page
- [!] Conservation des changements
- [x] Messages de succes et d'erreur

## 7. Etats utilisateur
- [x] Messages de chargement
- [x] Messages de succes
- [x] Messages d'erreur
- [!] Confirmations de suppression
- [x] Etats vides
- [ ] Perte de connexion internet
- [x] Serveur indisponible
- [x] Bouton desactive pendant une action
- [x] Absence de double soumission

## 8. Responsive
### Resolutions a tester
- [x] 1440 x 900
- [x] 1024 x 768
- [x] 820 x 1180
- [x] 1180 x 820
- [x] 390 x 844
- [x] 430 x 932

### Criteres sur chaque taille
- [x] Aucun debordement horizontal
- [x] Aucun texte coupe
- [x] Navigation utilisable
- [x] Boutons tactiles assez grands
- [x] Formulaires lisibles
- [x] Modales accessibles
- [ ] Le clavier mobile ne masque pas les champs
- [x] Editeur de notes utilisable

## 9. Navigateurs
- [x] Chrome
- [ ] Safari iPad/iPhone
- [ ] Edge
- [ ] Firefox (si possible)
- [x] Differences de comportement documentees

## 10. Securite minimale
- [x] Aucun mot de passe dans localStorage/sessionStorage
- [x] Routes protegees bloquees sans compte
- [ ] Fichiers interdits rejetes
- [ ] Taille des uploads limitee
- [x] Erreurs serveur sans donnees sensibles
- [ ] Compte admin non accessible en production sans autorisation

## 11. Build et execution
- [x] Installation propre des dependances
- [!] Tests frontend
- [!] Tests backend
- [x] Build frontend
- [x] Demarrage backend
- [x] Demarrage frontend
- [x] Verification des erreurs console
- [x] Verification des erreurs reseau

## 12. Bugs trouves et corriges

### BUG-001
- Titre: Inscription en erreur 500 lorsque PostgreSQL est indisponible
- Reproduction: Ouvrir /register, saisir un nouvel utilisateur valide puis soumettre. Resultat observe: HTTP 500.
- Cause: Connexion PostgreSQL refusee (ECONNREFUSED sur le port 5432) pendant la verification d'email.
- Correction: Aucune correction code appliquee dans cette etape; necessite remise en service de la base et/ou mode degrade sans DB.
- Retest: Non valide, bloque par indisponibilite DB.
- Statut: OUVERT (bloquant pre-release)

### BUG-002
- Titre: Le programme utilisateur ne persiste pas apres actualisation du profil
- Reproduction: Sur /profile, choisir "Sciences humaines", cliquer "Enregistrer le programme", puis recharger la page.
- Cause: Le programme affiche "-" ou revient a la valeur precedente apres refresh; persistence non fiable entre l'etat UI et le stockage.
- Correction: Aucune correction appliquee dans cette etape (phase de test uniquement).
- Retest: Echec apres recharge.
- Statut: OUVERT

### BUG-003
- Titre: Agenda sans fonctionnalites de modification/suppression d'evenement
- Reproduction: Creer un evenement dans /agenda, cliquer l'evenement dans la grille.
- Cause: Les evenements sont affiches et cliquables mais aucune action d'edition/suppression n'est exposee.
- Correction: Aucune correction appliquee dans cette etape (phase de test uniquement).
- Retest: Echec (fonction non disponible).
- Statut: OUVERT

## 13. Blocage pre-release
- [ ] Connexion impossible
- [x] Perte de donnees
- [ ] Sauvegarde des notes non fiable
- [ ] Pages protegees accessibles sans compte
- [ ] Upload dangereux possible
- [ ] Crash sur mobile
- [ ] Build de production en echec
- [ ] Erreurs critiques console
- [ ] Documents d'un autre utilisateur accessibles

## 14. Synthese finale
- Tests reussis: 57
- Tests echoues: 16
- Bugs corriges: 0
- Bugs ouverts: 3
- Risques restants: DB non disponible pour l'inscription, persistance profil non fiable, fonctions agenda incomplètes (edition/suppression), couverture navigateurs partielle.
- Recommandation: NE PAS passer en production tant que BUG-001 et BUG-002 ne sont pas corriges et retestes.
