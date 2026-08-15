import React, { useEffect, useMemo, useState } from 'react'
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Spinner,
  Alert,
  Badge,
  Modal,
  Form
} from 'react-bootstrap'
import { agendaAPI } from '../services/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import './Travaux.css'

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
  priority: event.priority || 'normal',
  status: event.status || 'todo',
  color: event.color || null,
  recurrenceType: event.recurrence_type || 'none',
  recurrenceEndDate: event.recurrence_end_date
    ? String(event.recurrence_end_date).slice(0, 10)
    : '',
  reminderMinutes: event.reminder_minutes ?? '',
  reminderMinutesList: event.reminder_minutes_list || []
})

const formatDate = (dateKey) => {
  const [year, month, day] = dateKey.split('-').map(Number)

  return new Intl.DateTimeFormat('fr-CA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).format(new Date(year, month - 1, day))
}

const priorityLabel = {
  low: '🟢 Faible',
  normal: '🔵 Normale',
  important: '🟠 Importante',
  urgent: '🔴 Urgente'
}

const getTodayKey = () => {
  const now = new Date()

  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export default function Travaux() {
  const { user } = useAuth()

  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showAddModal, setShowAddModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const [form, setForm] = useState({
    title: '',
    course: '',
    date: getTodayKey(),
    startTime: '23:00',
    endTime: '23:30',
    priority: 'normal',
    status: 'todo',
    description: '',
    reminderMinutesList: []
  })

  const token = localStorage.getItem('edudia_auth_token')

  const loadTravaux = async () => {
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
      console.error('Erreur chargement travaux:', err)

      setError(
        err.message ||
          'Impossible de charger les travaux.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTravaux()
  }, [token, user?.id])

  const travaux = useMemo(() => {
    return events
      .filter((event) => event.type === 'devoir')
      .sort((a, b) => {
        if (a.date !== b.date) {
          return a.date.localeCompare(b.date)
        }

        return a.startTime.localeCompare(b.startTime)
      })
  }, [events])

  const aFaire = travaux.filter(
    (event) => event.status === 'todo'
  )

  const enCours = travaux.filter(
    (event) => event.status === 'in_progress'
  )

  const termines = travaux.filter(
    (event) => event.status === 'completed'
  )

  const handleFormChange = (event) => {
    const { name, value } = event.target

    setForm((previous) => ({
      ...previous,
      [name]: value
    }))
  }

  const toggleReminder = (minutes) => {
    setForm((previous) => {
      const exists =
        previous.reminderMinutesList.includes(minutes)

      return {
        ...previous,
        reminderMinutesList: exists
          ? previous.reminderMinutesList.filter(
              (item) => item !== minutes
            )
          : [
              ...previous.reminderMinutesList,
              minutes
            ]
      }
    })
  }

  const resetForm = () => {
    setForm({
      title: '',
      course: '',
      date: getTodayKey(),
      startTime: '23:00',
      endTime: '23:30',
      priority: 'normal',
      status: 'todo',
      description: '',
      reminderMinutesList: []
    })

    setFormError('')
  }

  const handleCreateTravail = async (event) => {
    event.preventDefault()

    setFormError('')

    if (!form.title.trim()) {
      setFormError('Entre un titre pour le travail.')
      return
    }

    if (!form.date) {
      setFormError('Choisis une date de remise.')
      return
    }

    if (!token) {
      setFormError(
        'Session expirée. Reconnecte-toi.'
      )
      return
    }

    try {
      setSaving(true)

      const payload = {
        title: form.title.trim(),
        type: 'devoir',
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        course: form.course.trim(),
        room: '',
        description: form.description.trim(),
        color: '#ffedd5',
        priority: form.priority,
        status: form.status,
        recurrenceType: 'none',
        recurrenceEndDate: null,
        reminderMinutes: null,
        reminderMinutesList:
          form.reminderMinutesList
      }

      const response = await agendaAPI.create(
        token,
        payload
      )

      const createdEvents =
        response?.data?.events || []

      if (!createdEvents.length) {
        throw new Error(
          "Le travail n'a pas été créé."
        )
      }

      const normalizedEvents =
        createdEvents.map(normalizeAgendaEvent)

      setEvents((previous) => [
        ...previous,
        ...normalizedEvents
      ])

      resetForm()
      setShowAddModal(false)
    } catch (err) {
      console.error(
        'Erreur création travail:',
        err
      )

      setFormError(
        err.message ||
          'Impossible de créer ce travail.'
      )
    } finally {
      setSaving(false)
    }
  }

  const updateStatus = async (event, status) => {
    if (!token) return

    try {
      const payload = {
        title: event.title,
        type: event.type,
        date: event.date,
        startTime: event.startTime,
        endTime: event.endTime,
        course: event.course,
        room: event.room,
        description: event.description,
        color: event.color,
        priority: event.priority,
        status,
        recurrenceType: event.recurrenceType,
        recurrenceEndDate:
          event.recurrenceEndDate || null,
        reminderMinutes:
          event.reminderMinutes === ''
            ? null
            : event.reminderMinutes,
        reminderMinutesList:
          event.reminderMinutesList
      }

      const response = await agendaAPI.update(
        token,
        event.id,
        payload
      )

      const updated = response?.data?.event

      if (!updated?.id) {
        throw new Error(
          'Impossible de modifier le statut.'
        )
      }

      const normalized =
        normalizeAgendaEvent(updated)

      setEvents((previous) =>
        previous.map((item) =>
          item.id === normalized.id
            ? normalized
            : item
        )
      )
    } catch (err) {
      console.error(
        'Erreur modification travail:',
        err
      )

      window.alert(
        err.message ||
          'Impossible de modifier ce travail.'
      )
    }
  }

  const renderTravail = (event) => (
    <Card
      key={event.id}
      className="shadow-sm mb-3"
    >
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start gap-3">
          <div>
            <Card.Title className="mb-1">
              {event.title}
            </Card.Title>

            {event.course && (
              <div className="text-muted mb-2">
                {event.course}
              </div>
            )}

            <div className="small mb-1">
              📅 {formatDate(event.date)}
              {' · '}
              {event.startTime}
            </div>

            <div className="small mb-2">
              {priorityLabel[event.priority]}
            </div>

            {event.description && (
              <p className="mb-0">
                {event.description}
              </p>
            )}
          </div>

          <Badge bg="light" text="dark">
            {event.status === 'completed'
              ? '✅ Terminé'
              : event.status === 'in_progress'
                ? '🟡 En cours'
                : '⏳ À faire'}
          </Badge>
        </div>

        <div className="d-flex flex-wrap gap-2 mt-3">
          {event.status !== 'todo' && (
            <Button
              size="sm"
              variant="outline-secondary"
              onClick={() =>
                updateStatus(event, 'todo')
              }
            >
              À faire
            </Button>
          )}

          {event.status !== 'in_progress' && (
            <Button
              size="sm"
              variant="outline-warning"
              onClick={() =>
                updateStatus(
                  event,
                  'in_progress'
                )
              }
            >
              En cours
            </Button>
          )}

          {event.status !== 'completed' && (
            <Button
              size="sm"
              variant="outline-success"
              onClick={() =>
                updateStatus(
                  event,
                  'completed'
                )
              }
            >
              Terminé
            </Button>
          )}
        </div>
      </Card.Body>
    </Card>
  )

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" />

        <p className="text-muted mt-3">
          Chargement des travaux...
        </p>
      </Container>
    )
  }

  return (
    <>
      <Container className="py-4">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
          <div>
            <h1 className="mb-1">
              Mes travaux
            </h1>

            <p className="text-muted mb-0">
              Suis facilement tes devoirs et leur progression.
            </p>
          </div>

          <Button
            onClick={() =>
              setShowAddModal(true)
            }
          >
            + Ajouter un travail
          </Button>
        </div>

        {error && (
          <Alert variant="warning">
            {error}
          </Alert>
        )}

        <Row className="g-4">
          <Col lg={4}>
            <h2 className="h4 mb-3">
              ⏳ À faire ({aFaire.length})
            </h2>

            {aFaire.length === 0 ? (
              <p className="text-muted">
                Aucun travail à faire.
              </p>
            ) : (
              aFaire.map(renderTravail)
            )}
          </Col>

          <Col lg={4}>
            <h2 className="h4 mb-3">
              🟡 En cours ({enCours.length})
            </h2>

            {enCours.length === 0 ? (
              <p className="text-muted">
                Aucun travail en cours.
              </p>
            ) : (
              enCours.map(renderTravail)
            )}
          </Col>

          <Col lg={4}>
            <h2 className="h4 mb-3">
              ✅ Terminés ({termines.length})
            </h2>

            {termines.length === 0 ? (
              <p className="text-muted">
                Aucun travail terminé.
              </p>
            ) : (
              termines.map(renderTravail)
            )}
          </Col>
        </Row>
      </Container>

      <Modal
        show={showAddModal}
        onHide={() => {
          setShowAddModal(false)
          resetForm()
        }}
        centered
        className="travaux-add-modal"
      >
        <Form onSubmit={handleCreateTravail}>
          <Modal.Header closeButton>
            <Modal.Title>
              Ajouter un travail
            </Modal.Title>
          </Modal.Header>

          <Modal.Body>
            {formError && (
              <Alert variant="warning">
                {formError}
              </Alert>
            )}

            <Form.Group className="mb-3">
              <Form.Label>
                Titre du travail
              </Form.Label>

              <Form.Control
                name="title"
                value={form.title}
                onChange={handleFormChange}
                placeholder="Ex. Dissertation de philosophie"
                autoFocus
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>
                Cours
              </Form.Label>

              <Form.Control
                name="course"
                value={form.course}
                onChange={handleFormChange}
                placeholder="Ex. Philosophie"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>
                Date de remise
              </Form.Label>

              <Form.Control
                type="date"
                name="date"
                value={form.date}
                onChange={handleFormChange}
              />
            </Form.Group>

            <Row>
              <Col>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Heure limite
                  </Form.Label>

                  <Form.Control
                    type="time"
                    name="startTime"
                    value={form.startTime}
                    onChange={handleFormChange}
                  />
                </Form.Group>
              </Col>

              <Col>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Priorité
                  </Form.Label>

                  <Form.Select
                    name="priority"
                    value={form.priority}
                    onChange={handleFormChange}
                  >
                    <option value="low">
                      🟢 Faible
                    </option>

                    <option value="normal">
                      🔵 Normale
                    </option>

                    <option value="important">
                      🟠 Importante
                    </option>

                    <option value="urgent">
                      🔴 Urgente
                    </option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>
                Statut
              </Form.Label>

              <Form.Select
                name="status"
                value={form.status}
                onChange={handleFormChange}
              >
                <option value="todo">
                  ⏳ À faire
                </option>

                <option value="in_progress">
                  🟡 En cours
                </option>

                <option value="completed">
                  ✅ Terminé
                </option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>
                Description
              </Form.Label>

              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={form.description}
                onChange={handleFormChange}
                placeholder="Consignes ou notes importantes..."
              />
            </Form.Group>

            <Form.Group>
              <Form.Label>
                🔔 Rappels
              </Form.Label>

              <Form.Check
                type="checkbox"
                label="1 semaine avant"
                checked={form.reminderMinutesList.includes(
                  10080
                )}
                onChange={() =>
                  toggleReminder(10080)
                }
              />

              <Form.Check
                type="checkbox"
                label="3 jours avant"
                checked={form.reminderMinutesList.includes(
                  4320
                )}
                onChange={() =>
                  toggleReminder(4320)
                }
              />

              <Form.Check
                type="checkbox"
                label="1 jour avant"
                checked={form.reminderMinutesList.includes(
                  1440
                )}
                onChange={() =>
                  toggleReminder(1440)
                }
              />

              <Form.Check
                type="checkbox"
                label="1 heure avant"
                checked={form.reminderMinutesList.includes(
                  60
                )}
                onChange={() =>
                  toggleReminder(60)
                }
              />
            </Form.Group>
          </Modal.Body>

          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => {
                setShowAddModal(false)
                resetForm()
              }}
              disabled={saving}
            >
              Annuler
            </Button>

            <Button
              type="submit"
              disabled={saving}
            >
              {saving
                ? 'Ajout...'
                : 'Ajouter le travail'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  )
}