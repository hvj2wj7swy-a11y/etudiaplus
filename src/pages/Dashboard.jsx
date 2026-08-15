import React, { useEffect, useMemo, useState } from 'react'
import { Container, Row, Col, Card, Spinner, Alert } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { agendaAPI } from '../services/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import './Dashboard.css'

const toDateKey = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

const addDays = (date, amount) => {
  const result = new Date(date)
  result.setDate(result.getDate() + amount)
  return result
}

const normalizeAgendaEvent = (event) => ({
  id: event.id,
  title: event.title,
  type: event.type,
  date: String(event.event_date).slice(0, 10),
  startTime: String(event.start_time).slice(0, 5),
  endTime: String(event.end_time).slice(0, 5),
  course: event.course || '',
  room: event.room || '',
  description: event.description || '',
  color: event.color || null,
  priority: event.priority || 'normal',
  status: event.status || 'todo'
})

const formatDate = (dateKey) => {
  const [year, month, day] = dateKey.split('-').map(Number)

  return new Intl.DateTimeFormat('fr-CA', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  }).format(new Date(year, month - 1, day))
}

export default function Dashboard() {
  const { user } = useAuth()

  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const token = localStorage.getItem('edudia_auth_token')

  useEffect(() => {
    const loadDashboard = async () => {
      if (!token) {
        setEvents([])
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError('')

        const response = await agendaAPI.list(token)
        const rawEvents = response?.data?.events || []

        setEvents(rawEvents.map(normalizeAgendaEvent))
      } catch (err) {
        console.error('Erreur chargement tableau de bord:', err)

        setError(
          err.message ||
            'Impossible de charger les informations du tableau de bord.'
        )
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [token, user?.id])

  const dashboardData = useMemo(() => {
    const now = new Date()
    const todayKey = toDateKey(now)
    const weekEndKey = toDateKey(addDays(now, 7))

    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`

    const activeEvents = events.filter(
      (event) =>
        event.status !== 'completed' &&
        event.status !== 'cancelled'
    )

    const todayEvents = activeEvents
      .filter((event) => event.date === todayKey)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))

    const nextCourse =
      activeEvents
        .filter((event) => {
          if (event.type !== 'cours') return false

          if (event.date > todayKey) {
            return true
          }

          return (
            event.date === todayKey &&
            event.endTime >= currentTime
          )
        })
        .sort((a, b) => {
          if (a.date !== b.date) {
            return a.date.localeCompare(b.date)
          }

          return a.startTime.localeCompare(b.startTime)
        })[0] || null

    const upcomingHomework = activeEvents
      .filter(
        (event) =>
          event.type === 'devoir' &&
          event.date >= todayKey
      )
      .sort((a, b) => {
        if (a.date !== b.date) {
          return a.date.localeCompare(b.date)
        }

        return a.startTime.localeCompare(b.startTime)
      })

    const upcomingExams = activeEvents
      .filter(
        (event) =>
          event.type === 'examen' &&
          event.date >= todayKey
      )
      .sort((a, b) => {
        if (a.date !== b.date) {
          return a.date.localeCompare(b.date)
        }

        return a.startTime.localeCompare(b.startTime)
      })

    const weekEvents = activeEvents.filter(
      (event) =>
        event.date >= todayKey &&
        event.date <= weekEndKey
    )
const weekSummary = {
  courses: weekEvents.filter((event) => event.type === 'cours').length,
  homework: weekEvents.filter((event) => event.type === 'devoir').length,
  exams: weekEvents.filter((event) => event.type === 'examen').length
}

    return {
  todayEvents,
  nextCourse,
  upcomingHomework,
  upcomingExams,
  weekEvents,
  weekSummary
}
  }, [events])

  const displayName =
    user?.firstName ||
    user?.firstname ||
    user?.name ||
    user?.email?.split('@')[0] ||
    ''

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" />
        <p className="text-muted mt-3">
          Chargement de ton tableau de bord...
        </p>
      </Container>
    )
  }

  return (
    <Container className="py-4 dashboard-page">
      <div className="dashboard-welcome mb-4">
        <h1 className="mb-1">
          {displayName
            ? `Bonjour, ${displayName} 👋`
            : 'Bonjour 👋'}
        </h1>

        <p className="text-muted mb-0">
          Voici ce qui t’attend aujourd’hui.
        </p>
      </div>

      {error && (
        <Alert variant="warning">
          {error}
        </Alert>
      )}

      <Row className="g-3 mb-4">
        <Col md={6} xl={3}>
          <Card className="h-100 dashboard-summary-card">
            <Card.Body>
              <div className="dashboard-summary-icon">📚</div>
              <Card.Title>Prochain cours</Card.Title>

              {dashboardData.nextCourse ? (
                <>
                  <strong>
                    {dashboardData.nextCourse.title}
                  </strong>

                  <div className="text-muted small mt-2">
                    {formatDate(
                      dashboardData.nextCourse.date
                    )}
                    {' · '}
                    {dashboardData.nextCourse.startTime}
                    {' - '}
                    {dashboardData.nextCourse.endTime}
                  </div>

                  {dashboardData.nextCourse.room && (
                    <div className="small mt-1">
                      📍 {dashboardData.nextCourse.room}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-muted mb-0">
                  Aucun cours à venir.
                </p>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={6} xl={3}>
          <Card className="h-100 dashboard-summary-card">
            <Card.Body>
              <div className="dashboard-summary-icon">📝</div>
              <Card.Title>Travaux à remettre</Card.Title>

              <div className="dashboard-big-number">
                {dashboardData.upcomingHomework.length}
              </div>

              {dashboardData.upcomingHomework[0] ? (
                <div className="text-muted small">
                  Prochain :{' '}
                  {
                    dashboardData.upcomingHomework[0]
                      .title
                  }
                </div>
              ) : (
                <div className="text-muted small">
                  Aucun travail à venir.
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={6} xl={3}>
          <Card className="h-100 dashboard-summary-card">
            <Card.Body>
              <div className="dashboard-summary-icon">🎓</div>
              <Card.Title>Examens à venir</Card.Title>

              <div className="dashboard-big-number">
                {dashboardData.upcomingExams.length}
              </div>

              {dashboardData.upcomingExams[0] ? (
                <div className="text-muted small">
                  Prochain :{' '}
                  {dashboardData.upcomingExams[0].title}
                </div>
              ) : (
                <div className="text-muted small">
                  Aucun examen à venir.
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={6} xl={3}>
          <Card className="h-100 dashboard-summary-card">
            <Card.Body>
              <div className="dashboard-summary-icon">📆</div>
              <Card.Title>Cette semaine</Card.Title>

              <div className="dashboard-week-summary">
  <div>
    <strong>{dashboardData.weekSummary.courses}</strong>
    <span> cours</span>
  </div>

  <div>
    <strong>{dashboardData.weekSummary.homework}</strong>
    <span> travaux</span>
  </div>

  <div>
    <strong>{dashboardData.weekSummary.exams}</strong>
    <span> examens</span>
  </div>
</div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="dashboard-today-card mb-4">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <Card.Title className="mb-0">
              Aujourd’hui
            </Card.Title>

            <Link
              to="/agenda"
              className="text-decoration-none small"
            >
              Voir l’agenda →
            </Link>
          </div>

          {dashboardData.todayEvents.length === 0 ? (
            <p className="text-muted mb-0">
              Aucun événement prévu aujourd’hui.
            </p>
          ) : (
            <div className="dashboard-today-list">
              {dashboardData.todayEvents.map((event) => (
                <div
                  key={event.id}
                  className="dashboard-today-event"
                >
                  <div className="dashboard-today-time">
                    {event.startTime}
                  </div>

                  <div>
                    <strong>{event.title}</strong>

                    <div className="text-muted small">
                      {event.course || event.type}

                      {event.room
                        ? ` · 📍 ${event.room}`
                        : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card.Body>
      </Card>

      <h2 className="dashboard-tools-title mb-3">
        Mes outils
      </h2>

      <Row className="g-4">
        <Col md={6} lg={3} className="d-flex">
          <Card
            as={Link}
            to="/notes"
            className="h-100 w-100 dashboard-link-card text-decoration-none"
          >
            <Card.Body className="d-flex flex-column justify-content-center">
              <Card.Title className="mb-2">
                Notes
              </Card.Title>

              <Card.Text className="mb-0">
                Ouvrez votre cahier numérique,
                organisez vos cours et annotez chaque
                page.
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6} lg={3} className="d-flex">
          <Card
            as={Link}
            to="/documents"
            className="h-100 w-100 dashboard-link-card text-decoration-none"
          >
            <Card.Body className="d-flex flex-column justify-content-center">
              <Card.Title className="mb-2">
                Documents
              </Card.Title>

              <Card.Text className="mb-0">
                Voyez les documents déposés par les
                autres étudiants.
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6} lg={3} className="d-flex">
          <Card
            as={Link}
            to="/forum"
            className="h-100 w-100 dashboard-link-card text-decoration-none"
          >
            <Card.Body className="d-flex flex-column justify-content-center">
              <Card.Title className="mb-2">
                Forum
              </Card.Title>

              <Card.Text className="mb-0">
                Discutez avec les étudiants de votre
                programme.
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>

<Col md={6} lg={3} className="d-flex">
  <Card
    as={Link}
    to="/travaux"
    className="h-100 w-100 dashboard-link-card text-decoration-none"
  >
    <Card.Body className="d-flex flex-column justify-content-center">
      <Card.Title className="mb-2">
        Travaux
      </Card.Title>

      <Card.Text className="mb-0">
        Organisez vos devoirs, suivez leur progression et vos dates de remise.
      </Card.Text>
    </Card.Body>
  </Card>
</Col>

        <Col md={6} lg={3} className="d-flex">
          <Card
            as={Link}
            to="/agenda"
            className="h-100 w-100 dashboard-link-card text-decoration-none"
          >
            <Card.Body className="d-flex flex-column justify-content-center">
              <Card.Title className="mb-2">
                Agenda
              </Card.Title>

              <Card.Text className="mb-0">
                Voir mes cours, examens et devoirs à
                venir.
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}