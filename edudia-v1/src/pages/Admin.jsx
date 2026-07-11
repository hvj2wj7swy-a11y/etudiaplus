import React, { useEffect, useMemo, useState } from 'react'
import { Alert, Badge, Button, ButtonGroup, Card, Col, Container, Form, Row, Table } from 'react-bootstrap'
import { useAuth } from '../context/AuthContext.jsx'
import './Admin.css'

const USERS_KEY = 'edudia_users'
const DOCUMENTS_KEY = 'edudia_documents'
const FORUMS_KEY = 'edudia_forums_by_programme'
const REPORTS_KEY = 'edudia_reports'
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

const normalizeReport = (report) => ({
  id: report.id || Date.now(),
  contentType: report.contentType || report.targetType || 'unknown',
  contentId: report.contentId ?? report.targetId,
  reason: report.reason || 'Non precisee',
  description: report.description || '',
  reportedBy: report.reportedBy || 'Etudiant',
  reportedById: report.reportedById || null,
  date: report.date || new Date().toISOString(),
  status: report.status || 'pending'
})

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

const saveReports = (reports) => {
  window.localStorage.setItem(REPORTS_KEY, JSON.stringify(reports))
}

const readReports = () => {
  const reports = safeParse(window.localStorage.getItem(REPORTS_KEY), [])
  const normalized = Array.isArray(reports) ? reports.map(normalizeReport) : []
  saveReports(normalized)
  return normalized
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
  const [users, setUsers] = useState(() => readUsers())
  const [documents, setDocuments] = useState(() => readDocuments())
  const [forumsByProgramme, setForumsByProgramme] = useState(() => readForums())
  const [reports, setReports] = useState(() => readReports())
  const [communications, setCommunications] = useState(() => readCommunications())
  const [reportFilter, setReportFilter] = useState('all')
  const [communicationTarget, setCommunicationTarget] = useState('all')
  const [communicationProgramme, setCommunicationProgramme] = useState('')
  const [communicationSubject, setCommunicationSubject] = useState('')
  const [communicationMessage, setCommunicationMessage] = useState('')
  const [notice, setNotice] = useState('')

  const students = useMemo(() => users.filter((user) => user.role !== 'admin'), [users])
  const totalUsers = users.length
  const totalStudents = users.filter((user) => user.role === 'student').length
  const totalAdmins = users.filter((user) => user.role === 'admin').length
  const activeSubscriptions = users.filter((user) => user.subscriptionStatus === 'active').length
  const inactiveSubscriptions = users.filter((user) => user.subscriptionStatus !== 'active').length

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

  const handleDeleteDocument = (docId) => {
    const nextDocs = documents.filter((doc) => doc.id !== docId)
    setDocuments(nextDocs)
    saveDocuments(nextDocs)

    const nextReports = reports.map((report) => {
      if (report.contentType === 'document' && report.contentId === docId) {
        return { ...report, status: 'resolved' }
      }
      return report
    })
    setReports(nextReports)
    saveReports(nextReports)
  }

  const handleDeleteQuestion = (questionId) => {
    const questionToDelete = forumQuestions.find((question) => question.id === questionId)
    const answerIds = (questionToDelete?.answers || []).map((answer) => answer.id)

    const nextForums = deleteQuestionById(forumsByProgramme, questionId)
    setForumsByProgramme(nextForums)
    saveForums(nextForums)

    const nextReports = reports.map((report) => {
      if (report.contentType === 'question' && report.contentId === questionId) {
        return { ...report, status: 'resolved' }
      }

      if (report.contentType === 'answer' && answerIds.includes(report.contentId)) {
        return { ...report, status: 'resolved' }
      }

      return report
    })

    setReports(nextReports)
    saveReports(nextReports)
  }

  const handleDeleteAnswer = (answerId) => {
    const nextForums = deleteAnswerById(forumsByProgramme, answerId)
    setForumsByProgramme(nextForums)
    saveForums(nextForums)

    const nextReports = reports.map((report) => {
      if (report.contentType === 'answer' && report.contentId === answerId) {
        return { ...report, status: 'resolved' }
      }
      return report
    })

    setReports(nextReports)
    saveReports(nextReports)
  }

  const handleIgnoreReport = (reportId) => {
    const reportToProcess = reports.find((report) => report.id === reportId)
    const nextReports = reports.map((report) => {
      if (report.id !== reportId) return report
      return { ...report, status: 'ignored' }
    })

    setReports(nextReports)
    saveReports(nextReports)

    if (reportToProcess?.reportedById) {
      queueNotifications([
        createNotification({
          id: `report-${reportToProcess.id}-ignored-${reportToProcess.reportedById}`,
          userId: reportToProcess.reportedById,
          title: 'Votre signalement a été traité',
          message: `Le signalement concernant ${reportToProcess.contentType} a été ignoré par l’administration.`,
          type: 'report'
        })
      ])
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

  const handleDeleteReportedContent = (report) => {
    if (report?.reportedById) {
      queueNotifications([
        createNotification({
          id: `report-${report.id}-resolved-${report.reportedById}`,
          userId: report.reportedById,
          title: 'Votre signalement a été traité',
          message: `Le contenu signalé (${report.contentType}) a été supprimé par l’administration.`,
          type: 'report'
        })
      ])
    }

    if (report.contentType === 'document') {
      handleDeleteDocument(report.contentId)
      return
    }

    if (report.contentType === 'question') {
      handleDeleteQuestion(report.contentId)
      return
    }

    if (report.contentType === 'answer') {
      handleDeleteAnswer(report.contentId)
      return
    }

    const nextReports = reports.map((item) => (item.id === report.id ? { ...item, status: 'resolved' } : item))
    setReports(nextReports)
    saveReports(nextReports)
  }

  return (
    <Container className="py-4 admin-page">
      <h1>Administration</h1>
      <p className="text-muted mb-4">Gerez les utilisateurs, les documents, les forums et les contenus signales.</p>

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

      {notice && (
        <Alert variant={notice.includes('succès') ? 'success' : 'danger'} onClose={() => setNotice('')} dismissible>
          {notice}
        </Alert>
      )}

      <Row className="g-4">
        <Col xs={12}>
          <Card className="admin-section-card">
            <Card.Body>
              <Card.Title>Utilisateurs</Card.Title>
              {studentRows.length === 0 ? (
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
                    {studentRows.map((student) => (
                      <tr key={student.id}>
                        <td>{student.nom}</td>
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
                          <Badge bg={student.isDisabled ? 'danger' : 'success'}>
                            {student.isDisabled ? 'Desactive' : 'Actif'}
                          </Badge>
                        </td>
                        <td>
                          <Button
                            size="sm"
                            variant={student.isDisabled ? 'outline-success' : 'outline-danger'}
                            onClick={() => handleToggleUser(student.id)}
                          >
                            {student.isDisabled ? 'Reactiver' : 'Desactiver'}
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
                          <td>{student.nom}</td>
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
      </Row>
    </Container>
  )
}
