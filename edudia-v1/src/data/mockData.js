const mockData = {
  user: { id: 1, name: 'Étudiant Exemple', email: 'etudiant@example.com' },
  documents: [
    { id: 1, title: 'Guide de programmation Java', program: 'Informatique', course: 'CS101', category: 'Informatique', downloads: 42 },
    { id: 2, title: 'Théorie des organisations', program: 'Administration', course: 'ADM201', category: 'Administration', downloads: 27 },
    { id: 3, title: 'Introduction à la psychologie', program: 'Sciences humaines', course: 'SH101', category: 'Sciences humaines', downloads: 33 },
    { id: 4, title: 'Écologie et environnement', program: 'Sciences de la nature', course: 'SN102', category: 'Sciences de la nature', downloads: 18 },
    { id: 5, title: 'Méthodologie en soins infirmiers', program: 'Santé', course: 'SNT110', category: 'Santé', downloads: 21 },
    { id: 6, title: 'Communication visuelle', program: 'Arts et communication', course: 'COM120', category: 'Arts et communication', downloads: 19 },
    { id: 7, title: 'Projet génie civil', program: 'Génie et technologie', course: 'GT150', category: 'Génie et technologie', downloads: 12 },
    { id: 8, title: 'Intervention éducative', program: 'Éducation et intervention', course: 'EDU130', category: 'Éducation et intervention', downloads: 16 }
  ],
  questions: [
    {
      id: 1,
      title: 'Comment résoudre cet exercice ?',
      content: 'J\'ai du mal avec la dernière question sur le cours.',
      author: 'Alice',
      answers: [
        { id: 101, author: 'Céline', content: 'Commence par relire la théorie, puis vérifie chaque étape de ton calcul.' }
      ]
    },
    {
      id: 2,
      title: 'Ressources pour révisions',
      content: 'Quel document est le meilleur pour la prochaine épreuve ?',
      author: 'Bob',
      answers: []
    }
  ]
}

export default mockData
