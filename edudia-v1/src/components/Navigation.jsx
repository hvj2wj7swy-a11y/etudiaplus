import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Alert, Badge, Button, Card, Container, Nav, Navbar } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const NOTIFICATIONS_KEY = 'edudia_notifications'
const NOTIFICATION_EVENT = 'edudia-notifications-updated'

const safeParse = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
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

const dispatchNotificationUpdate = () => {
  window.dispatchEvent(new Event(NOTIFICATION_EVENT))
}

const typeLabels = {
  forum: 'Forum',
  document: 'Document',
  comment: 'Commentaire',
  report: 'Signalement',
  agenda: 'Agenda',
  info: 'Info'
}

const typeVariants = {
  forum: 'primary',
  document: 'success',
  comment: 'info',
  report: 'warning',
  agenda: 'secondary',
  info: 'dark'
}

const formatNotificationDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString('fr-CA')
}

export default function Navigation() {
  const { user, logout } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [installPrompt, setInstallPrompt] = useState(null)
  const [isStandalone, setIsStandalone] = useState(false)
  const [isOnline, setIsOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine)
  const panelRef = useRef(null)
  const hasActiveSubscription = user?.subscriptionStatus === 'active'
  const isAdmin = user?.role === 'admin'
  const canAccessPremiumFeatures = Boolean(hasActiveSubscription || isAdmin)
  const isIosDevice = typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent)

  const refreshNotifications = () => {
    if (!user?.id) {
      setNotifications([])
      return
    }

    const stored = readNotifications().filter((notification) => notification.userId === user.id)
    stored.sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    setNotifications(stored)
  }

  useEffect(() => {
    refreshNotifications()
    setShowNotifications(false)
  }, [user?.id])

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
    setIsStandalone(standalone)

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault()
      setInstallPrompt(event)
    }

    const handleAppInstalled = () => {
      setInstallPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    const handleUpdate = () => refreshNotifications()
    const handleStorage = (event) => {
      if (event.key === NOTIFICATIONS_KEY) refreshNotifications()
    }

    window.addEventListener(NOTIFICATION_EVENT, handleUpdate)
    window.addEventListener('storage', handleStorage)

    return () => {
      window.removeEventListener(NOTIFICATION_EVENT, handleUpdate)
      window.removeEventListener('storage', handleStorage)
    }
  }, [user?.id])

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!panelRef.current) return
      if (!panelRef.current.contains(event.target)) {
        setShowNotifications(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications]
  )

  const markAsRead = (notificationId) => {
    const nextNotifications = readNotifications().map((notification) => {
      if (notification.id !== notificationId) return notification
      return { ...notification, isRead: true }
    })

    saveNotifications(nextNotifications)
    refreshNotifications()
    dispatchNotificationUpdate()
  }

  const markAllAsRead = () => {
    const nextNotifications = readNotifications().map((notification) => (
      notification.userId === user?.id ? { ...notification, isRead: true } : notification
    ))

    saveNotifications(nextNotifications)
    refreshNotifications()
    dispatchNotificationUpdate()
  }

  const handleInstallClick = async () => {
    if (!installPrompt) return

    installPrompt.prompt()
    await installPrompt.userChoice.catch(() => null)
    setInstallPrompt(null)
  }

  const canInstallApp = Boolean(installPrompt && !isStandalone)

  return (
    <>
      {canInstallApp && (
        <Container className="mb-3">
          <Alert variant="info" className="mb-0 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
            <div>Installez Étudia+ sur votre appareil pour un accès rapide.</div>
            <Button variant="outline-primary" size="sm" onClick={handleInstallClick} className="align-self-md-center">
              Installer Étudia+
            </Button>
          </Alert>
        </Container>
      )}

      {!isOnline && (
        <Container className="mb-3">
          <Alert variant="warning" className="mb-0">
            Vous êtes hors ligne
          </Alert>
        </Container>
      )}

      <Navbar bg="dark" variant="dark" expand="lg" className="mb-4 navigation-shell">
        <Container>
          <Navbar.Brand as={Link} to="/">📚 Étudia+</Navbar.Brand>
        {user && (
          <div className="position-relative ms-auto me-2" ref={panelRef}>
            <Button
              type="button"
              variant="outline-light"
              size="sm"
              onClick={() => setShowNotifications((previous) => !previous)}
              className="position-relative"
              aria-label="Notifications"
            >
              🔔
              {unreadCount > 0 && (
                <Badge bg="danger" pill className="position-absolute top-0 start-100 translate-middle">
                  {unreadCount}
                </Badge>
              )}
            </Button>

            {showNotifications && (
              <Card className="notifications-panel position-absolute end-0 mt-2 shadow" style={{ zIndex: 1060 }}>
                <Card.Body className="p-3">
                  <div className="d-flex justify-content-between align-items-center gap-2 mb-3">
                    <div className="fw-semibold">Notifications</div>
                    <Button size="sm" variant="outline-secondary" onClick={markAllAsRead} disabled={notifications.length === 0}>
                      Tout marquer comme lu
                    </Button>
                  </div>

                  {notifications.length === 0 ? (
                    <Alert variant="light" className="mb-0 py-2">
                      Aucune notification pour le moment.
                    </Alert>
                  ) : (
                    <div className="d-grid gap-2">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`border rounded p-2 ${notification.isRead ? 'bg-light' : 'bg-white'}`}
                        >
                          <div className="d-flex justify-content-between align-items-start gap-2">
                            <Badge bg={typeVariants[notification.type] || 'secondary'}>
                              {typeLabels[notification.type] || notification.type}
                            </Badge>
                            <small className="text-muted">{formatNotificationDate(notification.createdAt)}</small>
                          </div>
                          <div className="fw-semibold mt-2">{notification.title}</div>
                          <div className="small text-muted">{notification.message}</div>
                          <div className="d-flex justify-content-end mt-2">
                            {!notification.isRead && (
                              <Button size="sm" variant="outline-primary" onClick={() => markAsRead(notification.id)}>
                                Marquer comme lu
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card.Body>
              </Card>
            )}
          </div>
        )}
        <Navbar.Toggle />
        <Navbar.Collapse>
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">Accueil</Nav.Link>
            {user && <Nav.Link as={Link} to="/profile">Profil</Nav.Link>}
            {user && <Nav.Link as={Link} to="/notes">Notes</Nav.Link>}
            {canAccessPremiumFeatures && (
              <>
                <Nav.Link as={Link} to="/documents">Documents</Nav.Link>
                <Nav.Link as={Link} to="/favoris">Favoris</Nav.Link>
                <Nav.Link as={Link} to="/forum">Forum</Nav.Link>
                <Nav.Link as={Link} to="/agenda">Agenda</Nav.Link>
              </>
            )}
            {isAdmin && <Nav.Link as={Link} to="/admin">Admin</Nav.Link>}
            {user && !hasActiveSubscription && !isAdmin && <Nav.Link as={Link} to="/subscription">Abonnement</Nav.Link>}
          </Nav>
          <Nav className="align-items-center">
            {user ? (
              <>
                <Nav.Link as={Link} to={hasActiveSubscription || isAdmin ? '/tools' : '/subscription'}>{user.nom}</Nav.Link>
                <Button variant="outline-light" size="sm" onClick={logout}>Déconnexion</Button>
              </>
            ) : (
              <>
                <Nav.Link as={Link} to="/login">Connexion</Nav.Link>
                <Nav.Link as={Link} to="/register">Inscription</Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
        </Container>
      </Navbar>

      {isIosDevice && !isStandalone && (
        <Container className="mb-3">
          <Alert variant="info" className="mb-0">
            Pour installer sur iPhone/iPad : ouvrir Safari, partager, puis Ajouter à l'écran d'accueil.
          </Alert>
        </Container>
      )}
    </>
  )
}
