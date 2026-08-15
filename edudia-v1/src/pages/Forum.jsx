import React, { useEffect, useMemo, useState } from 'react'
import { Container, Row, Col, Card, Form, Button, Alert, Modal } from 'react-bootstrap'
import { useAuth } from '../context/AuthContext.jsx'
import { forumAPI } from '../services/api'
import './Forum.css'

const FORUMS_KEY = 'edudia_forums_by_programme'
const USERS_KEY = 'edudia_users'
const CURRENT_USER_KEY = 'edudia_current_user'
const REPORTS_KEY = 'edudia_reports'
const NOTIFICATIONS_KEY = 'edudia_notifications'
const NOTIFICATION_EVENT = 'edudia-notifications-updated'
const REPORT_REASONS = ['Contenu inapproprié', 'Plagiat', 'Mauvais document', 'Spam', 'Harcèlement', 'Autre']
const FORUM_CATEGORIES = [
  'Question',
  'Travaux',
  'Examens',
  'Conseils',
  'Général'
]
const POINTS = {
  forumReply: 5
}

const LEVELS = [
  { name: 'Débutant', min: 0, max: 99 },
  { name: 'Contributeur', min: 100, max: 499 },
  { name: 'Expert', min: 500, max: 999 },
  { name: 'Ambassadeur', min: 1000, max: Number.POSITIVE_INFINITY }
]

const DEFAULT_FORUMS = {
  "Techniques de l'informatique": [
    {
      id: 1,
      title: 'Aide JavaScript',
      content: 'Quelqu\'un peut expliquer les promesses en JS ?',
      author: 'Étudiant Info',
      authorId: null,
      programme: "Techniques de l'informatique",
      answers: [{ id: 11, author: 'Tuteur Info', authorId: null, content: 'Regarde Promise.all et async/await.' }]
    }
  ],
  'Sciences humaines': [
    {
      id: 2,
      title: 'Méthodo dissertation',
      content: 'Des conseils pour structurer une dissertation ? ',
      author: 'Étudiant SH',
      authorId: null,
      programme: 'Sciences humaines',
      answers: [{ id: 22, author: 'Mentor SH', authorId: null, content: 'Commence avec plan dialectique clair.' }]
    }
  ],
  'Sciences de la nature': [],
  'Soins infirmiers': [],
  'Administration': [],
  'Arts, lettres et communication': []
}

const safeParse = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

const formatForumDate = (value) => {
  if (!value) return 'Date inconnue'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Date inconnue'
  }

  return date.toLocaleString('fr-CA', {
    dateStyle: 'medium',
    timeStyle: 'short'
  })
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

const getLevelFromPoints = (points) => {
  return LEVELS.find((level) => points >= level.min && points <= level.max) || LEVELS[0]
}

const buildBadges = (profile) => {
  const badges = []
  badges.push(getLevelFromPoints(profile.points).name)
  if ((profile.forumReplies || 0) >= 1) badges.push('Aidant')
  if ((profile.forumReplies || 0) >= 10) badges.push('Mentor')
  return [...new Set(badges)]
}

