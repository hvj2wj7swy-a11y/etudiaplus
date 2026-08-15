import React, { useEffect, useMemo, useState } from 'react'
import { Container, Row, Col, Card, Form, Button, Alert, ButtonGroup, Badge, Modal, Accordion } from 'react-bootstrap'
import { useAuth } from '../context/AuthContext.jsx'
import {
  documentAPI,
  API_BASE_URL
} from '../services/api'
import './Documents.css'

const BACKEND_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '')
const DOCUMENTS_KEY = 'edudia_documents'
const USERS_KEY = 'edudia_users'
const CURRENT_USER_KEY = 'edudia_current_user'
const REPORTS_KEY = 'edudia_reports'
const MAX_FILE_SIZE = 10 * 1024 * 1024
const ACCEPTED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.jpg', '.jpeg', '.png', '.webp']
const ACCEPT_ATTR = ACCEPTED_EXTENSIONS.join(',')
const REPORT_REASONS = ['Contenu inapproprié', 'Plagiat', 'Mauvais document', 'Spam', 'Harcèlement', 'Autre']
const DOCUMENTS_RATINGS_KEY = 'edudia_documents_ratings'
const FAVORITES_KEY = 'edudia_favorites'
const NOTIFICATIONS_KEY = 'edudia_notifications'
const NOTIFICATION_EVENT = 'edudia-notifications-updated'
const POINTS = {
  documentPublished: 10,
  documentDownloaded: 1,
  documentRatedFiveStars: 5
}

const LEVELS = [
  { name: 'Débutant', min: 0, max: 99 },
  { name: 'Contributeur', min: 100, max: 499 },
  { name: 'Expert', min: 500, max: 999 },
  { name: 'Ambassadeur', min: 1000, max: Number.POSITIVE_INFINITY }
]

const DEFAULT_DOCUMENTS = [
  {
    id: 1,
    title: 'Introduction à la philosophie',
    category: 'Général',
    programme: 'Général',
    course: 'Philosophie',
    author: 'Étudia+',
    authorId: null,
    date: '2026-06-01',
    fileName: 'philosophie.pdf',
    fileType: 'pdf',
    fileUrl: '',
    rating: 0,
    ratingBonusGranted: false,
    downloadCount: 0
  },
  {
    id: 2,
    title: 'Analyse littéraire',
    category: 'Général',
    programme: 'Général',
    course: 'Littérature',
    author: 'Étudia+',
    authorId: null,
    date: '2026-06-01',
    fileName: 'litterature.docx',
    fileType: 'word',
    fileUrl: '',
    rating: 0,
    ratingBonusGranted: false,
    downloadCount: 0
  },
  {
    id: 3,
    title: 'Algorithmique 1',
    category: "Techniques de l'informatique",
    programme: "Techniques de l'informatique",
    course: 'Programmation',
    author: 'Étudia+',
    authorId: null,
    date: '2026-06-01',
    fileName: 'algo1.pptx',
    fileType: 'powerpoint',
    fileUrl: '',
    rating: 0,
    ratingBonusGranted: false,
    downloadCount: 0
  },
  {
    id: 4,
    title: 'Méthodologie dissertation',
    category: 'Sciences humaines',
    programme: 'Sciences humaines',
    course: 'Français',
    author: 'Étudia+',
    authorId: null,
    date: '2026-06-01',
    fileName: 'dissertation.jpg',
    fileType: 'image',
    fileUrl: '',
    rating: 0,
    ratingBonusGranted: false,
    downloadCount: 0
  }
]

const COURSES_BY_CATEGORY = {
  Général: [
    'Philosophie',
    'Littérature',
    'Français',
    'Anglais',
    'Éducation physique'
  ],

  "Techniques de l'informatique": [
    'Programmation',
    'Développement Web',
    'Bases de données',
    'Réseaux',
    'Linux',
    'Mathématiques'
  ],

  "Sciences humaines": [
    'Psychologie',
    'Histoire',
    'Économie',
    'Sociologie',
    'Politique',
    'Méthodes quantitatives'
  ],

  "Sciences de la nature": [
    'Biologie',
    'Chimie',
    'Physique',
    'Calcul différentiel',
    'Calcul intégral',
    'Méthodes scientifiques'
  ],

  "Soins infirmiers": [
    'Anatomie',
    'Physiologie',
    'Pharmacologie',
    'Soins de base',
    'Stages cliniques',
    'Communication professionnelle'
  ],

  Administration: [
    'Comptabilité',
    'Marketing',
    'Gestion',
    'Économie',
    'Finance',
    'Droit des affaires'
  ],

  "Arts, lettres et communication": [
    'Écriture',
    'Littérature',
    'Communication',
    'Cinéma',
    'Photographie',
    'Création numérique'
  ]
}

const safeParse = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

const dispatchNotificationUpdate = () => {
  window.dispatchEvent(new Event(NOTIFICATION_EVENT))
}

const normalizeNotification = (notification) => ({
  id: notification.id,
  userId: notification.userId,
  title: notification.title,
  message: notification.message,
  type: notification.type || 'info',
  isRead: Boolean(notification.isRead),
  createdAt: notification.createdAt || new Date().toISOString()
})

