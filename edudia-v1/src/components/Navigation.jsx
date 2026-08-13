import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Alert, Badge, Button, Card, Container, Nav, Navbar } from 'react-bootstrap'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { notificationAPI } from '../services/api.js'

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
  const navigate = useNavigate()

const token =
  localStorage.getItem(
    'edudia_auth_token'
  )
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

  const refreshNotifications = async () => {
  if (!user?.id || !token) {
    setNotifications([])
    return
  }

  try {
    const response =
      await notificationAPI.list(token)

    const rawNotifications =
      response?.data?.notifications || []

    const normalizedNotifications =
      rawNotifications.map((notification) => ({
        id: notification.id,
        userId: notification.user_id,
        type: notification.type || 'info',
        title: notification.title,
        message: notification.message,
        link: notification.link || null,
        metadata: notification.metadata || null,
        isRead: Boolean(notification.is_read),
        createdAt: notification.created_at,
        readAt: notification.read_at
      }))

    setNotifications(normalizedNotifications)
  } catch (error) {
    console.error(
      'Erreur chargement notifications:',
      error
    )
  }
}

  useEffect(() => {
  if (!user?.id || !token) {
    setNotifications([])
    return
  }

  refreshNotifications()
  setShowNotifications(false)
}, [user?.id, token])

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

  const markAsRead = async (notificationId) => {
  try {
    await notificationAPI.markAsRead(
      token,
      notificationId
    )

    refreshNotifications()
  } catch (error) {
    console.error(error)
  }
}

  const markAllAsRead = async () => {
  try {
    await notificationAPI.markAllAsRead(token)

    refreshNotifications()
  } catch (error) {
    console.error(error)
  }
}

const handleNotificationClick = async (notification) => {
  try {
    if (!notification.isRead) {
      await notificationAPI.markAsRead(
        token,
        notification.id
      )
    }

    await refreshNotifications()

    setShowNotifications(false)

    if (notification.link) {
      navigate(notification.link)
    }
  } catch (error) {
    console.error(
      'Erreur ouverture notification:',
      error
    )
  }
}

const createTestNotification = async () => {
  try {
    await notificationAPI.createTest(token)
    await refreshNotifications()
  } catch (error) {
    console.error(
      'Erreur notification test:',
      error
    )
  }
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
              <Card
  className="notifications-panel position-absolute end-0 mt-2 shadow"
  style={{
    zIndex: 1060,
    maxHeight: '70vh',
    overflowY: 'auto'
  }}
>
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
  className={`border rounded p-2 ${
    notification.isRead ? 'bg-light' : 'bg-white'
  }`}
  role="button"
  tabIndex={0}
  onClick={() =>
    handleNotificationClick(notification)
  }
  onKeyDown={(event) => {
    if (
      event.key === 'Enter' ||
      event.key === ' '
    ) {
      handleNotificationClick(notification)
    }
  }}
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
                              <Button
  size="sm"
  variant="outline-primary"
  onClick={(event) => {
    event.stopPropagation()
    markAsRead(notification.id)
  }}
>
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