const normalizeUserRewards = (input) => {
  const points = Number(input?.points || 0)
  const forumReplies = Number(input?.forumReplies || 0)
  const level = getLevelFromPoints(points).name

  return {
    ...input,
    points,
    level,
    badges: Array.isArray(input?.badges) && input.badges.length > 0 ? input.badges : buildBadges({ points, forumReplies }),
    forumReplies
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

const awardReplyPoints = (userId, amount) => {
  if (!userId || !amount) return

  const users = getStoredUsers()
  const nextUsers = users.map((item) => {
    if (item.id !== userId) return item

    const nextProfile = {
      ...item,
      points: Number(item.points || 0) + amount,
      forumReplies: Number(item.forumReplies || 0) + 1
    }

    return normalizeUserRewards(nextProfile)
  })

  persistUsers(nextUsers)
  syncCurrentUser(nextUsers)
}

const normalizeQuestion = (question) => ({
  ...question,
  authorId: question.authorId ?? null,
  createdAt:
    question.createdAt ||
    new Date(
      Number(question.id) || Date.now()
    ).toISOString(),

  acceptedAnswerId:
  question.acceptedAnswerId ?? null,

  answers: Array.isArray(question.answers)
    ? question.answers.map((answer) => ({
        ...answer,
        authorId: answer.authorId ?? null,

        createdAt:
          answer.createdAt ||
          new Date(
            Number(answer.id) || Date.now()
          ).toISOString()
      }))
    : []
})

const getForumsStore = () => {
  const existing = safeParse(window.localStorage.getItem(FORUMS_KEY), null)
  if (existing) {
    return Object.fromEntries(
      Object.entries(existing).map(([programme, questions]) => [
        programme,
        Array.isArray(questions) ? questions.map(normalizeQuestion) : []
      ])
    )
  }
  window.localStorage.setItem(FORUMS_KEY, JSON.stringify(DEFAULT_FORUMS))
  return DEFAULT_FORUMS
}

export default function Forum() {
  const { user } = useAuth()
  const token = window.localStorage.getItem('edudia_auth_token')
  const programme = user?.programme || ''
  const [selectedForumProgram, setSelectedForumProgram] = useState(
  user?.role === 'admin'
    ? programme
    : programme
)

  const [forumsByProgramme, setForumsByProgramme] = useState({})
  const [newQuestion, setNewQuestion] = useState('')
  const [replyValues, setReplyValues] = useState({})
  const [newQuestionTitle, setNewQuestionTitle] = useState('')
  const [newQuestionCategory, setNewQuestionCategory] =
  useState('Question')
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [reportTarget, setReportTarget] = useState(null)
  const [reportReason, setReportReason] = useState(REPORT_REASONS[0])
  const [reportDescription, setReportDescription] = useState('')
  const [notice, setNotice] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
const [categoryFilter, setCategoryFilter] = useState('Toutes')
const [sortMode, setSortMode] = useState('recent')
const [editQuestionModalOpen, setEditQuestionModalOpen] =
  useState(false)

const [editingQuestion, setEditingQuestion] =
  useState(null)

const [editQuestionTitle, setEditQuestionTitle] =
  useState('')

const [editQuestionContent, setEditQuestionContent] =
  useState('')

const [editQuestionCategory, setEditQuestionCategory] =
  useState('Question')

  useEffect(() => {
  const loadForumQuestions = async () => {
    try {
      setNotice('')

      const response = await forumAPI.getQuestions(
  token,
  user?.role === 'admin'
    ? selectedForumProgram
    : programme
)
      const receivedQuestions = response.data?.questions || []

      const questionsWithAnswers = await Promise.all(
        receivedQuestions.map(async (question) => {
          const answersResponse = await forumAPI.getAnswers(question.id)
          const receivedAnswers = answersResponse.data?.answers || []

          return normalizeQuestion({
            id: question.id,
            title: question.title,
            content: question.content,
            category: question.category || 'Question',
            author:
              `${question.first_name || ''} ${question.last_name || ''}`.trim() ||
              'Étudiant',
            authorId: question.asked_by,
            programme:
  question.programme ||
  (
    user?.role === 'admin'
      ? selectedForumProgram
      : programme
  ),
            createdAt: question.created_at,
            acceptedAnswerId:
              receivedAnswers.find((answer) => answer.is_marked_solution)?.id ||
              null,
            answers: receivedAnswers.map((answer) => ({
              id: answer.id,
              author:
                `${answer.first_name || ''} ${answer.last_name || ''}`.trim() ||
                'Étudiant',
              authorId: answer.answered_by,
              content: answer.content,
              createdAt: answer.created_at,
              helpfulVotes: Number(answer.helpful_votes || 0)
            }))
          })
        })
      )

      const grouped = questionsWithAnswers.reduce((acc, question) => {
        const questionProgramme =
  question.programme ||
  (
    user?.role === 'admin'
      ? selectedForumProgram
      : programme
  )

        if (!acc[questionProgramme]) {
          acc[questionProgramme] = []
        }

        acc[questionProgramme].push(question)
        return acc
      }, {})

      setForumsByProgramme(grouped)
    } catch (error) {
      console.error('Erreur chargement forum :', error)
      setNotice(
        error.message ||
          'Impossible de charger les questions du forum.'
      )
    }
  }

  if (programme) {
    loadForumQuestions()
  }
}, [
  programme,
  selectedForumProgram,
  token,
  user?.role
])

  const questions = useMemo(() => {
  const currentProgram =
    user?.role === 'admin'
      ? selectedForumProgram
      : programme

  if (!currentProgram) return []

  let list = [
    ...(forumsByProgramme[currentProgram] || [])
  ]

    if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()

        list = list.filter(question =>
            question.title.toLowerCase().includes(q) ||
            question.content.toLowerCase().includes(q)
        )
    }

    if (categoryFilter !== 'Toutes') {
        list = list.filter(
            question =>
                (question.category || 'Question') === categoryFilter
        )
    }

    switch (sortMode) {
        case 'answers':
            list.sort(
                (a, b) =>
                    (b.answers?.length || 0) -
                    (a.answers?.length || 0)
            )
            break

        case 'alphabetical':
            list.sort((a, b) =>
                a.title.localeCompare(b.title)
            )
            break

        default:
            list.sort(
                (a, b) =>
                    new Date(b.createdAt) -
                    new Date(a.createdAt)
            )
    }

    return list
}, [
  forumsByProgramme,
  programme,
  selectedForumProgram,
  user?.role,
  searchQuery,
  categoryFilter,
  sortMode
])

  const persistForums = (nextStore) => {
    setForumsByProgramme(nextStore)
    window.localStorage.setItem(FORUMS_KEY, JSON.stringify(nextStore))
  }

const handleAcceptAnswer = async (questionId, answerId) => {
  if (!user?.id || !programme) return

  const question = (
    forumsByProgramme[programme] || []
  ).find((item) => item.id === questionId)

  if (!question || question.authorId !== user.id) {
    return
  }

  try {
    setNotice('')

    await forumAPI.markAsSolution(
      token,
      answerId
    )

    const selectedAnswer = question.answers?.find(
  answer => Number(answer.id) === Number(answerId)
)

if (
  selectedAnswer &&
  Number(selectedAnswer.authorId) !== Number(user.id)
) {
  queueNotifications([
    createNotification({
      id: `accepted-${answerId}-${Date.now()}`,
      userId: selectedAnswer.authorId,
      title: 'Meilleure réponse',
      message: `Votre réponse à "${question.title}" a été choisie comme meilleure réponse.`,
      type: 'forum'
    })
  ])
}

    const questionsResponse =
      await forumAPI.getQuestions(token)

    const receivedQuestions =
      questionsResponse.data?.questions || []

    const questionsWithAnswers =
      await Promise.all(
        receivedQuestions.map(async (currentQuestion) => {
          const answersResponse =
            await forumAPI.getAnswers(currentQuestion.id)

          const answers =
            answersResponse.data?.answers || []

          return normalizeQuestion({
            id: currentQuestion.id,
            title: currentQuestion.title,
            content: currentQuestion.content,
            category:
              currentQuestion.category || 'Question',
            author:
              `${currentQuestion.first_name || ''} ${
                currentQuestion.last_name || ''
              }`.trim() || 'Étudiant',
            authorId: currentQuestion.asked_by,
            programme,
            createdAt: currentQuestion.created_at,
            acceptedAnswerId:
              answers.find(
                (answer) => answer.is_marked_solution
              )?.id || null,
            answers: answers.map((answer) => ({
              id: answer.id,
              author:
                `${answer.first_name || ''} ${
                  answer.last_name || ''
                }`.trim() || 'Étudiant',
              authorId: answer.answered_by,
              content: answer.content,
              createdAt: answer.created_at,
              helpfulVotes: Number(
                answer.helpful_votes || 0
              )
            }))
          })
        })
      )

    setForumsByProgramme({
      [programme]: questionsWithAnswers
    })

    setNotice(
      'La réponse a été marquée comme meilleure réponse.'
    )
  } catch (error) {
    console.error(
      'Erreur meilleure réponse :',
      error
    )

    setNotice(
      error.message ||
        'Impossible de marquer cette réponse comme solution.'
    )
  }
}

const handleDeleteQuestion = async (questionId) => {
  if (!user?.id || !programme) return

  const questionToDelete =
    (forumsByProgramme[programme] || []).find(
      (question) => question.id === questionId
    )

  if (
    !questionToDelete ||
    questionToDelete.authorId !== user.id
  ) {
    return
  }

  const confirmed = window.confirm(
    'Supprimer définitivement cette question et toutes ses réponses ?'
  )

  if (!confirmed) return

  try {
    await forumAPI.deleteQuestion(token, questionId)

    const questionsResponse = await forumAPI.getQuestions(token)
    const receivedQuestions =
      questionsResponse.data?.questions || []

    const questionsWithAnswers = await Promise.all(
      receivedQuestions.map(async (question) => {
        const answersResponse =
          await forumAPI.getAnswers(question.id)

        const answers =
          answersResponse.data?.answers || []

        return normalizeQuestion({
          id: question.id,
          title: question.title,
          content: question.content,
          category: question.category,
          author:
            `${question.first_name || ''} ${question.last_name || ''}`.trim() ||
            'Étudiant',
          authorId: question.asked_by,
          programme,
          createdAt: question.created_at,
          acceptedAnswerId:
            answers.find((a) => a.is_marked_solution)?.id || null,
          answers: answers.map((answer) => ({
            id: answer.id,
            author:
              `${answer.first_name || ''} ${answer.last_name || ''}`.trim() ||
              'Étudiant',
            authorId: answer.answered_by,
            content: answer.content,
            createdAt: answer.created_at
          }))
        })
      })
    )

    setForumsByProgramme({
      [programme]: questionsWithAnswers
    })

    setNotice('La question a été supprimée.')
  } catch (error) {
    console.error(error)

    setNotice(
      error.message ||
      'Impossible de supprimer la question.'
    )
  }
}

const openEditQuestionModal = (question) => {
  if (!user?.id || question.authorId !== user.id) {
    return
  }

  setEditingQuestion(question)
  setEditQuestionTitle(question.title || '')
  setEditQuestionContent(question.content || '')
  setEditQuestionCategory(
    question.category || 'Question'
  )
  setEditQuestionModalOpen(true)
}

const closeEditQuestionModal = () => {
  setEditQuestionModalOpen(false)
  setEditingQuestion(null)
  setEditQuestionTitle('')
  setEditQuestionContent('')
  setEditQuestionCategory('Question')
}

const handleUpdateQuestion = async (event) => {
  event.preventDefault()

  const title = editQuestionTitle.trim()
  const content = editQuestionContent.trim()

  if (
    !editingQuestion ||
    !title ||
    !content ||
    !programme ||
    editingQuestion.authorId !== user?.id
  ) {
    return
  }

  try {
    await forumAPI.updateQuestion(
      token,
      editingQuestion.id,
      {
        title,
        content,
        category: editQuestionCategory
      }
    )

    const questionsResponse =
      await forumAPI.getQuestions(token)

    const receivedQuestions =
      questionsResponse.data?.questions || []

    const questionsWithAnswers =
      await Promise.all(
        receivedQuestions.map(async (question) => {
          const answersResponse =
            await forumAPI.getAnswers(question.id)

          const answers =
            answersResponse.data?.answers || []

          return normalizeQuestion({
            id: question.id,
            title: question.title,
            content: question.content,
            category: question.category,
            author:
              `${question.first_name || ''} ${question.last_name || ''}`.trim() ||
              'Étudiant',
            authorId: question.asked_by,
            programme,
            createdAt: question.created_at,
            acceptedAnswerId:
              answers.find(a => a.is_marked_solution)?.id || null,
            answers: answers.map(answer => ({
              id: answer.id,
              author:
                `${answer.first_name || ''} ${answer.last_name || ''}`.trim() ||
                'Étudiant',
              authorId: answer.answered_by,
              content: answer.content,
              createdAt: answer.created_at,
              helpfulVotes: Number(answer.helpful_votes || 0)
            }))
          })
        })
      )

    setForumsByProgramme({
      [programme]: questionsWithAnswers
    })

    closeEditQuestionModal()
    setNotice('Question modifiée.')
  } catch (error) {
    console.error(error)

    setNotice(
      error.message ||
      'Impossible de modifier la question.'
    )
  }
}

  const handleAdd = async (event) => {
  event.preventDefault()

  const title = newQuestionTitle.trim()
  const content = newQuestion.trim()

  if (!title || !content || !programme) return

  try {
    setNotice('')

    await forumAPI.createQuestion(token, {
      title,
      content,
      category: newQuestionCategory
    })

    const response = await forumAPI.getQuestions(token)
    const receivedQuestions = response.data?.questions || []

    setForumsByProgramme({
      [programme]: receivedQuestions.map((question) =>
        normalizeQuestion({
          id: question.id,
          title: question.title,
          content: question.content,
          category: question.category || 'Question',
          author:
            `${question.first_name || ''} ${question.last_name || ''}`.trim() ||
            'Étudiant',
          authorId: question.asked_by,
          programme,
          createdAt: question.created_at,
          acceptedAnswerId: null,
          answers: []
        })
      )
    })

    setNewQuestion('')
    setNewQuestionTitle('')
    setNewQuestionCategory('Question')
    setNotice('Question publiée avec succès.')
  } catch (error) {
    console.error(error)
    setNotice(error.message || 'Impossible de publier la question.')
  }
}

  const handleReplyChange = (questionId, value) => {
    setReplyValues((previous) => ({ ...previous, [questionId]: value }))
  }

  const handleReplySubmit = async (event, questionId) => {
  event.preventDefault()

  const text = (replyValues[questionId] || '').trim()

  if (!text) return

  try {
    await forumAPI.createAnswer(
      token,
      questionId,
      text
    )
const question = (forumsByProgramme[programme] || []).find(
  (q) => q.id === questionId
)

if (
  question &&
  Number(question.authorId) !== Number(user.id)
) {
  queueNotifications([
    createNotification({
      id: `reply-${Date.now()}`,
      userId: question.authorId,
      title: 'Nouvelle réponse',
      message: `${user.firstName || user.first_name || 'Un étudiant'} a répondu à votre question "${question.title}".`,
      type: 'forum'
    })
  ])
}

    const questionsResponse =
      await forumAPI.getQuestions(token)

    const receivedQuestions =
      questionsResponse.data?.questions || []

    const questionsWithAnswers =
      await Promise.all(
        receivedQuestions.map(async (question) => {
          const answersResponse =
            await forumAPI.getAnswers(question.id)

          const answers =
            answersResponse.data?.answers || []

          return normalizeQuestion({
            id: question.id,
            title: question.title,
            content: question.content,
            category: question.category,
            author:
              `${question.first_name || ''} ${question.last_name || ''}`.trim() ||
              'Étudiant',
            authorId: question.asked_by,
            programme,
            createdAt: question.created_at,
            acceptedAnswerId:
              answers.find(
                (answer) => answer.is_marked_solution
              )?.id || null,
            answers: answers.map((answer) => ({
              id: answer.id,
              author:
                `${answer.first_name || ''} ${answer.last_name || ''}`.trim() ||
                'Étudiant',
              authorId: answer.answered_by,
              content: answer.content,
              createdAt: answer.created_at
            }))
          })
        })
      )

    setForumsByProgramme({
      [programme]: questionsWithAnswers
    })

    setReplyValues((previous) => ({
      ...previous,
      [questionId]: ''
    }))

    setNotice('Réponse publiée.')
  } catch (error) {
    console.error(error)

    setNotice(
      error.message ||
        'Impossible de publier la réponse.'
    )
  }
}

const handleVoteAnswer = async (answerId, voteType) => {
  try {
    setNotice('')

    await forumAPI.voteAnswer(
      token,
      answerId,
      voteType
    )

    if (voteType === 'up') {
  const question = (
    forumsByProgramme[programme] || []
  ).find((q) =>
    (q.answers || []).some(
      (a) => Number(a.id) === Number(answerId)
    )
  )

  const answer = question?.answers?.find(
    (a) => Number(a.id) === Number(answerId)
  )

  if (
    answer &&
    Number(answer.authorId) !== Number(user.id)
  ) {
    queueNotifications([
      createNotification({
        id: `vote-${answer.id}-${Date.now()}`,
        userId: answer.authorId,
        title: 'Votre réponse est appréciée',
        message: `${
          user.firstName ||
          user.first_name ||
          'Un étudiant'
        } a trouvé votre réponse utile.`,
        type: 'forum'
      })
    ])
  }
}

    const questionsResponse =
      await forumAPI.getQuestions(token)

    const receivedQuestions =
      questionsResponse.data?.questions || []

    const questionsWithAnswers =
      await Promise.all(
        receivedQuestions.map(async (question) => {
          const answersResponse =
            await forumAPI.getAnswers(question.id)

          const answers =
            answersResponse.data?.answers || []

          return normalizeQuestion({
            id: question.id,
            title: question.title,
            content: question.content,
            category: question.category,
            author:
              `${question.first_name || ''} ${question.last_name || ''}`.trim() ||
              'Étudiant',
            authorId: question.asked_by,
            programme,
            createdAt: question.created_at,
            acceptedAnswerId:
              answers.find(
                (answer) => answer.is_marked_solution
              )?.id || null,
            answers: answers.map((answer) => ({
              id: answer.id,
              author:
                `${answer.first_name || ''} ${answer.last_name || ''}`.trim() ||
                'Étudiant',
              authorId: answer.answered_by,
              content: answer.content,
              createdAt: answer.created_at,
              helpfulVotes: Number(
                answer.helpful_votes || 0
              )
            }))
          })
        })
      )

    setForumsByProgramme({
      [programme]: questionsWithAnswers
    })

    setNotice(
      voteType === 'up'
        ? 'Vote utile enregistré.'
        : 'Vote négatif enregistré.'
    )
  } catch (error) {
    console.error('Erreur vote forum :', error)

    setNotice(
      error.message ||
        'Impossible d’enregistrer le vote.'
    )
  }
}

const handleDeleteAnswer = async (answerId) => {
  if (!user?.id || !programme) return

  const confirmed = window.confirm(
    'Voulez-vous vraiment supprimer cette réponse ?'
  )

  if (!confirmed) return

  try {
    setNotice('')

    await forumAPI.deleteAnswer(token, answerId)

    setForumsByProgramme((previous) => ({
      ...previous,
      [programme]: (previous[programme] || []).map((question) => ({
        ...question,
        answers: (question.answers || []).filter(
          (answer) => answer.id !== answerId
        )
      }))
    }))

    setNotice('Réponse supprimée avec succès.')
  } catch (error) {
    console.error(error)

    setNotice(
      error.message ||
        'Impossible de supprimer la réponse.'
    )
  }
}

  const openReportModal = (target) => {
    setReportTarget(target)
    setReportReason(REPORT_REASONS[0])
    setReportDescription('')
    setReportModalOpen(true)
  }

  const closeReportModal = () => {
    setReportModalOpen(false)
    setReportTarget(null)
    setReportReason(REPORT_REASONS[0])
    setReportDescription('')
  }

  const submitReport = async (event) => {
  event.preventDefault()

  if (!reportTarget) return

  try {
    setNotice('')

    await forumAPI.reportContent(token, {
      contentType: reportTarget.contentType,
      contentId: reportTarget.contentId,
      reason: reportReason,
      description: reportDescription
    })

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
        id: `forum-report-${reportTarget.contentType}-${reportTarget.contentId}-${Date.now()}-${adminUser.id}`,
        userId: adminUser.id,
        title: 'Nouveau signalement au forum',
        message: `${
          user?.nom ||
          user?.firstName ||
          user?.first_name ||
          'Un étudiant'
        } a signalé une ${
          reportTarget.contentType === 'question'
            ? 'question'
            : 'réponse'
        } pour la raison : ${reportReason}.`,
        type: 'report'
      })
    )
)

    setNotice('Signalement envoyé avec succès.')
    closeReportModal()
  } catch (error) {
    console.error(error)

    setNotice(
      error.message ||
      'Impossible d’envoyer le signalement.'
    )
  }
}

  if (!programme) {
    return (
      <Container className="py-4 forum-page">
        <Alert variant="warning">Programme non défini. Complète ton inscription pour accéder au forum de ton programme.</Alert>
      </Container>
    )
  }

  return (
    <Container className="py-4 forum-page">
      <Row>
        <Col lg={8}>
          <h1>Forum - {programme}</h1>

{user?.role === 'admin' && (
  <Form.Select
    className="mb-3"
    value={selectedForumProgram}
    onChange={(e) => setSelectedForumProgram(e.target.value)}
  >
    <option value="Techniques de l'informatique">
      Techniques de l'informatique
    </option>

    <option value="Sciences humaines">
      Sciences humaines
    </option>

    <option value="Sciences de la nature">
      Sciences de la nature
    </option>

    <option value="Soins infirmiers">
      Soins infirmiers
    </option>

    <option value="Administration">
      Administration
    </option>

    <option value="Arts, lettres et communication">
      Arts, lettres et communication
    </option>
  </Form.Select>
)}
          {notice && <Alert variant="success">{notice}</Alert>}

<Card className="mb-3 border-0 shadow-sm forum-filters-card">
  <Card.Body>
    <Row className="g-2">
      <Col md={5}>
        <Form.Control
          type="text"
          placeholder="🔍 Rechercher une question..."
          value={searchQuery}
          onChange={(event) =>
            setSearchQuery(event.target.value)
          }
        />
      </Col>

      <Col md={3}>
        <Form.Select
          value={categoryFilter}
          onChange={(event) =>
            setCategoryFilter(event.target.value)
          }
        >
          <option value="Toutes">
            Toutes les catégories
          </option>

          {FORUM_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </Form.Select>
      </Col>

      <Col md={4}>
        <Form.Select
          value={sortMode}
          onChange={(event) =>
            setSortMode(event.target.value)
          }
        >
          <option value="recent">
            Plus récentes
          </option>

          <option value="answers">
            Plus de réponses
          </option>

          <option value="alphabetical">
            Ordre alphabétique
          </option>
        </Form.Select>
      </Col>
    </Row>
  </Card.Body>
</Card>

          <Card className="mb-4 shadow-sm border-0">
  <Card.Body>

    <h5 className="mb-3">
      ✍️ Nouvelle question
    </h5>

    <Form onSubmit={handleAdd}>

      <Form.Control
        className="mb-3"
        placeholder="Titre de la question"
        value={newQuestionTitle}
        onChange={(event) =>
          setNewQuestionTitle(event.target.value)
        }
      />

<Form.Select
  className="mb-3"
  value={newQuestionCategory}
  onChange={(event) =>
    setNewQuestionCategory(event.target.value)
  }
  aria-label="Catégorie de la publication"
>
  {FORUM_CATEGORIES.map((category) => (
    <option key={category} value={category}>
      {category}
    </option>
  ))}
</Form.Select>

      <Form.Control
        as="textarea"
        rows={4}
        className="mb-3"
        placeholder="Décris ton problème..."
        value={newQuestion}
        onChange={(event) =>
          setNewQuestion(event.target.value)
        }
      />

      <div className="d-flex justify-content-end">
        <Button type="submit">
          Publier la question
        </Button>
      </div>

    </Form>

  </Card.Body>
</Card>

          {questions.length === 0 && <Alert variant="info">Aucune question pour ce programme pour le moment.</Alert>}

          {questions.map((question) => (
            <Card
  key={question.id}
  className="mb-3 border-0 shadow-sm forum-question-card"
>
  <Card.Body>

    <div className="d-flex justify-content-between align-items-start mb-3">

      <div className="d-flex align-items-center gap-3">

        <div className="forum-question-avatar">
          {String(question.author || 'E')
            .trim()
            .charAt(0)
            .toUpperCase()}
        </div>

        <div>

          <div className="fw-bold">
            {question.author}
          </div>

          <small className="text-muted">
            {programme}
            {' • '}
            {formatForumDate(question.createdAt)}
          </small>

        </div>

      </div>

      <div className="d-flex align-items-center gap-2">
  {question.authorId === user?.id && (
  <>
    <Button
      type="button"
      size="sm"
      variant="outline-primary"
      className="forum-question-edit-button"
      onClick={() =>
        openEditQuestionModal(question)
      }
      title="Modifier cette question"
      aria-label="Modifier cette question"
    >
      ✏️
    </Button>

    <Button
      type="button"
      size="sm"
      variant="outline-danger"
      className="forum-question-delete-button"
      onClick={() =>
        handleDeleteQuestion(question.id)
      }
      title="Supprimer cette question"
      aria-label="Supprimer cette question"
    >
      🗑️
    </Button>
  </>
)}

  <Button
    type="button"
    size="sm"
    variant="outline-danger"
    className="forum-question-report-button"
    onClick={() =>
      openReportModal({
        contentType: 'question',
        contentId: question.id
      })
    }
    title="Signaler cette question"
    aria-label="Signaler cette question"
  >
    🚩
  </Button>
</div>

    </div>

<div className="mb-2">
  <span
  className={`forum-question-category forum-category-${(
    question.category || 'Question'
  )
    .toLowerCase()
    .replace(/\s+/g, '-')}`}
>
  {question.category || 'Question'}
</span>
</div>

{question.acceptedAnswerId && (
  <div className="mb-2">
    <span className="forum-question-resolved-badge">
      ✅ Résolu
    </span>
  </div>
)}

    <h4 className="forum-question-title">
      {question.title}
    </h4>

    <p className="forum-question-content">
      {question.content}
    </p>

    <div className="text-muted small mb-3">
  💬 {question.answers?.length || 0}{' '}
  réponse
  {(question.answers?.length || 0) !== 1
    ? 's'
    : ''}
</div>

                {question.answers && question.answers.length > 0 && (
  <div className="forum-answers-section mt-4">
    <div className="forum-answers-title">
      <span>Réponses</span>

      <span className="forum-answers-count">
        {question.answers.length}
      </span>
    </div>

    <div className="d-grid gap-3">
      {[...(question.answers || [])]
  .sort((left, right) => {
    if (
      left.id === question.acceptedAnswerId
    ) {
      return -1
    }

    if (
      right.id === question.acceptedAnswerId
    ) {
      return 1
    }

    return (
      new Date(left.createdAt || 0) -
      new Date(right.createdAt || 0)
    )
  })
  .map((answer) => (
        <div
  key={answer.id}
  className={`forum-answer-card ${
    question.acceptedAnswerId === answer.id
      ? 'is-accepted'
      : ''
  }`}
>
  {question.acceptedAnswerId ===
  answer.id && (
  <div className="forum-accepted-answer-badge">
    ✅ Meilleure réponse
  </div>
)}

          <div className="forum-answer-header">
            <div className="d-flex align-items-center gap-2">
              <div className="forum-answer-avatar">
                {String(answer.author || 'E')
                  .trim()
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div>
                <div className="forum-answer-author">
                  {answer.author || 'Étudiant'}
                </div>

                <div className="forum-answer-date">
                  {formatForumDate(answer.createdAt)}
                </div>
              </div>
            </div>

            <div className="d-flex align-items-center gap-2">
    {question.authorId === user?.id && (
        <Button
            type="button"
            size="sm"
            variant={
                question.acceptedAnswerId === answer.id
                    ? 'success'
                    : 'outline-success'
            }
            className="forum-accept-answer-button"
            onClick={() =>
                handleAcceptAnswer(
                    question.id,
                    answer.id
                )
            }
            title={
                question.acceptedAnswerId === answer.id
                    ? 'Retirer comme meilleure réponse'
                    : 'Choisir comme meilleure réponse'
            }
        >
            {question.acceptedAnswerId === answer.id
                ? '✅'
                : '☆'}
        </Button>
    )}

{(
  Number(answer.authorId) === Number(user?.id) ||
  user?.role === 'admin'
) && (
  <Button
    type="button"
    size="sm"
    variant="outline-danger"
    onClick={() => handleDeleteAnswer(answer.id)}
    title="Supprimer cette réponse"
    aria-label="Supprimer cette réponse"
  >
    🗑️
  </Button>
)}

    <Button
        size="sm"
        variant="outline-danger"
        className="forum-answer-report-button"
        onClick={() =>
            openReportModal({
                contentType: 'answer',
                contentId: answer.id
            })
        }
        title="Signaler cette réponse"
        aria-label="Signaler cette réponse"
    >
        🚩
    </Button>
</div>
          </div>

          <div className="forum-answer-content">
            {answer.content}
          </div>
          <div className="d-flex align-items-center gap-2 mt-2">
  <Button
    type="button"
    size="sm"
    variant="outline-success"
    onClick={() =>
      handleVoteAnswer(answer.id, 'up')
    }
  >
    👍 Utile
  </Button>

  <Button
    type="button"
    size="sm"
    variant="outline-danger"
    onClick={() =>
      handleVoteAnswer(answer.id, 'down')
    }
  >
    👎
  </Button>

  <small className="text-muted">
    {Number(answer.helpfulVotes || 0)} vote(s) utile(s)
  </small>
</div>
        </div>
      ))}
    </div>
  </div>
)}

                <Form className="mt-3" onSubmit={(event) => handleReplySubmit(event, question.id)}>
                  <Form.Group>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      placeholder="Répondre à cette question"
                      value={replyValues[question.id] || ''}
                      onChange={(event) => handleReplyChange(question.id, event.target.value)}
                    />
                  </Form.Group>
                  <Button type="submit" size="sm" className="mt-2">Envoyer réponse</Button>
                </Form>
              </Card.Body>
            </Card>
          ))}
        </Col>

        <Col lg={4}>
          <Card className="p-3 card-hover">
            <h5>Forum de programme</h5>
            <p className="mb-0">Tu vois uniquement les questions et réponses de ton programme d'étude.</p>
          </Card>
        </Col>
      </Row>
<Modal
  show={editQuestionModalOpen}
  onHide={closeEditQuestionModal}
  centered
>
  <Modal.Header closeButton>
    <Modal.Title>
      Modifier la question
    </Modal.Title>
  </Modal.Header>

  <Form onSubmit={handleUpdateQuestion}>
    <Modal.Body>
      <Form.Group className="mb-3">
        <Form.Label>Titre</Form.Label>

        <Form.Control
          value={editQuestionTitle}
          onChange={(event) =>
            setEditQuestionTitle(
              event.target.value
            )
          }
          placeholder="Titre de la question"
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Catégorie</Form.Label>

        <Form.Select
          value={editQuestionCategory}
          onChange={(event) =>
            setEditQuestionCategory(
              event.target.value
            )
          }
        >
          {FORUM_CATEGORIES.map((category) => (
            <option
              key={category}
              value={category}
            >
              {category}
            </option>
          ))}
        </Form.Select>
      </Form.Group>

      <Form.Group>
        <Form.Label>Description</Form.Label>

        <Form.Control
          as="textarea"
          rows={5}
          value={editQuestionContent}
          onChange={(event) =>
            setEditQuestionContent(
              event.target.value
            )
          }
          placeholder="Description de la question"
        />
      </Form.Group>
    </Modal.Body>

    <Modal.Footer>
      <Button
        type="button"
        variant="outline-secondary"
        onClick={closeEditQuestionModal}
      >
        Annuler
      </Button>

      <Button type="submit">
        Enregistrer
      </Button>
    </Modal.Footer>
  </Form>
</Modal>
      <Modal show={reportModalOpen} onHide={closeReportModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Signaler un contenu</Modal.Title>
        </Modal.Header>
        <Form onSubmit={submitReport}>
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
                placeholder="Explique brièvement le problème observé..."
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
