import React, { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Badge,
  Button,
  ButtonGroup,
  Card,
  Col,
  Container,
  Form,
  Modal,
  Row,
  Table
} from 'react-bootstrap'
import { useAuth } from '../context/AuthContext.jsx'
import './Admin.css'
import {
  userAPI,
  documentAPI,
  reportAPI,
  forumAPI
} from '../services/api'

const USERS_KEY = 'edudia_users'
const DOCUMENTS_KEY = 'edudia_documents'
const FORUMS_KEY = 'edudia_forums_by_programme'
const COMMUNICATIONS_KEY = 'edudia_communications'
const NOTIFICATIONS_KEY = 'edudia_notifications'
const NOTIFICATION_EVENT = 'edudia-notifications-updated'
const CURRENT_USER_KEY = 'edudia_current_user'

const LEVELS = [
  { name: 'Débutant', min: 0, max: 99 },
  { name: 'Contributeur', min: 100, max: 499 },
  { name: 'Expert', min: 500, max: 999 },
  { name: 'Ambassadeur', min: 1000, max: Number.POSITIVE_INFINITY }
]

const safeParse = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

const getLevelFromPoints = (points) => {
  return LEVELS.find((level) => points >= level.min && points <= level.max) || LEVELS[0]
}

const normalizeUserStats = (input) => {
  const points = Number(input?.points || 0)
  const documentUploads = Number(input?.documentUploads || 0)
  const forumReplies = Number(input?.forumReplies || 0)
  const documentDownloadsEarned = Number(input?.documentDownloadsEarned || 0)
  const fiveStarBonuses = Number(input?.fiveStarBonuses || 0)
  const level = input?.level || getLevelFromPoints(points).name

  return {
    ...input,
    points,
    level,
    createdAt: input?.createdAt || '',
    documentUploads,
    forumReplies,
    documentDownloadsEarned,
    fiveStarBonuses
  }
}

const formatCreatedAt = (createdAt) => {
  if (!createdAt) return 'Date inconnue'

  const date = new Date(createdAt)
  if (Number.isNaN(date.getTime())) return 'Date inconnue'

  const datePart = date.toLocaleDateString('fr-CA')
  const timePart = date.toLocaleTimeString('fr-CA', {
    hour: '2-digit',
    minute: '2-digit'
  })

  return `${datePart} ${timePart}`
}

const readUsers = () => {
  const users = safeParse(window.localStorage.getItem(USERS_KEY), [])
  return Array.isArray(users) ? users.map(normalizeUserStats) : []
}

const readDocuments = () => {
  const docs = safeParse(window.localStorage.getItem(DOCUMENTS_KEY), [])
  return Array.isArray(docs) ? docs : []
}

const readForums = () => {
  const forums = safeParse(window.localStorage.getItem(FORUMS_KEY), {})
  return forums && typeof forums === 'object' ? forums : {}
}

const saveUsers = (users) => {
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

const saveDocuments = (docs) => {
  window.localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(docs))
}

const saveForums = (forums) => {
  window.localStorage.setItem(FORUMS_KEY, JSON.stringify(forums))
}

const readCommunications = () => {
  const communications = safeParse(window.localStorage.getItem(COMMUNICATIONS_KEY), [])
  return Array.isArray(communications) ? communications : []
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

const syncCurrentUser = (users) => {
  const current = safeParse(window.localStorage.getItem(CURRENT_USER_KEY), null)
  if (!current) return

  const nextCurrent = users.find((item) => item.id === current.id)
  if (!nextCurrent) {
    window.localStorage.removeItem(CURRENT_USER_KEY)
    return
  }

  window.localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(nextCurrent))
}

const countDocumentsByAuthorId = (documents) => {
  return documents.reduce((accumulator, document) => {
    if (!document.authorId) return accumulator
    accumulator[document.authorId] = (accumulator[document.authorId] || 0) + 1
    return accumulator
  }, {})
}

const countForumRepliesByAuthorId = (forumsByProgramme) => {
  return Object.values(forumsByProgramme).flat().reduce((accumulator, question) => {
    const answers = Array.isArray(question?.answers) ? question.answers : []

    answers.forEach((answer) => {
      if (!answer.authorId) return
      accumulator[answer.authorId] = (accumulator[answer.authorId] || 0) + 1
    })

    return accumulator
  }, {})
}

const deleteQuestionById = (forumsByProgramme, questionId) => {
  const nextStore = {}

  Object.entries(forumsByProgramme).forEach(([programme, questions]) => {
    nextStore[programme] = (questions || []).filter((question) => question.id !== questionId)
  })

  return nextStore
}

const deleteAnswerById = (forumsByProgramme, answerId) => {
  const nextStore = {}

  Object.entries(forumsByProgramme).forEach(([programme, questions]) => {
    nextStore[programme] = (questions || []).map((question) => ({
      ...question,
      answers: (question.answers || []).filter((answer) => answer.id !== answerId)
    }))
  })

  return nextStore
}

