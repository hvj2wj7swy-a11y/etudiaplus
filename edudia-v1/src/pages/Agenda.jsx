import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Container, Row, Col, Card, Form, Button, Alert, Modal } from 'react-bootstrap'
import './Agenda.css'
import { agendaAPI } from '../services/api.js'
import { useAuth } from '../context/AuthContext.jsx'

const WEEK_DAYS = [
  'Lundi',
  'Mardi',
  'Mercredi',
  'Jeudi',
  'Vendredi',
  'Samedi',
  'Dimanche'
]
const START_HOUR = 6
const END_HOUR = 22
const HOUR_HEIGHT = 60
const WEEK_VIEW_HEIGHT = (END_HOUR - START_HOUR) * HOUR_HEIGHT
const DAY_WIDTH_PERCENT = 100 / WEEK_DAYS.length

const typeColors = {
  cours: '#dbeafe',
  devoir: '#ffedd5',
  examen: '#fee2e2',
  rappel: '#d1fae5'
}

const typeBorderColors = {
  cours: '#60a5fa',
  devoir: '#fb923c',
  examen: '#f87171',
  rappel: '#34d399'
}

const parseTimeToMinutes = (time) => {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

const toDateKey = (date) => date.toISOString().slice(0, 10)

const dateKeyToLocalDate = (dateKey) => {
  const [year, month, day] = String(dateKey).split('-').map(Number)
  return new Date(year, month - 1, day)
}

const isWeekdayDateKey = (dateKey) => {
  const index = getWeekdayIndex(dateKeyToLocalDate(dateKey))
  return index >= 0 && index <= 6
}

const getNextWeekdayDateKey = (fromDate = new Date()) => {
  return toDateKey(new Date(fromDate))
}

const formatMonthTitle = (date) => {
  const title = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(date)
  return title.charAt(0).toUpperCase() + title.slice(1)
}

const formatWeekTitle = (startDate) => {
  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + 6)
  const format = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' })
  return `${format.format(startDate)} - ${format.format(endDate)}`
}

const getMonday = (date) => {
  const current = new Date(date)
  const day = current.getDay()
  const diff = current.getDate() - (day === 0 ? 6 : day - 1)
  return new Date(current.setDate(diff))
}

const addDays = (date, amount) => {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return next
}

const addMonths = (date, amount) => {
  const next = new Date(date)
  next.setMonth(next.getMonth() + amount)
  return next
}

const getWeekdayIndex = (date) => {
  const index = date.getDay()
  return index === 0 ? 6 : index - 1
}

const getCurrentTimePosition = (date) => {
  const minutes = date.getHours() * 60 + date.getMinutes()
  if (minutes < START_HOUR * 60 || minutes >= END_HOUR * 60) return null
  return minutes - START_HOUR * 60
}

const getMonthGridStart = (date) => {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1)
  const weekdayIndex = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1
  const gridStart = new Date(firstDay)
  gridStart.setDate(firstDay.getDate() - weekdayIndex)
  return gridStart
}

const getMonthDays = (date) => {
  const gridStart = getMonthGridStart(date)
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(gridStart)
    day.setDate(gridStart.getDate() + index)
    return day
  })
}

const eventMatchesDate = (event, date) => {
  return event.date === toDateKey(date)
}

const getTodayDateKey = () => getNextWeekdayDateKey(new Date())

const groupOverlappingEvents = (events) => {
  const sorted = [...events]
    .map((event) => ({
      ...event,
      start: parseTimeToMinutes(event.startTime),
      end: parseTimeToMinutes(event.endTime)
    }))
    .sort((a, b) => a.start - b.start || a.end - b.end)

  const clusters = []
  let cluster = []
  let clusterEnd = -1

  sorted.forEach((event) => {
    if (!cluster.length) {
      cluster = [event]
      clusterEnd = event.end
      return
    }

    if (event.start < clusterEnd) {
      cluster.push(event)
      clusterEnd = Math.max(clusterEnd, event.end)
      return
    }

    clusters.push(cluster)
    cluster = [event]
    clusterEnd = event.end
  })

  if (cluster.length) clusters.push(cluster)

  const layout = new Map()

  clusters.forEach((items) => {
    const columnEnds = []
    items.forEach((event) => {
      let columnIndex = -1
      for (let index = 0; index < columnEnds.length; index += 1) {
        if (event.start >= columnEnds[index]) {
          columnIndex = index
          columnEnds[index] = event.end
          break
        }
      }

      if (columnIndex === -1) {
        columnIndex = columnEnds.length
        columnEnds.push(event.end)
      }

      layout.set(event.id, { columnIndex, columns: columnEnds.length })
    })
  })

  return layout
}