const readNotifications = () => {
  const stored = safeParse(window.localStorage.getItem(NOTIFICATIONS_KEY), [])
  return Array.isArray(stored) ? stored.map(normalizeNotification) : []
}

const readFavorites = () => {
  const stored = safeParse(window.localStorage.getItem(FAVORITES_KEY), [])
  return Array.isArray(stored)
    ? stored
        .filter((favorite) => favorite && favorite.userId && favorite.documentId)
        .map((favorite) => ({
          userId: favorite.userId,
          documentId: favorite.documentId,
          createdAt: favorite.createdAt || new Date().toISOString()
        }))
    : []
}

const saveFavorites = (favorites) => {
  window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites))
}

const saveNotifications = (notifications) => {
  window.localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications))
}

const queueNotifications = (items) => {
  if (!items.length) return

  const existing = readNotifications()
  const nextNotifications = [
    ...items.filter((item) => !existing.some((notification) => notification.id === item.id)),
    ...existing
  ]

  saveNotifications(nextNotifications)
  dispatchNotificationUpdate()
}

const createNotification = ({ id, userId, title, message, type }) => ({
  id,
  userId,
  title,
  message,
  type,
  isRead: false,
  createdAt: new Date().toISOString()
})

const clampRating = (value) => Math.min(5, Math.max(1, Number(value || 0)))

const formatRatingAverage = (ratings) => {
  if (!ratings.length) return '0.0/5'
  const average = ratings.reduce((sum, item) => sum + Number(item.rating || 0), 0) / ratings.length
  return `${average.toFixed(1)}/5`
}

const renderRatingStars = (ratings) => {
  if (!ratings.length) return '☆☆☆☆☆'

  const average = ratings.reduce((sum, item) => sum + Number(item.rating || 0), 0) / ratings.length
  const filledStars = Math.max(0, Math.min(5, Math.round(average)))
  return `${'★'.repeat(filledStars)}${'☆'.repeat(5 - filledStars)}`
}

const formatCommentDate = (date) => {
  if (!date) return '-'
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return '-'
  return parsed.toLocaleString('fr-CA')
}

const getLevelFromPoints = (points) => {
  return LEVELS.find((level) => points >= level.min && points <= level.max) || LEVELS[0]
}

const buildBadges = (profile) => {
  const badges = []
  badges.push(getLevelFromPoints(profile.points).name)
  if ((profile.documentUploads || 0) >= 1) badges.push('Partageur')
  if ((profile.documentDownloadsEarned || 0) >= 10) badges.push('Document utile')
  if ((profile.fiveStarBonuses || 0) >= 1) badges.push('Document vedette')
  return [...new Set(badges)]
}

const normalizeUserRewards = (input) => {
  const points = Number(input?.points || 0)
  const documentUploads = Number(input?.documentUploads || 0)
  const documentDownloadsEarned = Number(input?.documentDownloadsEarned || 0)
  const fiveStarBonuses = Number(input?.fiveStarBonuses || 0)
  const level = getLevelFromPoints(points).name

  return {
    ...input,
    points,
    level,
    badges: Array.isArray(input?.badges) && input.badges.length > 0 ? input.badges : buildBadges({ points, documentUploads, documentDownloadsEarned, fiveStarBonuses }),
    documentUploads,
    documentDownloadsEarned,
    fiveStarBonuses
  }
}

const getStoredUsers = () => {
  const stored = safeParse(window.localStorage.getItem(USERS_KEY), [])
  return Array.isArray(stored) ? stored.map(normalizeUserRewards) : []
}

const persistUsers = (users) => {
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

const syncCurrentUser = (users) => {
  const currentUser = safeParse(window.localStorage.getItem(CURRENT_USER_KEY), null)
  if (!currentUser) return

  const nextCurrent = users.find((item) => item.id === currentUser.id)
  if (nextCurrent) {
    window.localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(nextCurrent))
  }
}

const awardPointsToUser = (userId, amount, rewardType) => {
  if (!userId || !amount) return

  const users = getStoredUsers()
  const nextUsers = users.map((item) => {
    if (item.id !== userId) return item

    const nextProfile = {
      ...item,
      points: Number(item.points || 0) + amount,
      documentUploads: Number(item.documentUploads || 0),
      documentDownloadsEarned: Number(item.documentDownloadsEarned || 0),
      fiveStarBonuses: Number(item.fiveStarBonuses || 0)
    }

    if (rewardType === 'documentPublished') {
      nextProfile.documentUploads += 1
    }

    if (rewardType === 'documentDownloaded') {
      nextProfile.documentDownloadsEarned += 1
    }

    if (rewardType === 'documentRatedFiveStars') {
      nextProfile.fiveStarBonuses += 1
    }

    return normalizeUserRewards(nextProfile)
  })

  persistUsers(nextUsers)
  syncCurrentUser(nextUsers)
}

const getFileExtension = (fileName) => {
  const index = fileName.lastIndexOf('.')
  if (index === -1) return ''
  return fileName.slice(index).toLowerCase()
}

const getFileTypeLabel = (extension) => {
  if (extension === '.pdf') return 'pdf'
  if (extension === '.doc' || extension === '.docx') return 'word'
  if (extension === '.ppt' || extension === '.pptx') return 'powerpoint'
  if (extension === '.jpg' || extension === '.jpeg' || extension === '.png' || extension === '.webp') return 'image'
  return 'file'
}