export default function Admin() {
  const { user: currentUser, logout } = useAuth()
const token = window.localStorage.getItem('edudia_auth_token')
  const [users, setUsers] = useState([])
  const [documents, setDocuments] = useState([])
  const [forumsByProgramme, setForumsByProgramme] = useState(() => readForums())
  const [reports, setReports] = useState([])
  const [communications, setCommunications] = useState(() => readCommunications())
  const [reportFilter, setReportFilter] = useState('all')
  const [selectedReport, setSelectedReport] = useState(null)
  const [communicationTarget, setCommunicationTarget] = useState('all')
  const [communicationProgramme, setCommunicationProgramme] = useState('')
  const [communicationSubject, setCommunicationSubject] = useState('')
  const [communicationMessage, setCommunicationMessage] = useState('')
  const [notice, setNotice] = useState('')
  const [searchUser, setSearchUser] = useState('')
  const [activeTab, setActiveTab] = useState('dashboard')
  const [editUserModalOpen, setEditUserModalOpen] =
  useState(false)

const [editingUser, setEditingUser] =
  useState(null)

const [editFirstName, setEditFirstName] =
  useState('')

const [editLastName, setEditLastName] =
  useState('')

const [editProgramme, setEditProgramme] =
  useState('')

const [editPoints, setEditPoints] =
  useState(0)

useEffect(() => {
  const loadUsers = async () => {
    try {
      const response = await userAPI.getAllUsers(token)
      const receivedUsers = response.data?.users || []

      const normalizedUsers = receivedUsers.map((user) =>
        normalizeUserStats({
          ...user,
          programme: user.program,
          createdAt: user.created_at,
          isDisabled: user.is_active === false
        })
      )

      setUsers(normalizedUsers)
      saveUsers(normalizedUsers)
    } catch (error) {
      console.error('Erreur chargement utilisateurs :', error)
      setNotice(error.message || 'Impossible de charger les utilisateurs.')
    }
  }

  if (token) {
    loadUsers()
  }
}, [token])

useEffect(() => {
  const loadDocuments = async () => {
    try {
      const response = await documentAPI.getAllDocuments(token)

      const docs = (response.data?.documents || []).map((doc) => ({
        ...doc,
        course: doc.course_name,
        category: doc.program ? 'Programme' : 'Général',
        author: `${doc.first_name} ${doc.last_name}`,
        authorId: doc.uploaded_by
      }))

      setDocuments(docs)
    } catch (error) {
      console.error('Erreur chargement documents :', error)
      setNotice(error.message || 'Impossible de charger les documents.')
    }
  }

  if (token) {
    loadDocuments()
  }
}, [token])

useEffect(() => {
  const loadReports = async () => {
    try {
      const response = await reportAPI.getAllReports(token)
      const receivedReports = response.data?.reports || []
console.log(
  'SIGNALEMENTS BACKEND :',
  receivedReports
)
      const normalizedReports = receivedReports.map((report) => ({
        id: report.id,
        contentType: report.content_type || 'document',
contentId: report.content_id ?? report.document_id,
        reason: report.reason || 'Non précisée',
        description: report.description || '',
        reportedBy:
          `${report.first_name || ''} ${report.last_name || ''}`.trim() ||
          'Étudiant',
        reportedById: report.reported_by,
        date: report.created_at,
        status: report.status || 'pending',

documentTitle:
  report.document_title || '',

documentDescription:
  report.document_description || '',

documentFileUrl:
  report.document_file_url || '',

contentTitle:
  report.content_type === 'document'
    ? report.document_title || ''
    : report.content_type === 'question'
      ? report.question_title || ''
      : report.answer_question_title || '',

contentText:
  report.content_type === 'document'
    ? report.document_description || ''
    : report.content_type === 'question'
      ? report.question_content || ''
      : report.answer_content || '',

contentAuthor:
  report.content_type === 'document'
    ? `${report.document_author_first_name || ''} ${report.document_author_last_name || ''}`.trim()
    : report.content_type === 'question'
      ? `${report.question_author_first_name || ''} ${report.question_author_last_name || ''}`.trim()
      : `${report.answer_author_first_name || ''} ${report.answer_author_last_name || ''}`.trim()
      }))

      setReports(normalizedReports)
    } catch (error) {
      console.error(
        'Erreur chargement signalements :',
        error
      )

      setNotice(
        error.message ||
          'Impossible de charger les signalements.'
      )
    }
  }

  if (token) {
    loadReports()
  }
}, [token])

  const students = useMemo(() => users, [users])
  const totalUsers = users.length
  const totalStudents = users.filter((user) => user.role === 'student').length
  const totalAdmins = users.filter((user) => user.role === 'admin').length
  const activeSubscriptions = users.filter((user) => user.subscriptionStatus === 'active').length
  const inactiveSubscriptions = users.filter((user) => user.subscriptionStatus !== 'active').length
  const pendingReportsCount = reports.filter(
  (report) => report.status === 'pending'
).length

  const documentCounts = useMemo(() => countDocumentsByAuthorId(documents), [documents])
  const forumReplyCounts = useMemo(() => countForumRepliesByAuthorId(forumsByProgramme), [forumsByProgramme])

  const studentRows = useMemo(() => {
    return students.map((student) => {
      const points = Number(student.points || 0)
      const documentCount = Number(documentCounts[student.id] || 0)
      const forumReplyCount = Number(forumReplyCounts[student.id] || 0)

      return {
        ...student,
        points,
        level: student.level || getLevelFromPoints(points).name,
        publishedDocuments: documentCount,
        forumRepliesCount: forumReplyCount
      }
    })
  }, [students, documentCounts, forumReplyCounts])
const filteredStudents = studentRows.filter((student) => {
  const search = searchUser.toLowerCase()

  return (
  (`${student.first_name} ${student.last_name}`)
    .toLowerCase()
    .includes(search) ||
  student.email.toLowerCase().includes(search) ||
  (student.programme || '').toLowerCase().includes(search)

  )
});
  const programmeOptions = useMemo(() => {
    return [...new Set(studentRows.map((student) => student.programme).filter(Boolean))].sort((left, right) =>
      left.localeCompare(right, 'fr')
    )
  }, [studentRows])

  useEffect(() => {
    if (communicationTarget !== 'programme') return
    if (programmeOptions.length === 0) return
    if (communicationProgramme && programmeOptions.includes(communicationProgramme)) return
    setCommunicationProgramme(programmeOptions[0])
  }, [communicationTarget, communicationProgramme, programmeOptions])

  const forumQuestions = useMemo(() => {
    return Object.entries(forumsByProgramme).flatMap(([programme, questions]) =>
      (questions || []).map((question) => ({ ...question, programme }))
    )
  }, [forumsByProgramme])

  const allReports = useMemo(() => {
    return [...reports].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [reports])

  const visibleReports = useMemo(() => {
    if (reportFilter === 'all') return allReports
    return allReports.filter((report) => report.status === reportFilter)
  }, [allReports, reportFilter])

  const communicationRecipients = useMemo(() => {
    if (communicationTarget === 'programme') {
      return studentRows.filter((student) => student.programme === communicationProgramme)
    }

    return studentRows
  }, [communicationProgramme, communicationTarget, studentRows])

  const handleToggleUser = (userId) => {
  const nextUsers = users.map((user) => {
    if (user.id !== userId) return user
    return { ...user, isDisabled: !user.isDisabled }
  })

  setUsers(nextUsers)
  saveUsers(nextUsers)
  syncCurrentUser(nextUsers)
}
const handleToggleUserStatus = async (
  userId,
  isActive
) => {
  const selectedUser = users.find(
    (user) => user.id === userId
  )

  const actionLabel = isActive
    ? 'activer'
    : 'désactiver'

  const confirmed = window.confirm(
    `Voulez-vous vraiment ${actionLabel} le compte de ${
      selectedUser?.first_name || 'cet utilisateur'
    } ${
      selectedUser?.last_name || ''
    } ?`
  )

  if (!confirmed) return

  try {
    const response =
      await userAPI.updateUserStatus(
        token,
        userId,
        isActive
      )

    const updatedUser =
      response.data.user

    const nextUsers = users.map((user) =>
      user.id === userId
        ? {
            ...user,
            ...updatedUser,
            isDisabled:
              updatedUser.is_active === false
          }
        : user
    )

    setUsers(nextUsers)
    saveUsers(nextUsers)
    syncCurrentUser(nextUsers)
queueNotifications([
  createNotification({
    id: `account-status-${userId}-${Date.now()}`,
    userId,
    title: isActive
      ? 'Votre compte a été activé'
      : 'Votre compte a été désactivé',
    message: isActive
      ? 'Votre compte Étudia+ a été réactivé par un administrateur.'
      : 'Votre compte Étudia+ a été désactivé par un administrateur.',
    type: 'administration'
  })
])
    setNotice(
      isActive
        ? 'Utilisateur activé avec succès.'
        : 'Utilisateur désactivé avec succès.'
    )
  } catch (error) {
    console.error(
      'Erreur updateUserStatus :',
      error
    )

    setNotice(
      error.message ||
        'Erreur lors de la modification du statut.'
    )
  }
}
const handleDeleteUser = async (userId) => {
  const confirmed = window.confirm(
    "Voulez-vous vraiment supprimer cet utilisateur ? Cette action est irréversible."
  )

  if (!confirmed) return

  try {
    await userAPI.deleteUser(token, userId)

    const nextUsers = users.filter((user) => user.id !== userId)

    setUsers(nextUsers)
    saveUsers(nextUsers)
    syncCurrentUser(nextUsers)

    setNotice("Utilisateur supprimé avec succès.")
  } catch (error) {
    console.error("Erreur suppression utilisateur :", error)

    setNotice(
  error.message || "Impossible de supprimer cet utilisateur."
)
  }
}
const handlePromoteAdmin = async (userId) => {
  const confirmed = window.confirm(
    'Voulez-vous vraiment modifier le rôle de cet utilisateur ?'
  )

  if (!confirmed) return

  const selectedUser = users.find((user) => user.id === userId)
  const nextRole = selectedUser?.role === 'admin' ? 'student' : 'admin'

  try {
    const response = await userAPI.updateUserRole(token, userId, nextRole)
    const updatedUser = response.data.user

    const nextUsers = users.map((user) =>
      user.id === userId
        ? { ...user, ...updatedUser, role: nextRole }
        : user
    )

    setUsers(nextUsers)
    saveUsers(nextUsers)
    syncCurrentUser(nextUsers)

    queueNotifications([
  createNotification({
    id: `role-changed-${userId}-${Date.now()}`,
    userId,
    title:
      nextRole === 'admin'
        ? 'Vous êtes maintenant administrateur'
        : 'Votre rôle administrateur a été retiré',
    message:
      nextRole === 'admin'
        ? 'Votre compte a été promu au rôle administrateur.'
        : 'Votre compte est maintenant un compte étudiant.',
    type: 'administration'
  })
])

    setNotice(
      nextRole === 'admin'
        ? 'Utilisateur promu administrateur avec succès.'
        : 'Rôle administrateur retiré avec succès.'
    )
  } catch (error) {
    console.error('Erreur modification rôle :', error)

    setNotice(
      error.response?.data?.message ||
        'Impossible de modifier le rôle de cet utilisateur.'
    )
  }
}
const openEditUserModal = (student) => {
  setEditingUser(student)

  setEditFirstName(
    student.first_name || ''
  )

  setEditLastName(
    student.last_name || ''
  )

  setEditProgramme(
    student.programme || ''
  )

  setEditPoints(
    Number(student.points || 0)
  )

  setEditUserModalOpen(true)
}

const closeEditUserModal = () => {
  setEditUserModalOpen(false)
  setEditingUser(null)
  setEditFirstName('')
  setEditLastName('')
  setEditProgramme('')
  setEditPoints(0)
}
const handleUpdateUser = async (event) => {
  event.preventDefault()

  const firstName = editFirstName.trim()
  const lastName = editLastName.trim()
  const programme = editProgramme.trim()
  const points = Math.max(
    0,
    Number(editPoints || 0)
  )

  if (
    !editingUser ||
    !firstName ||
    !lastName
  ) {
    setNotice(
      'Le prénom et le nom sont obligatoires.'
    )
    return
  }

  try {
    const response = await userAPI.updateUser(
      token,
      editingUser.id,
      {
        firstName,
        lastName,
        programme,
        points
      }
    )

    const updatedUser = response.data?.user

    const nextUsers = users.map((student) => {
      if (student.id !== editingUser.id) {
        return student
      }

      return normalizeUserStats({
        ...student,
        ...updatedUser,
        first_name:
          updatedUser?.first_name || firstName,
        last_name:
          updatedUser?.last_name || lastName,
        programme:
          updatedUser?.program || programme,
        program:
          updatedUser?.program || programme,
        points:
          updatedUser?.points ?? points,
        level: getLevelFromPoints(
          updatedUser?.points ?? points
        ).name
      })
    })

    setUsers(nextUsers)
    saveUsers(nextUsers)
    syncCurrentUser(nextUsers)
queueNotifications([
  createNotification({
    id: `profile-updated-${editingUser.id}-${Date.now()}`,
    userId: editingUser.id,
    title: 'Votre profil a été modifié',
    message:
      'Certaines informations de votre profil ont été modifiées par un administrateur.',
    type: 'administration'
  })
])
    closeEditUserModal()

    setNotice(
      'Utilisateur modifié avec succès.'
    )
  } catch (error) {
    console.error(
      'Erreur modification utilisateur:',
      error
    )

    setNotice(
      error.message ||
        'Impossible de modifier cet utilisateur.'
    )
  }
}

  const handleDeleteDocument = async (docId) => {
  const confirmed = window.confirm(
    'Voulez-vous vraiment supprimer ce document ?'
  )

  if (!confirmed) return

  try {
    await documentAPI.deleteDocument(token, docId)

    const nextDocs = documents.filter((doc) => doc.id !== docId)
    setDocuments(nextDocs)

    const nextReports = reports.map((report) => {
      if (
        report.contentType === 'document' &&
        report.contentId === docId
      ) {
        return { ...report, status: 'resolved' }
      }

      return report
    })

    setReports(nextReports)

    const deletedDoc = documents.find(doc => doc.id === docId)

if (deletedDoc?.authorId) {
  queueNotifications([
    createNotification({
      id: `document-deleted-${docId}-${Date.now()}`,
      userId: deletedDoc.authorId,
      title: 'Document supprimé',
      message: `Votre document « ${deletedDoc.title} » a été supprimé par un administrateur.`,
      type: 'document'
    })
  ])
}

    setNotice('Document supprimé avec succès.')
  } catch (error) {
    console.error('Erreur suppression document :', error)

    setNotice(
      error.message || 'Impossible de supprimer le document.'
    )
  }
}

  const handleDeleteQuestion = async (questionId) => {
  const confirmed = window.confirm(
    'Voulez-vous vraiment supprimer cette question ?'
  )

  if (!confirmed) return

  const questionToDelete = forumQuestions.find(
    (question) => Number(question.id) === Number(questionId)
  )

  try {
    await forumAPI.deleteQuestion(token, questionId)

    const nextForums = deleteQuestionById(
      forumsByProgramme,
      questionId
    )

    setForumsByProgramme(nextForums)
    saveForums(nextForums)

    if (questionToDelete?.authorId) {
      queueNotifications([
        createNotification({
          id: `question-deleted-${questionId}-${Date.now()}`,
          userId: questionToDelete.authorId,
          title: 'Question supprimée',
          message: `Votre question « ${questionToDelete.title} » a été supprimée par un administrateur.`,
          type: 'forum'
        })
      ])
    }

    setNotice('Question supprimée avec succès.')
  } catch (error) {
    console.error(
      'Erreur suppression question :',
      error
    )

    setNotice(
      error.message ||
        'Impossible de supprimer la question.'
    )
  }
}

  const handleDeleteAnswer = async (answerId) => {
  const confirmed = window.confirm(
    'Voulez-vous vraiment supprimer cette réponse ?'
  )

  if (!confirmed) return

  const answerToDelete = forumQuestions
    .flatMap((question) => question.answers || [])
    .find(
      (answer) =>
        Number(answer.id) === Number(answerId)
    )

  try {
    await forumAPI.deleteAnswer(token, answerId)

    const nextForums = deleteAnswerById(
      forumsByProgramme,
      answerId
    )

    setForumsByProgramme(nextForums)
    saveForums(nextForums)

    if (answerToDelete?.authorId) {
      queueNotifications([
        createNotification({
          id: `answer-deleted-${answerId}-${Date.now()}`,
          userId: answerToDelete.authorId,
          title: 'Réponse supprimée',
          message:
            'Votre réponse a été supprimée par un administrateur.',
          type: 'forum'
        })
      ])
    }

    setNotice('Réponse supprimée avec succès.')
  } catch (error) {
    console.error(
      'Erreur suppression réponse :',
      error
    )

    setNotice(
      error.message ||
        'Impossible de supprimer la réponse.'
    )
  }
}

  const handleIgnoreReport = async (reportId) => {
  const reportToProcess = reports.find(
    (report) => report.id === reportId
  )

  try {
    await reportAPI.ignoreReport(token, reportId)

    const nextReports = reports.map((report) =>
      report.id === reportId
        ? { ...report, status: 'ignored' }
        : report
    )

    setReports(nextReports)

    if (reportToProcess?.reportedById) {
      queueNotifications([
        createNotification({
          id: `report-${reportToProcess.id}-ignored-${reportToProcess.reportedById}`,
          userId: reportToProcess.reportedById,
          title: 'Votre signalement a été traité',
          message:
            'Le signalement concernant ce document a été ignoré par l’administration.',
          type: 'report'
        })
      ])
    }

    setNotice('Signalement ignoré avec succès.')
  } catch (error) {
    console.error(
      'Erreur lors de l’ignorance du signalement :',
      error
    )

    setNotice(
      error.message ||
        'Impossible de modifier le signalement.'
    )
  }
}

  const handleSendCommunication = (event) => {
    event.preventDefault()

    const subject = communicationSubject.trim()
    const message = communicationMessage.trim()

    if (!subject || !message) {
      setNotice('Veuillez remplir le sujet et le message avant l’envoi.')
      return
    }

    if (communicationRecipients.length === 0) {
      setNotice('Aucun étudiant ne correspond aux destinataires choisis.')
      return
    }

    const nextCommunication = {
      id: Date.now(),
      targetMode: communicationTarget,
      programme: communicationTarget === 'programme' ? communicationProgramme : 'Tous les étudiants',
      recipientIds: communicationRecipients.map((student) => student.id),
      recipientCount: communicationRecipients.length,
      subject,
      message,
      sentBy: currentUser?.nom || currentUser?.email || 'Administrateur',
      sentAt: new Date().toISOString()
    }

    const nextCommunications = [nextCommunication, ...communications]
    setCommunications(nextCommunications)
    window.localStorage.setItem(COMMUNICATIONS_KEY, JSON.stringify(nextCommunications))
    queueNotifications(
  communicationRecipients.map((student) =>
    createNotification({
      id: `communication-${nextCommunication.id}-${student.id}`,
      userId: student.id,
      title: subject,
      message,
      type: 'communication'
    })
  )
)
    setCommunicationSubject('')
    setCommunicationMessage('')
    setNotice('Communication envoyée avec succès')
  }

  const handleDeleteStudent = (studentId) => {
    if (currentUser?.id === studentId) {
      setNotice('Vous ne pouvez pas supprimer votre propre compte admin.')
      return
    }

    const confirmed = window.confirm(
      'Êtes-vous sûr de vouloir supprimer ce compte ? Cette action est irréversible.'
    )

    if (!confirmed) return

    const nextUsers = users.filter((user) => user.id !== studentId)
    setUsers(nextUsers)
    saveUsers(nextUsers)
    syncCurrentUser(nextUsers)

    const storedCurrent = safeParse(window.localStorage.getItem(CURRENT_USER_KEY), null)
    if (storedCurrent?.id === studentId) {
      window.localStorage.removeItem(CURRENT_USER_KEY)
      logout()
    }

    setNotice('Compte supprimé avec succès.')
  }

  const handleDeleteReportedContent = async (report) => {
  const contentLabel =
  report.contentType === 'document'
    ? 'document'
    : report.contentType === 'question'
      ? 'question'
      : 'réponse'

const confirmed = window.confirm(
  `Voulez-vous vraiment supprimer cette ${contentLabel} signalée ? Cette action est irréversible.`
)

  if (!confirmed) return

  try {

    await reportAPI.resolveReport(token, report.id)
    if (report.contentType === 'document') {
  await documentAPI.deleteDocument(token, report.contentId)
} else if (report.contentType === 'question') {
  await forumAPI.deleteQuestion(token, report.contentId)
} else if (report.contentType === 'answer') {
  await forumAPI.deleteAnswer(token, report.contentId)
}

    if (report.contentType === 'document') {
  setDocuments((previousDocuments) =>
    previousDocuments.filter(
      (document) =>
        Number(document.id) !== Number(report.contentId)
    )
  )
}

if (report.contentType === 'question') {
  const nextForums = deleteQuestionById(
    forumsByProgramme,
    report.contentId
  )

  setForumsByProgramme(nextForums)
  saveForums(nextForums)
}

if (report.contentType === 'answer') {
  const nextForums = deleteAnswerById(
    forumsByProgramme,
    report.contentId
  )

  setForumsByProgramme(nextForums)
  saveForums(nextForums)
}

    setReports((previousReports) =>
      previousReports.map((item) =>
        item.id === report.id
          ? { ...item, status: 'resolved' }
          : item
      )
    )

    if (report.reportedById) {
      queueNotifications([
        createNotification({
          id: `report-${report.id}-resolved-${report.reportedById}`,
          userId: report.reportedById,
          title: 'Votre signalement a été traité',
          message:
  report.contentType === 'document'
    ? 'Le document signalé a été supprimé par l’administration.'
    : report.contentType === 'question'
      ? 'La question signalée a été supprimée par l’administration.'
      : 'La réponse signalée a été supprimée par l’administration.',
          type: 'report'
        })
      ])
    }

    setNotice(
  report.contentType === 'document'
    ? 'Document signalé supprimé avec succès.'
    : report.contentType === 'question'
      ? 'Question signalée supprimée avec succès.'
      : 'Réponse signalée supprimée avec succès.'
)

  } catch (error) {
    console.error(
      'Erreur suppression du contenu signalé :',
      error
    )

    setNotice(
      error.message ||
        'Impossible de supprimer le contenu signalé.'
    )
  }
}
  return (
    <Container className="py-4 admin-page">
      <h1>Administration</h1>
      <p className="text-muted mb-4">Gerez les utilisateurs, les documents, les forums et les contenus signales.</p>

{activeTab === 'dashboard' && (

      <Row className="g-3 mb-4">
        <Col xs={12} sm={6} lg={3}>
          <Card className="admin-stat-card h-100">
            <Card.Body>
              <div className="admin-stat-label">Utilisateurs</div>
              <div className="admin-stat-value">{totalUsers}</div>
              <div className="text-muted small">Total sur la plateforme</div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <Card className="admin-stat-card h-100">
            <Card.Body>
              <div className="admin-stat-label">Étudiants</div>
              <div className="admin-stat-value">{totalStudents}</div>
              <div className="text-muted small">Comptes étudiants</div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <Card className="admin-stat-card h-100">
            <Card.Body>
              <div className="admin-stat-label">Administrateurs</div>
              <div className="admin-stat-value">{totalAdmins}</div>
              <div className="text-muted small">Comptes d’administration</div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <Card className="admin-stat-card h-100">
            <Card.Body>
              <div className="admin-stat-label">Abonnements</div>
              <div className="admin-stat-value">{activeSubscriptions}</div>
              <div className="text-muted small">Actifs: {activeSubscriptions} | Inactifs: {inactiveSubscriptions}</div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      )}

      {notice && (
        <Alert variant={notice.includes('succès') ? 'success' : 'danger'} onClose={() => setNotice('')} dismissible>
          {notice}
        </Alert>
      )}

<div className="admin-tabs mb-4">

  <Button
    variant={
      activeTab === 'dashboard'
        ? 'primary'
        : 'outline-primary'
    }
    onClick={() => setActiveTab('dashboard')}
  >
    📊 Tableau de bord
  </Button>

  <Button
    variant={
      activeTab === 'users'
        ? 'primary'
        : 'outline-primary'
    }
    onClick={() => setActiveTab('users')}
  >
    👥 Utilisateurs ({totalUsers})
  </Button>

  <Button
    variant={
      activeTab === 'communications'
        ? 'primary'
        : 'outline-primary'
    }
    onClick={() => setActiveTab('communications')}
  >
    📢 Communications
  </Button>

  <Button
    variant={
      activeTab === 'documents'
        ? 'primary'
        : 'outline-primary'
    }
    onClick={() => setActiveTab('documents')}
  >
    📄 Documents ({documents.length})
  </Button>

  <Button
    variant={
      activeTab === 'forum'
        ? 'primary'
        : 'outline-primary'
    }
    onClick={() => setActiveTab('forum')}
  >
    💬 Forum ({forumQuestions.length})
  </Button>

  <Button
    variant={
      activeTab === 'reports'
        ? 'primary'
        : 'outline-primary'
    }
    onClick={() => setActiveTab('reports')}
  >
    🚩 Signalements ({pendingReportsCount})
  </Button>

</div>

      <Row className="g-4">
        {activeTab === 'users' && (
        <Col xs={12}>
          <Card className="admin-section-card">
            <Card.Body>
              <Card.Title>Utilisateurs</Card.Title>
              <Form.Group className="mb-3">
  <Form.Control
    type="text"
    placeholder="🔍 Rechercher un étudiant..."
    value={searchUser}
    onChange={(e) => setSearchUser(e.target.value)}
  />
</Form.Group>
              {filteredStudents.length === 0 ? (
                <Alert variant="info" className="mb-0">Aucun etudiant trouve.</Alert>
              ) : (
                <Table responsive hover className="mb-0 align-middle">
                  <thead>
                    <tr>
                      <th>Nom</th>
                      <th>Courriel</th>
                      <th>Programme</th>
                      <th>Abonnement</th>
                      <th>Date d’inscription</th>
                      <th>Points</th>
                      <th>Niveau</th>
                      <th>Documents publies</th>
                      <th>Reponses forum</th>
                      <th>Compte</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student) => (
                      <tr key={student.id}>
                        <td>{`${student.first_name} ${student.last_name}`}</td>
                        <td>{student.email}</td>
                        <td>{student.programme || '-'}</td>
                        <td>
                          <Badge bg={student.subscriptionStatus === 'active' ? 'success' : 'secondary'}>
                            {student.subscriptionStatus === 'active' ? 'Actif' : 'Inactif'}
                          </Badge>
                        </td>
                        <td>{formatCreatedAt(student.createdAt)}</td>
                        <td>{student.points}</td>
                        <td>{student.level}</td>
                        <td>{student.publishedDocuments}</td>
                        <td>{student.forumRepliesCount}</td>
                        <td>
  <Button
    size="sm"
    variant={student.isDisabled ? 'success' : 'danger'}
    disabled={student.id === currentUser?.id}
    onClick={() => handleToggleUserStatus(student.id, student.isDisabled)}
  >
    {student.isDisabled ? 'Activer' : 'Désactiver'}
  </Button>
</td>
<td>
  <Button
  type="button"
  size="sm"
  variant="warning"
  className="me-2"
  disabled={student.id === currentUser?.id}
  onClick={() => openEditUserModal(student)}
>
  Modifier
</Button>

  <Button
    size="sm"
    variant={student.role === 'admin' ? 'secondary' : 'success'}
    disabled={student.id === currentUser?.id}
    className="me-2"
    onClick={() => handlePromoteAdmin(student.id)}
  >
    {student.role === 'admin' ? 'Retirer admin' : 'Promouvoir admin'}
  </Button>

  <Button
    size="sm"
    variant="danger"
    disabled={student.id === currentUser?.id}
    onClick={() => handleDeleteUser(student.id)}
  >
    Supprimer
  </Button>
</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
        )}
{activeTab === 'communications' && (
        <Col xs={12}>
          <Card className="admin-section-card">
            <Card.Body>
              <Card.Title>Communications</Card.Title>
              <p className="text-muted mb-3">
                Simulez l’envoi d’une annonce et enregistrez-la localement pour garder l’historique.
              </p>

              <Form onSubmit={handleSendCommunication} className="mb-4">
                <Row className="g-3">
                  <Col md={4}>
                    <Form.Label>Destinataires</Form.Label>
                    <div className="d-grid gap-2">
                      <Form.Check
                        type="radio"
                        id="communication-all"
                        name="communication-target"
                        label="Tous les étudiants"
                        checked={communicationTarget === 'all'}
                        onChange={() => setCommunicationTarget('all')}
                      />
                      <Form.Check
                        type="radio"
                        id="communication-programme"
                        name="communication-target"
                        label="Étudiants d’un programme précis"
                        checked={communicationTarget === 'programme'}
                        onChange={() => setCommunicationTarget('programme')}
                      />
                    </div>
                  </Col>

                  <Col md={8}>
                    <Form.Group className="mb-3">
                      <Form.Label>Sujet</Form.Label>
                      <Form.Control
                        value={communicationSubject}
                        onChange={(event) => setCommunicationSubject(event.target.value)}
                        placeholder="Sujet de la communication"
                      />
                    </Form.Group>

                    {communicationTarget === 'programme' && (
                      <Form.Group className="mb-3">
                        <Form.Label>Programme</Form.Label>
                        <Form.Select
                          value={communicationProgramme}
                          onChange={(event) => setCommunicationProgramme(event.target.value)}
                          disabled={programmeOptions.length === 0}
                        >
                          {programmeOptions.length === 0 ? (
                            <option value="">Aucun programme disponible</option>
                          ) : (
                            programmeOptions.map((programme) => (
                              <option key={programme} value={programme}>
                                {programme}
                              </option>
                            ))
                          )}
                        </Form.Select>
                      </Form.Group>
                    )}

                    <Form.Group>
                      <Form.Label>Message</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={5}
                        value={communicationMessage}
                        onChange={(event) => setCommunicationMessage(event.target.value)}
                        placeholder="Rédigez votre message ici"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mt-3">
                  <small className="text-muted">
                    Destinataires estimés : {communicationRecipients.length} étudiant(s)
                  </small>
                  <Button type="submit">Envoyer la communication</Button>
                </div>
              </Form>

              <Card className="admin-inner-card mb-0">
                <Card.Body>
                  <Card.Title className="h6">Historique des communications</Card.Title>
                  {communications.length === 0 ? (
                    <Alert variant="info" className="mb-0">
                      Aucune communication envoyée pour le moment.
                    </Alert>
                  ) : (
                    <Table responsive hover className="mb-0 align-middle">
                      <thead>
                        <tr>
                          <th>Sujet</th>
                          <th>Audience</th>
                          <th>Destinataires</th>
                          <th>Envoyée par</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {communications.map((communication) => (
                          <tr key={communication.id}>
                            <td>{communication.subject}</td>
                            <td>{communication.programme}</td>
                            <td>{communication.recipientCount}</td>
                            <td>{communication.sentBy}</td>
                            <td>{communication.sentAt ? new Date(communication.sentAt).toLocaleString() : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </Card.Body>
              </Card>
            </Card.Body>
          </Card>
        </Col>
        )}
{activeTab === 'users' && (
        <Col xs={12}>
          <Card className="admin-section-card">
            <Card.Body>
              <Card.Title>Non contributeurs</Card.Title>
              <p className="text-muted mb-3">
                Étudiants avec 0 document publié, 0 réponse forum et moins de 10 points.
              </p>

              {studentRows.filter((student) => student.publishedDocuments === 0 && student.forumRepliesCount === 0 && student.points < 10).length === 0 ? (
                <Alert variant="info" className="mb-0">
                  Aucun non contributeur trouvé.
                </Alert>
              ) : (
                <Table responsive hover className="mb-0 align-middle">
                  <thead>
                    <tr>
                      <th>Nom</th>
                      <th>Courriel</th>
                      <th>Programme</th>
                      <th>Points</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentRows
                      .filter((student) => student.publishedDocuments === 0 && student.forumRepliesCount === 0 && student.points < 10)
                      .map((student) => (
                        <tr key={student.id}>
                          <td>{`${student.first_name} ${student.last_name}`}</td>
                          <td>{student.email}</td>
                          <td>{student.programme || '-'}</td>
                          <td>{student.points}</td>
                          <td>
                            <Button size="sm" variant="outline-danger" onClick={() => handleDeleteStudent(student.id)}>
                              Supprimer le compte
                            </Button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
)}
{activeTab === 'documents' && (
        <Col xs={12}>
          <Card className="admin-section-card">
            <Card.Body>
              <Card.Title>Documents</Card.Title>
              {documents.length === 0 ? (
                <Alert variant="info" className="mb-0">Aucun document trouve.</Alert>
              ) : (
                <Table responsive hover className="mb-0 align-middle">
                  <thead>
                    <tr>
                      <th>Titre</th>
                      <th>Cours</th>
                      <th>Categorie</th>
                      <th>Auteur</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((doc) => (
                      <tr key={doc.id}>
                        <td>{doc.title}</td>
                        <td>{doc.course || '-'}</td>
                        <td>{doc.category === 'Général' ? 'Général' : 'Programme'}</td>
                        <td>{doc.author || '-'}</td>
                        <td>
                          <Button size="sm" variant="outline-danger" onClick={() => handleDeleteDocument(doc.id)}>
                            Supprimer
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
        )}
{activeTab === 'forum' && (
        <Col xs={12}>
          <Card className="admin-section-card">
            <Card.Body>
              <Card.Title>Forums</Card.Title>
              {forumQuestions.length === 0 ? (
                <Alert variant="info" className="mb-0">Aucune question publiee.</Alert>
              ) : (
                <div className="d-grid gap-3">
                  {forumQuestions.map((question) => (
                    <Card key={question.id} className="admin-inner-card">
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-start gap-2 flex-wrap">
                          <div>
                            <h5 className="mb-1">{question.title}</h5>
                            <p className="mb-1 text-muted">Programme: {question.programme}</p>
                            <p className="mb-1">{question.content}</p>
                            <small className="text-muted">Par {question.author || 'Etudiant'}</small>
                          </div>
                          <Button size="sm" variant="outline-danger" onClick={() => handleDeleteQuestion(question.id)}>
                            Supprimer la question
                          </Button>
                        </div>

                        {(question.answers || []).length > 0 && (
                          <div className="mt-3 d-grid gap-2">
                            {(question.answers || []).map((answer) => (
                              <div key={answer.id} className="admin-answer-item">
                                <div>
                                  <div>{answer.content}</div>
                                  <small className="text-muted">Reponse de {answer.author || 'Etudiant'}</small>
                                </div>
                                <Button size="sm" variant="outline-danger" onClick={() => handleDeleteAnswer(answer.id)}>
                                  Supprimer la reponse
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </Card.Body>
                    </Card>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
)}
{activeTab === 'reports' && (
        <Col xs={12}>
          <Card className="admin-section-card">
            <Card.Body>
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
                <Card.Title className="mb-0">Signalements</Card.Title>
                <ButtonGroup aria-label="Filtrer les signalements">
                  <Button variant={reportFilter === 'all' ? 'primary' : 'outline-primary'} onClick={() => setReportFilter('all')}>
                    Tous
                  </Button>
                  <Button variant={reportFilter === 'pending' ? 'primary' : 'outline-primary'} onClick={() => setReportFilter('pending')}>
                    En attente
                  </Button>
                  <Button variant={reportFilter === 'ignored' ? 'primary' : 'outline-primary'} onClick={() => setReportFilter('ignored')}>
                    Ignoré
                  </Button>
                  <Button variant={reportFilter === 'resolved' ? 'primary' : 'outline-primary'} onClick={() => setReportFilter('resolved')}>
                    Résolu
                  </Button>
                </ButtonGroup>
              </div>
              {visibleReports.length === 0 ? (
                <Alert variant="info" className="mb-0">Aucun contenu signale.</Alert>
              ) : (
                <Table responsive hover className="mb-0 align-middle">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>ID contenu</th>
                      <th>Raison</th>
                      <th>Description</th>
                      <th>Signale par</th>
                      <th>Date</th>
                      <th>Statut</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleReports.map((report) => (
                      <tr key={report.id}>
                        <td>{report.contentType || '-'}</td>
                        <td>{report.contentId ?? '-'}</td>
                        <td>{report.reason || '-'}</td>
                        <td>{report.description || '-'}</td>
                        <td>{report.reportedBy || '-'}</td>
                        <td>{report.date ? new Date(report.date).toLocaleString() : '-'}</td>
                        <td>
                          <Badge bg={report.status === 'pending' ? 'warning' : report.status === 'ignored' ? 'secondary' : 'success'}>
                            {report.status}
                          </Badge>
                        </td>
                        <td>
                          <div className="d-flex gap-2 flex-wrap">
                            <Button
  size="sm"
  variant="outline-primary"
  onClick={() => setSelectedReport(report)}
>
  👁 Voir
</Button>
                            <Button
                              size="sm"
                              variant="outline-secondary"
                              onClick={() => handleIgnoreReport(report.id)}
                              disabled={report.status !== 'pending'}
                            >
                              Ignorer
                            </Button>
                            <Button
                              size="sm"
                              variant="outline-danger"
                              onClick={() => handleDeleteReportedContent(report)}
                              disabled={report.status === 'resolved'}
                            >
                              Supprimer le contenu
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
        )}
      </Row>
      <Modal
  show={Boolean(selectedReport)}
  onHide={() => setSelectedReport(null)}
  centered
  size="lg"
>
  <Modal.Header closeButton>
    <Modal.Title>
      Détails du signalement
    </Modal.Title>
  </Modal.Header>

  <Modal.Body>
    {selectedReport && (
      <>
        <p className="mb-2">
          <strong>Type :</strong>{' '}
          {selectedReport.contentType === 'document'
            ? '📄 Document'
            : selectedReport.contentType === 'question'
              ? '💬 Question'
              : '↩️ Réponse'}
        </p>

        <p className="mb-2">
          <strong>Auteur du contenu :</strong>{' '}
          {selectedReport.contentAuthor || '-'}
        </p>

        <p className="mb-2">
          <strong>Signalé par :</strong>{' '}
          {selectedReport.reportedBy || '-'}
        </p>

        <p className="mb-2">
          <strong>Raison :</strong>{' '}
          {selectedReport.reason || '-'}
        </p>

        <p className="mb-3">
          <strong>Description du signalement :</strong>{' '}
          {selectedReport.description || '-'}
        </p>

        {selectedReport.contentTitle && (
          <p className="mb-2">
            <strong>Titre :</strong>{' '}
            {selectedReport.contentTitle}
          </p>
        )}
{selectedReport.contentType === 'document' &&
  selectedReport.documentFileUrl && (
    <div className="mb-3">
      <Button
        variant="outline-primary"
        onClick={() => {
  const backendBaseUrl = (
  import.meta.env.VITE_API_URL || 'http://localhost:5001/api'
).replace(/\/api\/?$/, '')

const fileUrl =
  selectedReport.documentFileUrl?.startsWith('http')
    ? selectedReport.documentFileUrl
    : `${backendBaseUrl}${selectedReport.documentFileUrl}`

  window.open(
    fileUrl,
    '_blank',
    'noopener,noreferrer'
  )
}}
      >
        📄 Ouvrir le document
      </Button>
    </div>
  )}
        <Card className="bg-light border-0">
          <Card.Body>
            <strong>Contenu signalé</strong>

            <div
              className="mt-2"
              style={{
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}
            >
              {selectedReport.contentText ||
                'Aucun texte disponible pour ce contenu.'}
            </div>
          </Card.Body>
        </Card>
      </>
    )}
  </Modal.Body>

  <Modal.Footer>
    <Button
      variant="secondary"
      onClick={() => setSelectedReport(null)}
    >
      Fermer
    </Button>

    {selectedReport?.status === 'pending' && (
      <Button
        variant="outline-secondary"
        onClick={async () => {
          await handleIgnoreReport(selectedReport.id)
          setSelectedReport(null)
        }}
      >
        Ignorer
      </Button>
    )}

    {selectedReport?.status !== 'resolved' && (
      <Button
        variant="danger"
        onClick={async () => {
          await handleDeleteReportedContent(selectedReport)
          setSelectedReport(null)
        }}
      >
        Supprimer le contenu
      </Button>
    )}
  </Modal.Footer>
</Modal>

      <Modal
  show={editUserModalOpen}
  onHide={closeEditUserModal}
  centered
>
 
  <Modal.Header closeButton>
    <Modal.Title>
      Modifier l’utilisateur
    </Modal.Title>
  </Modal.Header>

  <Form onSubmit={handleUpdateUser}>
    <Modal.Body>
      <Row className="g-3">
        <Col md={6}>
          <Form.Group>
            <Form.Label>
              Prénom
            </Form.Label>

            <Form.Control
              value={editFirstName}
              onChange={(event) =>
                setEditFirstName(
                  event.target.value
                )
              }
              required
            />
          </Form.Group>
        </Col>

        <Col md={6}>
          <Form.Group>
            <Form.Label>
              Nom
            </Form.Label>

            <Form.Control
              value={editLastName}
              onChange={(event) =>
                setEditLastName(
                  event.target.value
                )
              }
              required
            />
          </Form.Group>
        </Col>

        <Col xs={12}>
          <Form.Group>
            <Form.Label>
              Programme
            </Form.Label>

            <Form.Control
              value={editProgramme}
              onChange={(event) =>
                setEditProgramme(
                  event.target.value
                )
              }
              placeholder="Programme de l’étudiant"
            />
          </Form.Group>
        </Col>

        <Col xs={12}>
          <Form.Group>
            <Form.Label>
              Points
            </Form.Label>

            <Form.Control
              type="number"
              min="0"
              value={editPoints}
              onChange={(event) =>
                setEditPoints(
                  event.target.value
                )
              }
            />
          </Form.Group>
        </Col>
      </Row>
    </Modal.Body>

    <Modal.Footer>
      <Button
        type="button"
        variant="outline-secondary"
        onClick={closeEditUserModal}
      >
        Annuler
      </Button>

      <Button type="submit">
        Enregistrer
      </Button>
    </Modal.Footer>
  </Form>
</Modal>
    </Container>
  )
}