export default function Agenda() {
  const [events, setEvents] = useState([])
const [agendaLoading, setAgendaLoading] = useState(true)
  const { user } = useAuth()

const token =
  localStorage.getItem('edudia_auth_token')
  const [viewMode, setViewMode] = useState('week')
  const [cursorDate, setCursorDate] = useState(new Date())
  const [currentTime, setCurrentTime] = useState(new Date())
  const [selectedMonthDate, setSelectedMonthDate] = useState(new Date())
  const [form, setForm] = useState({
    title: '',
    type: 'cours',
    date: getTodayDateKey(),
    startTime: '08:00',
    endTime: '09:00',
    course: '',
room: '',
description: '',
    recurrenceType: 'none',
recurrenceEndDate: '',
reminderMinutes: '',
reminderMinutesList: [],
priority: 'normal',
status: 'todo',
color: '#dbeafe'
  })
  const [formError, setFormError] = useState('')
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [editingEventId, setEditingEventId] = useState(null)
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
  priority:
  event.priority || 'normal',
  status:
  event.status || 'todo',

  recurrenceType:
    event.recurrence_type || 'none',

  recurrenceEndDate:
    event.recurrence_end_date
      ? String(event.recurrence_end_date).slice(0, 10)
      : '',

  reminderMinutes:
  event.reminder_minutes ?? '',

  reminderMinutesList:
event.reminder_minutes_list || [],
})