const normalizeDocument = (doc) => ({
  ...doc,
  authorId: doc.authorId ?? null,
  rating: Number(doc.rating || 0),
  ratingBonusGranted: Boolean(doc.ratingBonusGranted),
  downloadCount: Number(doc.downloadCount || 0),
  ratings: Array.isArray(doc.ratings)
    ? doc.ratings.map((item) => ({
        userId: item.userId ?? null,
        rating: clampRating(item.rating),
        date: item.date || new Date().toISOString()
      }))
    : Number(doc.rating || 0) > 0
      ? [
          {
            userId: 'legacy',
            rating: clampRating(doc.rating),
            date: new Date().toISOString()
          }
        ]
      : [],
  comments: Array.isArray(doc.comments)
    ? doc.comments.map((comment) => ({
        id: comment.id || Date.now(),
        userId: comment.userId ?? null,
        userName: comment.userName || 'Étudiant',
        message: comment.message || '',
        date: comment.date || new Date().toISOString()
      }))
    : []
})

const getStoredDocuments = () => {
  const stored = safeParse(window.localStorage.getItem(DOCUMENTS_KEY), null)
  if (Array.isArray(stored)) return stored.map(normalizeDocument)
  window.localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(DEFAULT_DOCUMENTS))
  return DEFAULT_DOCUMENTS
}

const getTypeIcon = (type) => {
  if (type === 'pdf') {
    return {
      label: 'PDF',
      icon: '📄',
      background: '#dc3545'
    }
  }

  if (type === 'word') {
    return {
      label: 'WORD',
      icon: '📘',
      background: '#0d6efd'
    }
  }

  if (type === 'powerpoint') {
    return {
      label: 'PPT',
      icon: '📙',
      background: '#fd7e14'
    }
  }

  if (type === 'image') {
    return {
      label: 'IMAGE',
      icon: '🖼️',
      background: '#6f42c1'
    }
  }

  return {
    label: 'FICHIER',
    icon: '📎',
    background: '#6c757d'
  }
}

