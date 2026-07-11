import React, { useMemo, useState } from 'react'
import { Container, Row, Col, Card, Form, Button, Alert, Modal } from 'react-bootstrap'
import { useAuth } from '../context/AuthContext.jsx'

const FORUMS_KEY = 'edudia_forums_by_programme'
const USERS_KEY = 'edudia_users'
const CURRENT_USER_KEY = 'edudia_current_user'
const REPORTS_KEY = 'edudia_reports'
const NOTIFICATIONS_KEY = 'edudia_notifications'
const NOTIFICATION_EVENT = 'edudia-notifications-updated'
const REPORT_REASONS = ['Contenu inapproprié', 'Plagiat', 'Mauvais document', 'Spam', 'Harcèlement', 'Autre']
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
  answers: Array.isArray(question.answers)
    ? question.answers.map((answer) => ({ ...answer, authorId: answer.authorId ?? null }))
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
  const programme = user?.programme || ''

  const [forumsByProgramme, setForumsByProgramme] = useState(() => getForumsStore())
  const [newQuestion, setNewQuestion] = useState('')
  const [replyValues, setReplyValues] = useState({})
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [reportTarget, setReportTarget] = useState(null)
  const [reportReason, setReportReason] = useState(REPORT_REASONS[0])
  const [reportDescription, setReportDescription] = useState('')
  const [notice, setNotice] = useState('')

  const questions = useMemo(() => {
    if (!programme) return []
    return forumsByProgramme[programme] || []
  }, [forumsByProgramme, programme])

  const persistForums = (nextStore) => {
    setForumsByProgramme(nextStore)
    window.localStorage.setItem(FORUMS_KEY, JSON.stringify(nextStore))
  }

  const handleAdd = (event) => {
    event.preventDefault()
    const text = newQuestion.trim()
    if (!text || !programme) return

    const newItem = normalizeQuestion({
      id: Date.now(),
      title: text,
      content: text,
      author: user?.nom || 'Étudiant',
      authorId: user?.id || null,
      programme,
      answers: []
    })

    const nextStore = {
      ...forumsByProgramme,
      [programme]: [newItem, ...(forumsByProgramme[programme] || [])]
    }

    persistForums(nextStore)
    setNewQuestion('')
  }

  const handleReplyChange = (questionId, value) => {
    setReplyValues((previous) => ({ ...previous, [questionId]: value }))
  }

  const handleReplySubmit = (event, questionId) => {
    event.preventDefault()
    const text = (replyValues[questionId] || '').trim()
    if (!text || !programme) return

    const nextQuestions = (forumsByProgramme[programme] || []).map((question) => {
      if (question.id !== questionId) return question
      return {
        ...question,
        answers: [
          ...(question.answers || []),
          {
            id: Date.now(),
            author: user?.nom || 'Étudiant',
            authorId: user?.id || null,
            content: text
          }
        ]
      }
    })

    const nextStore = {
      ...forumsByProgramme,
      [programme]: nextQuestions
    }

    persistForums(nextStore)
    if (user?.id) {
      awardReplyPoints(user.id, POINTS.forumReply)
    }

    const question = (forumsByProgramme[programme] || []).find((item) => item.id === questionId)
    if (question?.authorId && question.authorId !== user?.id) {
      queueNotifications([
        createNotification({
          id: `forum-reply-${questionId}-${Date.now()}-${question.authorId}`,
          userId: question.authorId,
          title: 'Nouvelle réponse à votre question',
          message: `${user?.nom || 'Un étudiant'} a répondu à « ${question.title} ».`,
          type: 'forum'
        })
      ])
    }

    setReplyValues((previous) => ({ ...previous, [questionId]: '' }))
    setNotice('Réponse envoyée. +5 points ajoutés.')
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

  const submitReport = (event) => {
    event.preventDefault()
    if (!reportTarget) return

    const existingReports = safeParse(window.localStorage.getItem(REPORTS_KEY), [])
    const reports = Array.isArray(existingReports) ? existingReports : []

    const report = {
      id: Date.now(),
      contentType: reportTarget.contentType,
      contentId: reportTarget.contentId,
      reason: reportReason,
      description: reportDescription.trim(),
      reportedBy: user?.nom || 'Étudiant',
      reportedById: user?.id || null,
      date: new Date().toISOString(),
      status: 'pending'
    }

    window.localStorage.setItem(REPORTS_KEY, JSON.stringify([report, ...reports]))
    setNotice('Signalement envoyé. Merci pour votre vigilance.')
    closeReportModal()
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
          {notice && <Alert variant="success">{notice}</Alert>}

          <Form className="my-3" onSubmit={handleAdd}>
            <Form.Control
              placeholder="Pose ta question"
              value={newQuestion}
              onChange={(event) => setNewQuestion(event.target.value)}
            />
            <Button type="submit" className="mt-2">Publier</Button>
          </Form>

          {questions.length === 0 && <Alert variant="info">Aucune question pour ce programme pour le moment.</Alert>}

          {questions.map((question) => (
            <Card key={question.id} className="mb-3 card-hover">
              <Card.Body>
                <Card.Title>{question.title}</Card.Title>
                <Card.Text>{question.content}</Card.Text>
                <small className="text-muted">Par {question.author}</small>
                <div className="mt-2">
                  <Button
                    size="sm"
                    variant="outline-danger"
                    onClick={() => openReportModal({ contentType: 'question', contentId: question.id })}
                  >
                    Signaler
                  </Button>
                </div>

                {question.answers && question.answers.length > 0 && (
                  <div className="mt-4">
                    <h6>Réponses</h6>
                    {question.answers.map((answer) => (
                      <Card key={answer.id} className="mb-2 bg-light">
                        <Card.Body className="py-2">
                          <Card.Text className="mb-1">{answer.content}</Card.Text>
                          <small className="text-muted">Réponse de {answer.author}</small>
                          <div className="mt-2">
                            <Button
                              size="sm"
                              variant="outline-danger"
                              onClick={() => openReportModal({ contentType: 'answer', contentId: answer.id })}
                            >
                              Signaler
                            </Button>
                          </div>
                        </Card.Body>
                      </Card>
                    ))}
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