const loadAgendaEvents = async () => {
  if (!token) {
    setEvents([])
    setAgendaLoading(false)
    return
  }

  try {
    setAgendaLoading(true)

    const response =
      await agendaAPI.list(token)

    const rawEvents =
      response?.data?.events || []

    setEvents(
      rawEvents.map(normalizeAgendaEvent)
    )
  } catch (error) {
    console.error(
      'Erreur chargement agenda PostgreSQL:',
      error
    )

    setFormError(
      error.message ||
        "Impossible de charger l'agenda."
    )
  } finally {
    setAgendaLoading(false)
  }
}
  const formRef = useRef(null)

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
  loadAgendaEvents()
}, [token, user?.id])

  const weekStart = getMonday(cursorDate)
  const monthStart = new Date(cursorDate.getFullYear(), cursorDate.getMonth(), 1)
  const monthDays = useMemo(() => getMonthDays(monthStart), [monthStart.getTime()])
  const today = new Date()
  const todayWeekStart = getMonday(today)
  const isCurrentWeek = viewMode === 'week' && weekStart.getTime() === todayWeekStart.getTime()
  const currentDayIndex = isCurrentWeek ? getWeekdayIndex(today) : -1
  const currentTimePosition = isCurrentWeek ? getCurrentTimePosition(currentTime) : null

  const weekTitle = formatWeekTitle(weekStart)
  const monthTitle = formatMonthTitle(monthStart)
  const title = viewMode === 'week' ? weekTitle : monthTitle
  const prevLabel = viewMode === 'week' ? 'Semaine précédente' : 'Mois précédent'
  const nextLabel = viewMode === 'week' ? 'Semaine prochaine' : 'Mois suivant'

  const weekStartKey = toDateKey(weekStart)
  const weekEnd = addDays(weekStart, 6)
  const weekEndKey = toDateKey(weekEnd)

  const weekEvents = useMemo(() => {
    const filtered = events.filter((event) => {
      if (!event.date) return false
      return event.date >= weekStartKey && event.date <= weekEndKey
    })
    return filtered
  }, [events, weekStartKey, weekEndKey])

  useEffect(() => {
    console.log('week events filtered', weekEvents)
  }, [weekEvents])

  const selectedMonthEvents = useMemo(
    () => events.filter((event) => eventMatchesDate(event, selectedMonthDate)),
    [events, selectedMonthDate]
  )

  const upcomingEvents = useMemo(() => {
  const todayKey = toDateKey(new Date())
  const weekEndKey = toDateKey(addDays(new Date(), 7))

  const priorityRank = {
    urgent: 0,
    important: 1,
    normal: 2,
    low: 3
  }

  return events
    .filter((event) => {
      if (
        event.type !== 'devoir' &&
        event.type !== 'examen'
      ) {
        return false
      }

      if (
        event.status === 'completed' ||
        event.status === 'cancelled'
      ) {
        return false
      }

      return (
        event.date >= todayKey &&
        event.date <= weekEndKey
      )
    })
    .sort((a, b) => {
      if (a.date !== b.date) {
        return a.date.localeCompare(b.date)
      }

      return (
        (priorityRank[a.priority] ?? 2) -
        (priorityRank[b.priority] ?? 2)
      )
    })
}, [events])

  const selectedMonthLabel = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(selectedMonthDate)

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((previous) => ({ ...previous, [name]: value }))
  }

  const handleAddEvent = async (event) => {
  event.preventDefault()
  setFormError('')

  if (
    !form.title ||
    !form.date ||
    !form.startTime ||
    !form.endTime
  ) {
    setFormError(
      "Remplis le titre, la date, l'heure de début et l'heure de fin."
    )
    return
  }

  if (!isWeekdayDateKey(form.date)) {
    setFormError(
      'Choisis une date entre lundi et vendredi pour la vue semaine.'
    )
    return
  }

  if (
    parseTimeToMinutes(form.endTime) <=
    parseTimeToMinutes(form.startTime)
  ) {
    setFormError(
      "L'heure de fin doit être après l'heure de début."
    )
    return
  }

  if (
    form.recurrenceType !== 'none' &&
    !form.recurrenceEndDate
  ) {
    setFormError(
      'Choisis une date de fin pour la répétition.'
    )
    return
  }

  if (!token) {
    setFormError(
      'Session expirée. Reconnecte-toi.'
    )
    return
  }

  try {
    const payload = {
      title: form.title,
      type: form.type,
      date: form.date,
      startTime: form.startTime,
      endTime: form.endTime,
      course: form.course,
room: form.room,
description: form.description,
      color: form.color,
      priority: form.priority,
      status: form.status,
      recurrenceType: form.recurrenceType,
      recurrenceEndDate:
        form.recurrenceType === 'none'
          ? null
          : form.recurrenceEndDate,
          reminderMinutes:
form.reminderMinutes === ''
? null
: Number(form.reminderMinutes),

reminderMinutesList:
form.reminderMinutesList,
    }

    const response = editingEventId
      ? await agendaAPI.update(
          token,
          editingEventId,
          payload
        )
      : await agendaAPI.create(
          token,
          payload
        )

    if (editingEventId) {
      const updated =
        response?.data?.event

      if (!updated?.id) {
        throw new Error(
          "L'événement n'a pas été modifié."
        )
      }

      const normalizedUpdated =
        normalizeAgendaEvent(updated)

      setEvents((previous) =>
        previous.map((eventItem) =>
          eventItem.id === editingEventId
            ? normalizedUpdated
            : eventItem
        )
      )

      setEditingEventId(null)
    } else {
      const createdEvents =
        response?.data?.events || []

      if (!createdEvents.length) {
        throw new Error(
          'Aucun événement créé.'
        )
      }

      const normalizedEvents =
        createdEvents.map(
          normalizeAgendaEvent
        )

      setEvents((previous) => [
        ...previous,
        ...normalizedEvents
      ])
    }

    const eventDate =
      dateKeyToLocalDate(form.date)

    setCursorDate(eventDate)
    setSelectedMonthDate(eventDate)
    setViewMode('week')

    setForm({
      title: '',
      type: 'cours',
      date:
        getNextWeekdayDateKey(eventDate),
      startTime: '08:00',
      endTime: '09:00',
      course: '',
room: '',
description: '',
      recurrenceType: 'none',
      recurrenceEndDate: '',
reminderMinutes: '',
reminderMinutesList: [],
priority: 'normal',
status: 'todo',
color: '#dbeafe'
    })
  } catch (error) {
    console.error(
      'Erreur agenda PostgreSQL:',
      error
    )

    setFormError(
      error.message ||
        "Impossible d'enregistrer l'événement."
    )
  }
}

  const goToToday = () => {
    const now = new Date()
    setCursorDate(now)
    setSelectedMonthDate(now)
  }

  const changePeriod = (direction) => {
    setCursorDate((previous) => (viewMode === 'week' ? addDays(previous, direction * 7) : addMonths(previous, direction)))
  }

  const handleMonthDateClick = (date) => {
    setSelectedMonthDate(date)
  }

  const addFromSelectedDate = () => {
    const weekdayIndex = getWeekdayIndex(selectedMonthDate)
    setForm((previous) => ({
      ...previous,
      date: toDateKey(selectedMonthDate)
    }))
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleEventClick = (eventItem) => {
    setSelectedEvent(eventItem)
  }

  const handleEditEvent = () => {
  if (!selectedEvent) return

  setForm({
    title: selectedEvent.title || '',
    type: selectedEvent.type || 'cours',
    date: selectedEvent.date || getTodayDateKey(),
    startTime: selectedEvent.startTime || '08:00',
    endTime: selectedEvent.endTime || '09:00',
    course: selectedEvent.course || '',
room: selectedEvent.room || '',
description: selectedEvent.description || '',
recurrenceType:
  selectedEvent.recurrenceType || 'none',
recurrenceEndDate:
  selectedEvent.recurrenceEndDate || '',

reminderMinutes:
  selectedEvent.reminderMinutes ?? '',

  reminderMinutesList:
selectedEvent.reminderMinutesList || [],

  priority:
selectedEvent.priority || 'normal',

status:
  selectedEvent.status || 'todo',

color:
  selectedEvent.color || '#dbeafe'
  })

  setEditingEventId(selectedEvent.id)
  setSelectedEvent(null)
  setFormError('')

  window.setTimeout(() => {
    formRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    })
  }, 100)
}