const triggerBrowserDownload = (doc) => {
  if (!doc.fileUrl) return
  const link = document.createElement('a')
  link.href = doc.fileUrl
  link.download = doc.fileName || 'document'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export default function Documents() {
  const { user } = useAuth()
  const token = window.localStorage.getItem('edudia_auth_token')
  const programme = user?.programme || ''
  const isAdmin = user?.role === 'admin'
  const [query, setQuery] = useState('')
  const [filterMode, setFilterMode] = useState('general')
  const [sortMode, setSortMode] = useState('recent')
  const [documents, setDocuments] = useState([])
  const [form, setForm] = useState({
    title: '',
    course: '',
    category: 'Général',
    file: null
  })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState(null)
  const [reportReason, setReportReason] = useState(REPORT_REASONS[0])
  const [reportDescription, setReportDescription] = useState('')
  const [commentDrafts, setCommentDrafts] = useState({})
  const [activeCommentDocumentId, setActiveCommentDocumentId] = useState(null)
  const [favorites, setFavorites] = useState(() => readFavorites())

  useEffect(() => {
    setFavorites(readFavorites())
  }, [user?.id])

  useEffect(() => {
  const loadDocuments = async () => {
    try {
      setError('')

      const response = await documentAPI.getAllDocuments(token)
      const receivedDocuments = response.data?.documents || []

      const normalizedDocuments = receivedDocuments.map((doc) =>
        normalizeDocument({
          id: doc.id,
          title: doc.title,
          description: doc.description || '',
          category:
            doc.program === 'Général'
              ? 'Général'
              : doc.program,
          programme: doc.program,
          course:
            doc.course_name ||
            doc.course_code ||
            'Sans cours',
          author:
            `${doc.first_name || ''} ${doc.last_name || ''}`.trim() ||
            'Étudiant',
          authorId: doc.uploaded_by,
          date: doc.created_at,
          fileName:
            doc.file_url?.split('/').pop() ||
            'document',
          fileType: getFileTypeLabel(
            getFileExtension(doc.file_url || '')
          ),
          fileUrl: doc.file_url
            ? `${BACKEND_ORIGIN}${doc.file_url}`
            : '',
          rating: Number(doc.average_rating || 0),
          downloadCount: Number(doc.download_count || 0),
          ratings: [],
          comments: []
        })
      )

      setDocuments(normalizedDocuments)
    } catch (error) {
      console.error('Erreur chargement documents :', error)

      setError(
        error.message ||
          'Impossible de charger les documents.'
      )
    }
  }

  if (token) {
    loadDocuments()
  }
}, [token])

  const allowedCategories = useMemo(() => {
    if (!programme) return ['Général']
    return ['Général', programme]
  }, [programme])

const availableCourses = useMemo(() => {
  return COURSES_BY_CATEGORY[form.category] || []
}, [form.category])

  const visibleDocuments = useMemo(() => {
    return documents.filter((doc) => doc.category === 'Général' || (programme && doc.category === programme))
  }, [documents, programme])

  const filteredDocuments = useMemo(() => {
  const normalizedQuery = query.toLowerCase().trim()

  const nextDocuments = visibleDocuments
    .filter((doc) => {
      if (filterMode === 'general') {
        return doc.category === 'Général'
      }

      if (filterMode === 'program') {
        return programme && doc.category === programme
      }

      return true
    })
    .filter((doc) => {
      if (!normalizedQuery) return true

      return (
        String(doc.title || '')
          .toLowerCase()
          .includes(normalizedQuery) ||
        String(doc.course || '')
          .toLowerCase()
          .includes(normalizedQuery)
      )
    })

  return [...nextDocuments].sort((left, right) => {
    if (sortMode === 'rating') {
      return Number(right.rating || 0) -
        Number(left.rating || 0)
    }

    if (sortMode === 'downloads') {
      return Number(right.downloadCount || 0) -
        Number(left.downloadCount || 0)
    }

    if (sortMode === 'alphabetical') {
      return String(left.title || '').localeCompare(
        String(right.title || ''),
        'fr',
        { sensitivity: 'base' }
      )
    }

    return (
      new Date(right.date || 0).getTime() -
      new Date(left.date || 0).getTime()
    )
  })
}, [
  visibleDocuments,
  filterMode,
  query,
  programme,
  sortMode
])

  const groupedDocuments = useMemo(() => {
  return filteredDocuments.reduce((acc, doc) => {
    const courseName =
      String(doc.course || '').trim() ||
      'Sans cours'

    if (!acc[courseName]) {
      acc[courseName] = []
    }

    acc[courseName].push(doc)

    return acc
  }, {})
}, [filteredDocuments])

  const getDocumentRatings = (doc) => {
    return Array.isArray(doc.ratings) ? doc.ratings : []
  }

  const getDocumentComments = (doc) => {
    return Array.isArray(doc.comments)
      ? [...doc.comments].sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())
      : []
  }

  const getDocumentFavorite = (documentId) => {
    return favorites.find((favorite) => favorite.userId === user?.id && favorite.documentId === documentId) || null
  }

  const isDocumentFavorite = (documentId) => Boolean(getDocumentFavorite(documentId))

  const persistFavorites = (nextFavorites) => {
    const normalized = nextFavorites
      .filter((favorite) => favorite && favorite.userId && favorite.documentId)
      .map((favorite) => ({
        userId: favorite.userId,
        documentId: favorite.documentId,
        createdAt: favorite.createdAt || new Date().toISOString()
      }))

    setFavorites(normalized)
    saveFavorites(normalized)
  }

  const toggleFavorite = (doc) => {
    if (!user?.id) return

    const favorite = getDocumentFavorite(doc.id)
    if (favorite) {
      const nextFavorites = favorites.filter((item) => !(item.userId === user.id && item.documentId === doc.id))
      persistFavorites(nextFavorites)
      setMessage('Document retiré des favoris.')
      return
    }

    persistFavorites([
      {
        userId: user.id,
        documentId: doc.id,
        createdAt: new Date().toISOString()
      },
      ...favorites
    ])
    setMessage('Document ajouté aux favoris.')
  }

  const persistDocuments = (nextDocuments) => {
    const normalized = nextDocuments.map(normalizeDocument)
    setDocuments(normalized)
    window.localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(normalized))
    window.localStorage.setItem(DOCUMENTS_RATINGS_KEY, JSON.stringify(normalized.map((doc) => ({
      id: doc.id,
      ratings: doc.ratings,
      comments: doc.comments
    }))))
  }

  const handleFormChange = (event) => {
  const { name, value } = event.target

  setForm((previous) => {
    if (name === 'category') {
      return {
        ...previous,
        category: value,
        course: ''
      }
    }

    return {
      ...previous,
      [name]: value
    }
  })
}

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null
    setForm((previous) => ({ ...previous, file }))
  }