const handleMarkCompleted = async () => {
  if (!selectedEvent || !token) return

  try {
    const payload = {
      title: selectedEvent.title,
      type: selectedEvent.type,
      date: selectedEvent.date,
      startTime: selectedEvent.startTime,
      endTime: selectedEvent.endTime,
      course: selectedEvent.course || '',
      room: selectedEvent.room || '',
      description: selectedEvent.description || '',
      color: selectedEvent.color || null,
      priority: selectedEvent.priority || 'normal',
      status: 'completed',
      recurrenceType:
        selectedEvent.recurrenceType || 'none',
      recurrenceEndDate:
        selectedEvent.recurrenceEndDate || null,
      reminderMinutes:
        selectedEvent.reminderMinutes === ''
          ? null
          : selectedEvent.reminderMinutes,
      reminderMinutesList:
        selectedEvent.reminderMinutesList || []
    }

    const response = await agendaAPI.update(
      token,
      selectedEvent.id,
      payload
    )

    const updated = response?.data?.event

    if (!updated?.id) {
      throw new Error(
        "Impossible de marquer l'événement comme terminé."
      )
    }

    const normalizedUpdated =
      normalizeAgendaEvent(updated)

    setEvents((previous) =>
      previous.map((event) =>
        event.id === selectedEvent.id
          ? normalizedUpdated
          : event
      )
    )

    setSelectedEvent(normalizedUpdated)
  } catch (error) {
    console.error(
      'Erreur statut agenda:',
      error
    )

    window.alert(
      error.message ||
      "Impossible de marquer l'événement comme terminé."
    )
  }
}

const handleMarkTodo = async () => {
  if (!selectedEvent || !token) return

  try {
    const payload = {
      title: selectedEvent.title,
      type: selectedEvent.type,
      date: selectedEvent.date,
      startTime: selectedEvent.startTime,
      endTime: selectedEvent.endTime,
      course: selectedEvent.course || '',
      room: selectedEvent.room || '',
      description: selectedEvent.description || '',
      color: selectedEvent.color || null,
      priority: selectedEvent.priority || 'normal',
      status: 'todo',
      recurrenceType:
        selectedEvent.recurrenceType || 'none',
      recurrenceEndDate:
        selectedEvent.recurrenceEndDate || null,
      reminderMinutes:
        selectedEvent.reminderMinutes === ''
          ? null
          : selectedEvent.reminderMinutes,
      reminderMinutesList:
        selectedEvent.reminderMinutesList || []
    }

    const response = await agendaAPI.update(
      token,
      selectedEvent.id,
      payload
    )

    const updated = response?.data?.event

    if (!updated?.id) {
      throw new Error(
        "Impossible de remettre l'événement à faire."
      )
    }

    const normalizedUpdated =
      normalizeAgendaEvent(updated)

    setEvents((previous) =>
      previous.map((event) =>
        event.id === selectedEvent.id
          ? normalizedUpdated
          : event
      )
    )

    setSelectedEvent(normalizedUpdated)
  } catch (error) {
    console.error(
      'Erreur statut agenda:',
      error
    )

    window.alert(
      error.message ||
      "Impossible de remettre l'événement à faire."
    )
  }
}

const handleDeleteEvent = async () => {
  if (!selectedEvent || !token) return

  try {
    // Événement non récurrent
    if (!selectedEvent.recurrenceGroupId) {
      const confirmed = window.confirm(
        'Supprimer cet événement ?'
      )

      if (!confirmed) return

      await agendaAPI.delete(
        token,
        selectedEvent.id
      )

      setEvents((previous) =>
        previous.filter(
          (event) =>
            event.id !== selectedEvent.id
        )
      )

      setSelectedEvent(null)
      return
    }

    // Événement récurrent
    const deleteWholeSeries = window.confirm(
      'Cet événement fait partie d’une série.\n\nOK = supprimer toute la série\nAnnuler = supprimer seulement cette occurrence'
    )

    if (deleteWholeSeries) {
      await agendaAPI.deleteSeries(
        token,
        selectedEvent.recurrenceGroupId
      )

      setEvents((previous) =>
        previous.filter(
          (event) =>
            event.recurrenceGroupId !==
            selectedEvent.recurrenceGroupId
        )
      )
    } else {
      const confirmSingle = window.confirm(
        'Supprimer seulement cette occurrence ?'
      )

      if (!confirmSingle) return

      await agendaAPI.delete(
        token,
        selectedEvent.id
      )

      setEvents((previous) =>
        previous.filter(
          (event) =>
            event.id !== selectedEvent.id
        )
      )
    }

    setSelectedEvent(null)

    if (
      editingEventId === selectedEvent.id
    ) {
      setEditingEventId(null)
    }
  } catch (error) {
    console.error(
      'Erreur suppression agenda PostgreSQL:',
      error
    )

    window.alert(
      error.message ||
        "Impossible de supprimer l'événement."
    )
  }
}