const handleAddDocument = async (event) => {
  event.preventDefault()

  setError('')
  setMessage('')

  const title = form.title.trim()
  const course = form.course.trim()
  const category = form.category
  const file = form.file

  if (!title || !course || !category || !file) {
    setError(
      'Remplis le titre, le cours, la catégorie et choisis un fichier.'
    )
    return
  }

  if (!allowedCategories.includes(category)) {
    setError('Catégorie invalide pour ton profil.')
    return
  }

  const extension = getFileExtension(file.name)

  if (!ACCEPTED_EXTENSIONS.includes(extension)) {
    setError('Type de fichier non accepté.')
    return
  }

  if (file.size > MAX_FILE_SIZE) {
    setError('Le fichier dépasse 10 Mo.')
    return
  }

  const formData = new FormData()

  formData.append('file', file)
  formData.append('title', title)
  formData.append('description', '')
  formData.append(
    'school',
    user?.school || user?.ecole || 'Établissement non précisé'
  )
  formData.append(
    'program',
    category === 'Général'
      ? 'Général'
      : programme
  )
  formData.append('courseCode', course)
  formData.append('courseName', course)

  try {
    await documentAPI.uploadDocument(
      token,
      formData
    )

    const adminUsers = getStoredUsers().filter(
  (storedUser) => storedUser.role === 'admin'
)

queueNotifications(
  adminUsers
    .filter(
      (adminUser) =>
        Number(adminUser.id) !== Number(user?.id)
    )
    .map((adminUser) =>
      createNotification({
        id: `document-published-${Date.now()}-${adminUser.id}`,
        userId: adminUser.id,
        title: 'Nouveau document publié',
        message: `${
          user?.nom ||
          user?.firstName ||
          user?.first_name ||
          'Un étudiant'
        } a publié le document « ${title} ».`,
        type: 'document'
      })
    )
)

    const response =
      await documentAPI.getAllDocuments(token)

    const receivedDocuments =
      response.data?.documents || []

    const normalizedDocuments =
      receivedDocuments.map((doc) =>
        normalizeDocument({
          id: doc.id,
          title: doc.title,
          description: doc.description || '',
          category:
            doc.program === 'Général'
              ? 'Général'
              : doc.program,
          programme: doc.program,
          course:
            doc.course_name ||
            doc.course_code ||
            'Sans cours',
          author:
            `${doc.first_name || ''} ${
              doc.last_name || ''
            }`.trim() || 'Étudiant',
          authorId: doc.uploaded_by,
          date: doc.created_at,
          fileName:
            doc.file_url?.split('/').pop() ||
            file.name,
          fileType: getFileTypeLabel(
            getFileExtension(
              doc.file_url || file.name
            )
          ),
          fileUrl: doc.file_url
            ? `${BACKEND_ORIGIN}${doc.file_url}`
            : '',
          rating: Number(
            doc.average_rating || 0
          ),
          downloadCount: Number(
            doc.download_count || 0
          ),
          ratings: [],
          comments: []
        })
      )

    setDocuments(normalizedDocuments)

    if (user?.id) {
      awardPointsToUser(
        user.id,
        POINTS.documentPublished,
        'documentPublished'
      )
    }

    setForm({
      title: '',
      course: '',
      category: 'Général',
      file: null
    })

    const input = document.getElementById(
      'document-file-input'
    )

    if (input) {
      input.value = ''
    }

    setMessage(
      'Document importé avec succès. +10 points ajoutés.'
    )
  } catch (error) {
    console.error(
      'Erreur importation document :',
      error
    )

    setError(
      error.message ||
        'Impossible d’importer le document.'
    )
  }
}

  const handleView = (doc) => {
    if (!doc.fileUrl) return
    window.open(doc.fileUrl, '_blank', 'noopener,noreferrer')
  }

  const handleDownload = (doc) => {
    if (!doc.fileUrl) return

    const nextDocuments = documents.map((item) => {
      if (item.id !== doc.id) return item
      return { ...item, downloadCount: Number(item.downloadCount || 0) + 1 }
    })
    persistDocuments(nextDocuments)

    if (doc.authorId && user?.id && doc.authorId !== user.id) {
      awardPointsToUser(doc.authorId, POINTS.documentDownloaded, 'documentDownloaded')
    }

    if (
  doc.authorId &&
  Number(doc.authorId) !== Number(user?.id)
) {
  queueNotifications([
    createNotification({
      id: `document-download-${doc.id}-${user.id}-${Date.now()}`,
      userId: doc.authorId,
      title: 'Votre document a été téléchargé',
      message: `${
        user?.nom ||
        user?.firstName ||
        user?.first_name ||
        'Un étudiant'
      } a téléchargé votre document « ${doc.title} ».`,
      type: 'document'
    })
  ])
}

    triggerBrowserDownload(doc)
  }

  const handleDeleteDocument = async (docId) => {
  if (!window.confirm('Supprimer ce document ?')) return

  try {
    await documentAPI.deleteDocument(token, docId)

    setDocuments((previous) =>
      previous.filter((doc) => doc.id !== docId)
    )

    setMessage('Document supprimé.')
  } catch (error) {
    console.error(error)
    setError(error.message || 'Impossible de supprimer le document.')
  }
}

  const handleRateDocument = (doc, rating) => {
    if (!user?.id) return

    const nextRating = clampRating(rating)
    const currentRatings = getDocumentRatings(doc)
    const alreadyRated = currentRatings.some((item) => item.userId === user.id)
    if (alreadyRated) {
      setMessage('Vous avez déjà évalué ce document.')
      return
    }

    const shouldGrantBonus = nextRating === 5 && !doc.ratingBonusGranted && doc.authorId && user?.id && doc.authorId !== user.id

    const newRating = {
      userId: user.id,
      rating: nextRating,
      date: new Date().toISOString()
    }

    const nextDocuments = documents.map((item) => {
      if (item.id !== doc.id) return item
      const ratings = [...currentRatings, newRating]
      const averageRating = ratings.length
        ? ratings.reduce((sum, itemRating) => sum + Number(itemRating.rating || 0), 0) / ratings.length
        : 0
      return {
        ...item,
        rating: Number(averageRating.toFixed(1)),
        ratings,
        ratingBonusGranted: item.ratingBonusGranted || shouldGrantBonus
      }
    })

    persistDocuments(nextDocuments)

    if (
  doc.authorId &&
  Number(doc.authorId) !== Number(user?.id)
) {
  queueNotifications([
    createNotification({
      id: `document-rating-${doc.id}-${user.id}-${Date.now()}`,
      userId: doc.authorId,
      title: 'Nouvelle note sur votre document',
      message: `${
        user?.nom ||
        user?.firstName ||
        user?.first_name ||
        'Un étudiant'
      } a donné ${nextRating}/5 à votre document « ${doc.title} ».`,
      type: 'document'
    })
  ])
}

    if (shouldGrantBonus) {
      awardPointsToUser(doc.authorId, POINTS.documentRatedFiveStars, 'documentRatedFiveStars')
      setMessage('Merci pour votre note. Le propriétaire du document reçoit un bonus de +5 points.')
      return
    }

    setMessage('Note enregistrée avec succès.')
  }

  const handleCommentChange = (documentId, value) => {
    setCommentDrafts((previous) => ({ ...previous, [documentId]: value }))
  }

  const handleAddComment = (doc) => {
    if (!user?.id) return

    const message = String(commentDrafts[doc.id] || '').trim()
    if (!message) {
      setMessage('Veuillez saisir un commentaire avant de l’ajouter.')
      return
    }

    const nextDocuments = documents.map((item) => {
      if (item.id !== doc.id) return item

      return {
        ...item,
        comments: [
          {
            id: Date.now(),
            userId: user.id,
            userName: user.nom || 'Étudiant',
            message,
            date: new Date().toISOString()
          },
          ...(Array.isArray(item.comments) ? item.comments : [])
        ]
      }
    })

    persistDocuments(nextDocuments)

    if (doc.authorId && doc.authorId !== user.id) {
      queueNotifications([
        createNotification({
          id: `doc-comment-${doc.id}-${Date.now()}-${doc.authorId}`,
          userId: doc.authorId,
          title: 'Nouveau commentaire sur votre document',
          message: `${user.nom || 'Un étudiant'} a commenté « ${doc.title} ».`,
          type: 'comment'
        })
      ])
    }

    setCommentDrafts((previous) => ({ ...previous, [doc.id]: '' }))
    setActiveCommentDocumentId(doc.id)
    setMessage('Commentaire ajouté avec succès.')
  }

  const handleDeleteComment = (docId, commentId) => {
    const nextDocuments = documents.map((item) => {
      if (item.id !== docId) return item

      const comments = (item.comments || []).filter((comment) => {
        if (comment.id !== commentId) return true
        return isAdmin ? false : comment.userId !== user?.id
      })

      return {
        ...item,
        comments
      }
    })

    persistDocuments(nextDocuments)
    setMessage('Commentaire supprimé.')
  }

  const openReportModal = (doc) => {
    setSelectedDocument(doc)
    setReportReason(REPORT_REASONS[0])
    setReportDescription('')
    setReportModalOpen(true)
  }

  const closeReportModal = () => {
    setReportModalOpen(false)
    setSelectedDocument(null)
    setReportReason(REPORT_REASONS[0])
    setReportDescription('')
  }

  const handleSubmitReport = async (event) => {
  event.preventDefault()

  if (!selectedDocument) return

  setError('')
  setMessage('')

  try {
    await documentAPI.reportDocument(
      token,
      selectedDocument.id,
      {
        reason: reportReason,
        description: reportDescription.trim()
      }
    )

    const adminUsers = getStoredUsers().filter(
  storedUser => storedUser.role === 'admin'
)

queueNotifications(
  adminUsers
    .filter(
      adminUser =>
        Number(adminUser.id) !== Number(user?.id)
    )
    .map(adminUser =>
      createNotification({
        id: `document-report-${selectedDocument.id}-${Date.now()}-${adminUser.id}`,
        userId: adminUser.id,
        title: 'Nouveau signalement',
        message: `${
          user?.nom ||
          user?.firstName ||
          user?.first_name ||
          'Un étudiant'
        } a signalé le document « ${selectedDocument.title} » pour la raison : ${reportReason}.`,
        type: 'report'
      })
    )
)

    setMessage(
      'Signalement envoyé. Merci de nous aider à maintenir la qualité de la plateforme.'
    )

    closeReportModal()
  } catch (error) {
    console.error('Erreur envoi signalement :', error)

    setError(
      error.message || 'Impossible d’envoyer le signalement.'
    )
  }
}

  return (
    <Container className="py-4 documents-page">
      <h1>Documents</h1>

      {message && <Alert variant="success">{message}</Alert>}
      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="mb-3">
        <Card.Body>
          <Card.Title className="h5">Importer un document</Card.Title>
          <Form onSubmit={handleAddDocument}>
            <Row className="g-3">
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Titre</Form.Label>
                  <Form.Control name="title" value={form.title} onChange={handleFormChange} />
                </Form.Group>
              </Col>
              <Col md={2}>
  <Form.Group>
    <Form.Label>Cours</Form.Label>

    <Form.Select
      name="course"
      value={form.course}
      onChange={handleFormChange}
      disabled={availableCourses.length === 0}
    >
      <option value="">
        {availableCourses.length > 0
          ? 'Choisir un cours'
          : 'Aucun cours configuré'}
      </option>

      {availableCourses.map((course) => (
        <option key={course} value={course}>
          {course}
        </option>
      ))}
    </Form.Select>
  </Form.Group>
</Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Catégorie</Form.Label>
                  <Form.Select name="category" value={form.category} onChange={handleFormChange}>
                    <option value="Général">Général</option>
                    {programme && <option value={programme}>{programme}</option>}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Fichier</Form.Label>
                  <Form.Control
                    id="document-file-input"
                    type="file"
                    accept={ACCEPT_ATTR}
                    onChange={handleFileChange}
                  />
                </Form.Group>
              </Col>
              <Col md={1} className="d-flex align-items-end">
                <Button type="submit" className="w-100">+</Button>
              </Col>
            </Row>
            <Form.Text className="text-muted d-block mt-2">
              Types acceptés: PDF, Word, PowerPoint, JPG, JPEG, PNG, WEBP. Taille maximale: 10 Mo.
            </Form.Text>
          </Form>
        </Card.Body>
      </Card>

      <div className="d-flex flex-wrap gap-2 align-items-center my-3">
  <ButtonGroup>
    <Button
      variant={
        filterMode === 'general'
          ? 'primary'
          : 'outline-primary'
      }
      onClick={() => setFilterMode('general')}
    >
      Général
    </Button>

    <Button
      variant={
        filterMode === 'program'
          ? 'primary'
          : 'outline-primary'
      }
      onClick={() => setFilterMode('program')}
      disabled={!programme}
    >
      Mon programme
    </Button>
  </ButtonGroup>

  <Form.Select
    value={sortMode}
    onChange={(event) => setSortMode(event.target.value)}
    aria-label="Trier les documents"
    style={{
      width: '210px',
      maxWidth: '100%'
    }}
  >
    <option value="recent">Plus récents</option>
    <option value="rating">Mieux notés</option>
    <option value="downloads">Plus téléchargés</option>
    <option value="alphabetical">Ordre alphabétique</option>
  </Form.Select>

  <Form
    className="ms-auto documents-search-form"
    style={{ minWidth: '260px' }}
  >

  </Form>
  <Form
    className="ms-auto documents-search-form"
    style={{ minWidth: '260px' }}
  >
          <div className="documents-search-actions">
            <Form.Control
              placeholder="Rechercher un document..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <Button
              type="button"
              variant="outline-secondary"
              onClick={() => setQuery('')}
              disabled={!query}
            >
              Effacer la recherche
            </Button>
          </div>
        </Form>
      </div>

      <Form.Text className="text-muted d-block mb-2">
        Visibilité: les documents Général sont visibles par tous; les documents de programme sont visibles seulement par les étudiants du programme.
      </Form.Text>

      {filteredDocuments.length === 0 && (
        <Alert variant="info">
          {query ? 'Aucun document trouvé pour cette recherche.' : 'Aucun document pour ce filtre.'}
        </Alert>
      )}

      <Accordion
  alwaysOpen
  className="documents-course-accordion"
>
  {Object.entries(groupedDocuments).map(
    ([course, courseDocs], index) => (
      <Accordion.Item
        eventKey={String(index)}
        key={course}
        className="mb-3"
      >
        <Accordion.Header>
          <span className="fw-semibold">
            📘 {course}
          </span>

          <Badge
            bg="secondary"
            className="ms-2"
          >
            {courseDocs.length}
          </Badge>
        </Accordion.Header>

        <Accordion.Body>
          <div className="d-grid gap-2">
            {courseDocs.map((doc) => {
                    const typeInfo = getTypeIcon(doc.fileType)
                    const ratings = getDocumentRatings(doc)
                    const averageRating = ratings.length
                      ? ratings.reduce((sum, item) => sum + Number(item.rating || 0), 0) / ratings.length
                      : 0
                    const comments = getDocumentComments(doc)
                    const averageLabel = ratings.length ? `${averageRating.toFixed(1)}/5` : '0.0/5'

                    return (
                    <div
  key={doc.id}
  className="document-item document-card-modern"
>
  <div className="document-card-modern__header">
    <div className="document-card-modern__identity">
      <div
        className="document-type-icon"
        style={{
          backgroundColor: typeInfo.background
        }}
        title={typeInfo.label}
        aria-label={typeInfo.label}
      >
        <span className="document-type-icon__emoji">
          {typeInfo.icon}
        </span>

        <span className="document-type-icon__label">
          {typeInfo.label}
        </span>
      </div>

      <div className="document-card-modern__information">
        <div className="document-card-modern__title-row">
          <div className="document-card-modern__title">
            {doc.title}
          </div>

          {Date.now() - new Date(doc.date || 0).getTime() <=
            7 * 24 * 60 * 60 * 1000 && (
            <Badge bg="success">
              Nouveau
            </Badge>
          )}
        </div>

        <div className="document-card-modern__file">
          {doc.fileName || 'Sans fichier'}
        </div>

        <div className="document-card-modern__author">
          <span className="document-card-modern__avatar">
            {String(doc.author || 'E')
              .trim()
              .charAt(0)
              .toUpperCase()}
          </span>

          <span>
            {doc.author || 'Étudiant'}
          </span>

          <span aria-hidden="true">•</span>

          <span>
            {doc.date || '-'}
          </span>
        </div>
      </div>
    </div>

    <div className="document-card-modern__actions">
      <Button
        size="sm"
        variant="outline-primary"
        onClick={() => handleView(doc)}
        disabled={!doc.fileUrl}
        title="Voir le document"
      >
        👁 Voir
      </Button>

      <Button
        size="sm"
        variant="outline-secondary"
        onClick={() => handleDownload(doc)}
        disabled={!doc.fileUrl}
        title="Télécharger le document"
      >
        ⬇ Télécharger
      </Button>

{(isAdmin || doc.authorId === user?.id) && (
  <Button
    size="sm"
    variant="outline-danger"
    onClick={() => handleDeleteDocument(doc.id)}
    title="Supprimer le document"
  >
    🗑 Supprimer
  </Button>
)}

      <Button
        size="sm"
        variant="outline-danger"
        onClick={() => openReportModal(doc)}
        title="Signaler le document"
      >
        🚩
      </Button>
    </div>
  </div>
                        

                      <div className="d-flex flex-wrap align-items-center justify-content-between mt-2">

  <div className="d-flex align-items-center gap-2">
    <span
      style={{
        color: "#ffc107",
        fontSize: "20px",
        cursor: "pointer",
        letterSpacing: "2px"
      }}
    >
      {[1, 2, 3, 4, 5].map((ratingValue) => (
        <span
          key={ratingValue}
          onClick={() => handleRateDocument(doc, ratingValue)}
          style={{
            opacity: averageRating >= ratingValue ? 1 : 0.35,
            pointerEvents: getDocumentRatings(doc).some(
              (item) => item.userId === user?.id
            )
              ? "none"
              : "auto"
          }}
        >
          ★
        </span>
      ))}
    </span>

    <small className="text-muted">
      {averageLabel} ({ratings.length})
    </small>
  </div>

  <small className="text-muted">
    ⬇ {doc.downloadCount || 0}
  </small>

</div>

                      <div className="d-flex flex-wrap align-items-center gap-2 mt-2">
                        <Button
                          size="sm"
                          variant={isDocumentFavorite(doc.id) ? 'danger' : 'outline-danger'}
                          onClick={() => toggleFavorite(doc)}
                        >
                          {isDocumentFavorite(doc.id) ? '❤️ Retirer des favoris' : '❤️ Ajouter aux favoris'}
                        </Button>
                      </div>

                      <div className="d-flex flex-wrap align-items-center gap-2 mt-2">
                        <span className="text-muted small">{comments.length} commentaire(s)</span>
                        <Button
                          size="sm"
                          variant="outline-primary"
                          onClick={() => setActiveCommentDocumentId(activeCommentDocumentId === doc.id ? null : doc.id)}
                        >
                          Ajouter un commentaire
                        </Button>
                      </div>

                      {activeCommentDocumentId === doc.id && (
                        <div className="mt-3">
                          <Form.Group className="mb-2">
                            <Form.Control
                              as="textarea"
                              rows={3}
                              placeholder="Écrire un commentaire..."
                              value={commentDrafts[doc.id] || ''}
                              onChange={(event) => handleCommentChange(doc.id, event.target.value)}
                            />
                          </Form.Group>
                          <div className="d-flex justify-content-end gap-2">
                            <Button variant="outline-secondary" size="sm" onClick={() => setActiveCommentDocumentId(null)}>
                              Annuler
                            </Button>
                            <Button size="sm" onClick={() => handleAddComment(doc)}>
                              Publier
                            </Button>
                          </div>
                        </div>
                      )}

                      <div className="mt-3">
                        <div className="fw-semibold mb-2">Commentaires</div>
                        {comments.length === 0 ? (
                          <div className="text-muted small">Aucun commentaire pour le moment.</div>
                        ) : (
                          <div className="d-grid gap-2">
                            {comments.map((comment) => {
                              const canDeleteComment = isAdmin || comment.userId === user?.id

                              return (
                                <div key={comment.id} className="border rounded bg-white p-2">
                                  <div className="d-flex justify-content-between align-items-start gap-2">
                                    <div>
                                      <div className="fw-semibold">{comment.userName || 'Étudiant'}</div>
                                      <div className="text-muted small">{formatCommentDate(comment.date)}</div>
                                    </div>
                                    {canDeleteComment && (
                                      <Button size="sm" variant="outline-danger" onClick={() => handleDeleteComment(doc.id, comment.id)}>
                                        Supprimer
                                      </Button>
                                    )}
                                  </div>
                                  <div className="mt-2">{comment.message}</div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>

                      {doc.fileType === 'image' && doc.fileUrl && (
                        <img src={doc.fileUrl} alt={doc.title} className="document-image-preview mt-2" />
                      )}

                    </div>
                    )
                  })}
                          </div>
        </Accordion.Body>
      </Accordion.Item>
    )
  )}
</Accordion>

      <Modal show={reportModalOpen} onHide={closeReportModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Signaler ce document</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmitReport}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Raison du signalement</Form.Label>
              <Form.Select value={reportReason} onChange={(event) => setReportReason(event.target.value)}>
                {REPORT_REASONS.map((reason) => (
                  <option key={reason} value={reason}>{reason}</option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group>
              <Form.Label>Description optionnelle</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={reportDescription}
                onChange={(event) => setReportDescription(event.target.value)}
                placeholder="Ajoute un détail utile pour l'administration..."
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={closeReportModal}>Annuler</Button>
            <Button type="submit" variant="danger">Signaler</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  )
}