const handleCloseEventDetails = () => {
  setSelectedEvent(null)
}

  return (
    <Container fluid className="py-4 agenda-page-shell">
      <Row className="mb-4">
        <Col>
          <h1 className="agenda-main-heading">Mon agenda scolaire</h1>
          <p className="text-muted mb-0">Une vue claire de la semaine, du lundi au vendredi, avec des horaires précis.</p>
        </Col>
      </Row>

      <Row className="g-4">
        <Col lg={4} xl={3}>
          <div ref={formRef}>
            <Card className="shadow-sm mb-4">
              <Card.Body>
                <Card.Title>Ajouter un événement</Card.Title>
                <Form onSubmit={handleAddEvent} className="agenda-form">
                  {formError && <Alert variant="warning" className="py-2">{formError}</Alert>}

                  <Form.Group className="mb-3">
                    <Form.Label>Titre</Form.Label>
                    <Form.Control name="title" value={form.title} onChange={handleChange} placeholder="Cours de maths" />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Type</Form.Label>
                    <Form.Select name="type" value={form.type} onChange={handleChange}>
                      <option value="cours">Cours</option>
                      <option value="devoir">Devoir</option>
                      <option value="examen">Examen</option>
                      <option value="rappel">Rappel</option>
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Date</Form.Label>
                    <Form.Control type="date" name="date" value={form.date} onChange={handleChange} />
                  </Form.Group>

                  <Row className="g-3">
                    <Col>
                      <Form.Group className="mb-3">
                        <Form.Label>Début</Form.Label>
                        <Form.Control type="time" name="startTime" value={form.startTime} onChange={handleChange} />
                      </Form.Group>
                    </Col>
                    <Col>
                      <Form.Group className="mb-3">
                        <Form.Label>Fin</Form.Label>
                        <Form.Control type="time" name="endTime" value={form.endTime} onChange={handleChange} />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
  <Form.Label>Cours associé</Form.Label>
  <Form.Control
    name="course"
    value={form.course}
    onChange={handleChange}
    placeholder="Mathématiques"
  />
</Form.Group>

<Form.Group className="mb-3">
  <Form.Label>📍 Salle</Form.Label>

  <Form.Control
    name="room"
    value={form.room}
    onChange={handleChange}
    placeholder="Ex. B-214, Labo 3, En ligne"
  />
</Form.Group>

<Form.Group className="mb-3">
  <Form.Label>Description</Form.Label>

  <Form.Control
    as="textarea"
    rows={2}
    name="description"
    value={form.description}
    onChange={handleChange}
    placeholder="Détails de l'événement"
  />
</Form.Group>

<Form.Group className="mb-3">
  <Form.Label>Répétition</Form.Label>

  <Form.Select
    name="recurrenceType"
    value={form.recurrenceType}
    onChange={handleChange}
  >
    <option value="none">Aucune</option>
    <option value="weekly">Chaque semaine</option>
    <option value="biweekly">Toutes les 2 semaines</option>
    <option value="monthly">Chaque mois</option>
  </Form.Select>
</Form.Group>

{form.recurrenceType !== 'none' && (
  <Form.Group className="mb-3">
    <Form.Label>Fin de la répétition</Form.Label>

    <Form.Control
      type="date"
      name="recurrenceEndDate"
      value={form.recurrenceEndDate}
      onChange={handleChange}
      min={form.date}
    />
  </Form.Group>
)}
<Form.Group className="mb-3">
  <Form.Label>Rappels</Form.Label>

  {[
    { value: 10080, label: '1 semaine avant' },
    { value: 4320, label: '3 jours avant' },
    { value: 1440, label: '1 jour avant' },
    { value: 60, label: '1 heure avant' }
  ].map((item) => (
    <Form.Check
      key={item.value}
      type="checkbox"
      label={item.label}
      checked={form.reminderMinutesList.includes(item.value)}
      onChange={(e) => {
        if (e.target.checked) {
          setForm((prev) => ({
            ...prev,
            reminderMinutesList: [
              ...prev.reminderMinutesList,
              item.value
            ]
          }))
        } else {
          setForm((prev) => ({
            ...prev,
            reminderMinutesList:
              prev.reminderMinutesList.filter(
                (v) => v !== item.value
              )
          }))
        }
      }}
    />
  ))}
</Form.Group>

<Form.Group className="mb-3">
  <Form.Label>Priorité</Form.Label>

  <Form.Select
    name="priority"
    value={form.priority}
    onChange={handleChange}
  >
    <option value="low">🟢 Faible</option>
    <option value="normal">🔵 Normale</option>
    <option value="important">🟠 Importante</option>
    <option value="urgent">🔴 Urgente</option>
  </Form.Select>
</Form.Group>

<Form.Group className="mb-3">
  <Form.Label>Statut</Form.Label>

  <Form.Select
    name="status"
    value={form.status}
    onChange={handleChange}
  >
    <option value="todo">⏳ À faire</option>
    <option value="in_progress">🟡 En cours</option>
    <option value="completed">✅ Terminé</option>
    <option value="cancelled">❌ Annulé</option>
  </Form.Select>
</Form.Group>

<Form.Group className="mb-3">
  <Form.Label>Couleur</Form.Label>

  <Form.Control
    type="color"
    name="color"
    value={form.color}
    onChange={handleChange}
  />
</Form.Group>

                  <Button type="submit" className="w-100">
    {editingEventId ? "Enregistrer" : "Ajouter"}
</Button>
                </Form>
              </Card.Body>
            </Card>

            <Card className="shadow-sm">
              <Card.Body>
                <Card.Title>À remettre cette semaine</Card.Title>
                {upcomingEvents.length === 0 ? (
                  <p className="text-muted mb-0">Aucun devoir ou examen.</p>
                ) : (
                  <div className="d-grid gap-2">
                    {upcomingEvents.map((event) => (
  <div key={event.id} className="agenda-upcoming-item">
    <strong>
      {event.priority === 'urgent'
        ? '🔴 '
        : event.priority === 'important'
          ? '🟠 '
          : event.priority === 'low'
            ? '🟢 '
            : '🔵 '}
      {event.title}
    </strong>

<div className="small">
  {event.status === 'in_progress'
    ? '🟡 En cours'
    : '⏳ À faire'}
</div>

    <div className="text-muted small">
      {event.date} · {event.startTime}
      {event.course ? ` · ${event.course}` : ''}
    </div>
  </div>
))}
                  </div>
                )}
              </Card.Body>
            </Card>
          </div>
        </Col>

        <Col lg={8} xl={9}>
          <Card className="shadow-sm mb-3">
            <Card.Body className="agenda-toolbar-card">
              <div className="agenda-toolbar-actions">
                <div className="agenda-toolbar-nav">
                  <Button variant="outline-secondary" size="sm" onClick={() => changePeriod(-1)}>{prevLabel}</Button>
                  <Button variant="outline-secondary" size="sm" onClick={goToToday}>Aujourd’hui</Button>
                  <Button variant="outline-secondary" size="sm" onClick={() => changePeriod(1)}>{nextLabel}</Button>
                </div>
                <div className="agenda-toolbar-toggle">
                  <Button variant={viewMode === 'week' ? 'primary' : 'outline-secondary'} size="sm" onClick={() => setViewMode('week')}>Vue semaine</Button>
                  <Button variant={viewMode === 'month' ? 'primary' : 'outline-secondary'} size="sm" onClick={() => setViewMode('month')}>Vue mois</Button>
                </div>
              </div>
              <div className="agenda-toolbar-title">{title}</div>
            </Card.Body>
          </Card>

          {viewMode === 'week' ? (
            <div className="agenda-week-grid">
              <div className="agenda-grid-header agenda-grid-corner" />
              {WEEK_DAYS.map((day) => (
                <div key={day} className="agenda-grid-header agenda-grid-day-header">{day}</div>
              ))}

              <div className="agenda-week-body">
                <div className="agenda-time-axis">
                  {Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, index) => {
                    const hour = START_HOUR + index
                    return (
                      <div key={hour} className="agenda-time-label" style={{ top: `${index * HOUR_HEIGHT}px` }}>
                        {String(hour).padStart(2, '0')}:00
                      </div>
                    )
                  })}
                </div>

                {WEEK_DAYS.map((day, dayIndex) => {
                  const columnDate = addDays(weekStart, dayIndex)
                  const columnDateKey = toDateKey(columnDate)
                  const dayEvents = weekEvents.filter((event) => event.date === columnDateKey)
                  const layout = groupOverlappingEvents(dayEvents)

                  return (
                    <div key={day} className="agenda-day-column" style={{ gridColumn: dayIndex + 2 }}>
                      {dayEvents.map((event) => {
                        const start = parseTimeToMinutes(event.startTime) - START_HOUR * 60
                        const end = parseTimeToMinutes(event.endTime) - START_HOUR * 60
                        const duration = Math.max(20, end - start)
                        const placement = layout.get(event.id) || { columnIndex: 0, columns: 1 }
                        const columnWidth = 90 / placement.columns
                        const left = 5 + placement.columnIndex * columnWidth

                        return (
                          <div
                            key={event.id}
                            className={`agenda-event-card agenda-event-card--${event.type} agenda-event-card--interactive`}
                            style={{
                              top: `${Math.max(0, start)}px`,
                              height: `${duration}px`,
                              left: `${left}%`,
                              width: `${columnWidth}%`,
                              background:
  event.color ||
  typeColors[event.type] ||
  typeColors.cours,
                              borderColor: typeBorderColors[event.type] || typeBorderColors.cours
                            }}
                            onClick={() => handleEventClick(event)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(keyboardEvent) => {
                              if (keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ') {
                                keyboardEvent.preventDefault()
                                handleEventClick(event)
                              }
                            }}
                          >
                            <div className="agenda-event-title">{event.title}</div>
                            <div className="agenda-event-meta">{event.startTime} - {event.endTime}</div>
                            <div className="agenda-event-meta">{event.course}</div>
                          </div>
                        )
                      })}

                      {isCurrentWeek && currentDayIndex === dayIndex && currentTimePosition !== null && (
                        <div className="current-time-line" style={{ top: `${currentTimePosition}px` }} />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <>
              <div className="agenda-month-grid">
                <div className="agenda-month-header-row">
                  {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'].map((day) => (
                    <div key={day} className="agenda-month-header-cell">{day}</div>
                  ))}
                </div>
                <div className="agenda-month-body">
                  {monthDays.map((date) => {
                    const outsideMonth = date.getMonth() !== monthStart.getMonth()
                    const dateEvents = events.filter((event) => eventMatchesDate(event, date))
                    const selected = selectedMonthDate && toDateKey(selectedMonthDate) === toDateKey(date)

                    return (
                      <button
                        key={date.toISOString()}
                        type="button"
                        className={`agenda-month-cell ${outsideMonth ? 'agenda-month-cell--outside' : ''} ${selected ? 'agenda-month-cell--selected' : ''}`}
                        onClick={() => handleMonthDateClick(date)}
                      >
                        <div className="agenda-month-date">{date.getDate()}</div>
                        <div className="agenda-month-events">
                          {dateEvents.slice(0, 2).map((event) => (
                            <div key={`${event.id}-${date.toISOString()}`} className={`agenda-month-event agenda-month-event--${event.type}`}>
                              <span className="agenda-month-event-title">{event.title}</span>
                            </div>
                          ))}
                          {dateEvents.length > 2 && <div className="agenda-month-more">+{dateEvents.length - 2} autres</div>}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <Card className="shadow-sm mt-3 agenda-month-details-card">
                <Card.Body>
                  <div className="d-flex flex-wrap justify-content-between align-items-start gap-2">
                    <div>
                      <Card.Title className="mb-1">{selectedMonthLabel}</Card.Title>
                      <p className="text-muted small mb-0">Clique une journée pour voir ses événements ou préparer un ajout.</p>
                    </div>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={addFromSelectedDate}
                      disabled={false}
                    >
                      Ajouter à cette journée
                    </Button>
                  </div>

                  <div className="agenda-month-selected-list mt-3">
  {selectedMonthEvents.length === 0 ? (
    <p className="text-muted mb-0">
      Aucun événement pour cette journée.
    </p>
  ) : (
    <>
      {selectedMonthEvents.map((event) => (
        <div
          key={event.id}
          className="agenda-month-selected-item"
        >
          <strong>
            {event.priority === 'urgent'
              ? '🔴 '
              : event.priority === 'important'
                ? '🟠 '
                : event.priority === 'low'
                  ? '🟢 '
                  : '🔵 '}
            {event.title}
          </strong>

<div className="small">
  {event.status === 'in_progress'
    ? '🟡 En cours'
    : '⏳ À faire'}
</div>

          <div className="text-muted small">
            {event.date} · {event.startTime}
            {event.course ? ` · ${event.course}` : ''}
          </div>
        </div>
      ))}
    </>
  )}
</div>
                </Card.Body>
              </Card>
            </>
          )}
        </Col>
      </Row>

      <Modal show={Boolean(selectedEvent)} onHide={handleCloseEventDetails} centered>
        <Modal.Header closeButton>
          <Modal.Title>Détails de l'événement</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedEvent && (
            <div className="agenda-event-details">
              <p className="mb-2"><strong>Titre :</strong> {selectedEvent.title}</p>
              <p className="mb-2"><strong>Type :</strong> {selectedEvent.type}</p>
              <p className="mb-2"><strong>Date :</strong> {selectedEvent.date}</p>
              <p className="mb-2"><strong>Heure de début :</strong> {selectedEvent.startTime}</p>
              <p className="mb-2"><strong>Heure de fin :</strong> {selectedEvent.endTime}</p>
              <p className="mb-2"><strong>Cours associé :</strong> {selectedEvent.course || '-'}</p>
              <p className="mb-2">
  <strong>📍 Salle :</strong> {selectedEvent.room || '-'}
</p><p className="mb-2">
  <strong>Statut :</strong>{' '}
  {selectedEvent.status === 'completed'
    ? '✅ Terminé'
    : selectedEvent.status === 'in_progress'
      ? '🟡 En cours'
      : selectedEvent.status === 'cancelled'
        ? '❌ Annulé'
        : '⏳ À faire'}
</p><p className="mb-2">
  <strong>🔔 Rappels :</strong>{' '}
  {selectedEvent.reminderMinutesList?.length
    ? selectedEvent.reminderMinutesList
        .map((minutes) => {
          if (minutes === 10080) return '1 semaine avant'
          if (minutes === 4320) return '3 jours avant'
          if (minutes === 1440) return '1 jour avant'
          if (minutes === 60) return '1 heure avant'
          return `${minutes} minutes avant`
        })
        .join(', ')
    : 'Aucun'}
</p>
              <p className="mb-0"><strong>Description :</strong> {selectedEvent.description || '-'}</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>

  <Button
    variant="danger"
    onClick={handleDeleteEvent}
  >
    Supprimer
  </Button>

{selectedEvent?.status !== 'completed' && (
  <Button
    variant="success"
    onClick={handleMarkCompleted}
  >
    ✅ Marquer terminé
  </Button>
)}

{selectedEvent?.status === 'completed' && (
  <Button
    variant="outline-secondary"
    onClick={handleMarkTodo}
  >
    ↩️ Remettre à faire
  </Button>
)}

  <Button
    variant="primary"
    onClick={handleEditEvent}
  >
    Modifier
  </Button>

  <Button
    variant="secondary"
    onClick={handleCloseEventDetails}
  >
    Fermer
  </Button>

</Modal.Footer>
      </Modal>
    </Container>
  )
}
