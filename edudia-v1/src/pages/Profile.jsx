import React, { useMemo, useState } from 'react'
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
  Badge,
  ProgressBar
} from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import './Profile.css'

const USERS_KEY = 'edudia_users'

const PROGRAMMES = [
  "Techniques de l'informatique",
  'Sciences humaines',
  'Sciences de la nature',
  'Soins infirmiers',
  'Administration',
  'Arts, lettres et communication',
  'Génie civil',
  'Éducation spécialisée',
  'Autre'
]

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

const buildBadges = (profile) => {
  const badges = []
  badges.push(getLevelFromPoints(profile.points).name)
  if ((profile.documentUploads || 0) >= 1) badges.push('Partageur')
  if ((profile.forumReplies || 0) >= 1) badges.push('Aidant')
  if ((profile.documentDownloadsEarned || 0) >= 10) badges.push('Document utile')
  if ((profile.fiveStarBonuses || 0) >= 1) badges.push('Document vedette')
  return [...new Set(badges)]
}

const normalizeUserRewards = (input) => {
  const points = Number(input?.points || 0)
  const documentUploads = Number(input?.documentUploads || 0)
  const forumReplies = Number(input?.forumReplies || 0)
  const documentDownloadsEarned = Number(input?.documentDownloadsEarned || 0)
  const fiveStarBonuses = Number(input?.fiveStarBonuses || 0)
  const level = getLevelFromPoints(points).name

  return {
    ...input,
    points,
    level,
    badges: Array.isArray(input?.badges) && input.badges.length > 0
      ? input.badges
      : buildBadges({ points, documentUploads, forumReplies, documentDownloadsEarned, fiveStarBonuses }),
    documentUploads,
    forumReplies,
    documentDownloadsEarned,
    fiveStarBonuses
  }
}

const getStoredUsers = () => {
  const stored = safeParse(window.localStorage.getItem(USERS_KEY), [])
  return Array.isArray(stored) ? stored.map(normalizeUserRewards) : []
}

const getProgressData = (points) => {
  const currentLevel = getLevelFromPoints(points)
  const currentIndex = LEVELS.findIndex((level) => level.name === currentLevel.name)
  const nextLevel = LEVELS[currentIndex + 1] || null

  if (!nextLevel) {
    return {
      currentLevel,
      nextLevel: null,
      progressPercent: 100,
      pointsToNextLevel: 0
    }
  }

  const range = nextLevel.min - currentLevel.min
  const progressPercent = Math.min(100, Math.max(0, ((points - currentLevel.min) / range) * 100))

  return {
    currentLevel,
    nextLevel,
    progressPercent,
    pointsToNextLevel: Math.max(0, nextLevel.min - points)
  }
}

export default function Profile() {
  const {
  user,
  updateProfile,
  deactivateSubscription
} = useAuth()
  const navigate = useNavigate()
  const [firstName, setFirstName] = useState(user?.firstName || '')
const [lastName, setLastName] = useState(user?.lastName || '')
const [school, setSchool] = useState(user?.school || '')
const [programme, setProgramme] = useState(
  user?.programme || PROGRAMMES[0]
)
const [session, setSession] = useState(user?.session || '')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const users = useMemo(() => getStoredUsers(), [user?.id, user?.programme, user?.subscriptionStatus])
  const currentUserProfile = useMemo(() => {
    const found = users.find((item) => item.id === user?.id)
    return found || normalizeUserRewards(user || {})
  }, [users, user])

  const topContributors = useMemo(() => {
    return [...users]
      .filter((item) => item.role !== 'admin')
      .sort((left, right) => right.points - left.points)
      .slice(0, 5)
  }, [users])

  const progressData = useMemo(() => getProgressData(currentUserProfile.points || 0), [currentUserProfile.points])

  const subscriptionLabel = useMemo(() => {
    return user?.subscriptionStatus === 'active' ? 'Actif' : 'Inactif'
  }, [user?.subscriptionStatus])

  const subscriptionTypeLabel = user?.subscriptionType || 'Non spécifié'
  const subscriptionStartLabel = user?.subscriptionStartDate || 'Non disponible'
  const profileTitle = user?.role === 'admin' ? 'Profil administrateur' : 'Profil étudiant'

  const handleSubmit = async (event) => {
  event.preventDefault()
  setMessage('')
  setError('')

  if (!firstName.trim() || !lastName.trim()) {
    setError('Le prénom et le nom sont obligatoires.')
    return
  }

  const result = await updateProfile({
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    school: school.trim(),
    program: programme,
    session: session.trim()
  })

  if (!result?.success) {
    setError(
      result?.message ||
        'Impossible de mettre à jour le profil.'
    )
    return
  }

  setMessage('Profil mis à jour avec succès.')
}

  const handleCancelSubscription = async () => {
  setMessage('')
  setError('')

  const confirmed = window.confirm(
    'Êtes-vous sûr de vouloir résilier votre abonnement ? Votre accès restera actif jusqu’à la fin de la période déjà payée.'
  )

  if (!confirmed) return

  const result = await deactivateSubscription()

  if (!result?.success) {
    setError(
      result?.message ||
      'Impossible de résilier l’abonnement pour le moment.'
    )
    return
  }

  setMessage(
    result?.message ||
    'Votre abonnement ne sera pas renouvelé.'
  )
}

  return (
    <Container className="py-4 profile-page">
      <Row className="justify-content-center">
        <Col md={10} lg={8}>
          <Card className="shadow-sm">
            <Card.Body>
              <div className="profile-hero mb-4">
  <div className="profile-hero-avatar">
    {String(user?.nom || 'E')
      .trim()
      .charAt(0)
      .toUpperCase()}
  </div>

  <div className="profile-hero-content">
    <div className="profile-hero-label">
      {profileTitle}
    </div>

    <h1 className="profile-hero-name">
      {user?.nom || 'Étudiant'}
    </h1>

    <div className="profile-hero-programme">
      🎓 {user?.programme || 'Programme non défini'}
    </div>

    <div className="profile-hero-meta">
      <span className="profile-hero-level">
        ⭐ {progressData.currentLevel.name}
      </span>

      <span className="profile-hero-points">
        🏆 {currentUserProfile.points || 0} points
      </span>
    </div>
  </div>
</div>

              {message && <Alert variant="success">{message}</Alert>}
              {error && <Alert variant="danger">{error}</Alert>}

              <Row className="g-3 mb-4 profile-info-grid">
  <Col md={6}>
    <div className="profile-info-card">
      <div className="profile-info-icon">
        👤
      </div>

      <div>
        <div className="profile-info-label">
          Nom
        </div>

        <div className="profile-info-value">
          {user?.nom || '-'}
        </div>
      </div>
    </div>
  </Col>

  <Col md={6}>
    <div className="profile-info-card">
      <div className="profile-info-icon">
        📧
      </div>

      <div>
        <div className="profile-info-label">
          Courriel
        </div>

        <div className="profile-info-value">
          {user?.email || '-'}
        </div>
      </div>
    </div>
  </Col>

  <Col md={6}>
    <div className="profile-info-card">
      <div className="profile-info-icon">
        🎓
      </div>

      <div>
        <div className="profile-info-label">
          Programme actuel
        </div>

        <div className="profile-info-value">
          {user?.programme || '-'}
        </div>
      </div>
    </div>
  </Col>

  <Col md={6}>
    <div className="profile-info-card">
      <div className="profile-info-icon">
        💳
      </div>

      <div>
        <div className="profile-info-label">
          Statut d’abonnement
        </div>

        <div className="profile-info-value">
          {subscriptionLabel}
        </div>
      </div>
    </div>
  </Col>
</Row>

              <Card className="mb-4 border-0 profile-rewards-card">
  <Card.Body>
    <div className="d-flex justify-content-between align-items-center gap-3 flex-wrap mb-3">
      <div>
        <h2 className="h5 mb-1">
          Points et récompenses
        </h2>

        <div className="text-muted small">
          Ta progression dans la communauté Étudia+
        </div>
      </div>

      <span className="profile-rewards-level">
        ⭐ {progressData.currentLevel.name}
      </span>
    </div>

    <Row className="g-3 mb-4">
      <Col md={4}>
        <div className="profile-stat-card">
          <div className="profile-stat-icon">
            🏆
          </div>

          <div className="profile-stat-label">
            Points totaux
          </div>

          <div className="profile-stat-value">
            {currentUserProfile.points || 0}
          </div>
        </div>
      </Col>

      <Col md={4}>
        <div className="profile-stat-card">
          <div className="profile-stat-icon">
            ⭐
          </div>

          <div className="profile-stat-label">
            Niveau actuel
          </div>

          <div className="profile-stat-value profile-stat-value-text">
            {progressData.currentLevel.name}
          </div>
        </div>
      </Col>

      <Col md={4}>
        <div className="profile-stat-card">
          <div className="profile-stat-icon">
            🎖️
          </div>

          <div className="profile-stat-label">
            Badges
          </div>

          <div className="d-flex flex-wrap justify-content-center gap-2 mt-2">
            {(currentUserProfile.badges || []).map(
              (badge) => (
                <Badge
                  key={badge}
                  bg="primary"
                  className="profile-reward-badge"
                >
                  {badge}
                </Badge>
              )
            )}

            {(currentUserProfile.badges || [])
              .length === 0 && (
              <span className="text-muted small">
                Aucun badge
              </span>
            )}
          </div>
        </div>
      </Col>
    </Row>

    <div className="profile-progress-header">
      <span className="fw-semibold">
        Progression vers le niveau suivant
      </span>

      <span className="text-muted small">
        {progressData.nextLevel
          ? `${progressData.pointsToNextLevel} points avant ${progressData.nextLevel.name}`
          : 'Niveau maximum atteint'}
      </span>
    </div>

    <ProgressBar
      now={progressData.progressPercent}
      label={`${Math.round(
        progressData.progressPercent
      )}%`}
      className="profile-progress-bar"
    />
  </Card.Body>
</Card>

             <Card className="mb-4 border-0 profile-ranking-card">
  <Card.Body>
    <div className="mb-3">
      <h2 className="h5 mb-1">
        Top contributeurs
      </h2>

      <div className="text-muted small">
        Les étudiants les plus actifs de la communauté
      </div>
    </div>

    {topContributors.length === 0 ? (
      <Alert variant="info" className="mb-0">
        Aucun contributeur disponible pour le moment.
      </Alert>
    ) : (
      <div className="profile-ranking-list">
        {topContributors.map((contributor, index) => (
          <div
            key={contributor.id}
            className="profile-ranking-item"
          >
            <div className="profile-ranking-position">
              {index === 0
                ? '🥇'
                : index === 1
                  ? '🥈'
                  : index === 2
                    ? '🥉'
                    : `#${index + 1}`}
            </div>

            <div className="profile-ranking-avatar">
              {String(contributor.nom || 'E')
                .trim()
                .charAt(0)
                .toUpperCase()}
            </div>

            <div className="profile-ranking-user">
              <div className="profile-ranking-name">
                {contributor.nom || 'Étudiant'}
              </div>

              <div className="profile-ranking-programme">
                {contributor.programme || 'Programme non défini'}
              </div>
            </div>

            <div className="profile-ranking-points">
              {contributor.points || 0}
              <span> pts</span>
            </div>
          </div>
        ))}
      </div>
    )}
  </Card.Body>
</Card>

              <Card className="mb-4 border-0 profile-settings-card">
  <Card.Body>
    <div className="d-flex align-items-center gap-3 mb-3">
      <div className="profile-settings-icon">
        👤
      </div>

      <div>
        <h2 className="h5 mb-1">
          Informations du profil
        </h2>

        <div className="text-muted small">
          Modifie ton nom, ton établissement, ton programme et ta session.
        </div>
      </div>
    </div>

    <Form onSubmit={handleSubmit}>
      <Row className="g-3">
        <Col md={6}>
          <Form.Group>
            <Form.Label>Prénom</Form.Label>

            <Form.Control
              required
              value={firstName}
              onChange={(event) =>
                setFirstName(event.target.value)
              }
              placeholder="Ton prénom"
            />
          </Form.Group>
        </Col>

        <Col md={6}>
          <Form.Group>
            <Form.Label>Nom</Form.Label>

            <Form.Control
              required
              value={lastName}
              onChange={(event) =>
                setLastName(event.target.value)
              }
              placeholder="Ton nom"
            />
          </Form.Group>
        </Col>

        <Col md={6}>
          <Form.Group>
            <Form.Label>Établissement</Form.Label>

            <Form.Control
              value={school}
              onChange={(event) =>
                setSchool(event.target.value)
              }
              placeholder="Ex. Cégep de Saint-Jean-sur-Richelieu"
            />
          </Form.Group>
        </Col>

        <Col md={6}>
          <Form.Group>
            <Form.Label>Session</Form.Label>

            <Form.Control
              value={session}
              onChange={(event) =>
                setSession(event.target.value)
              }
              placeholder="Ex. Automne 2026"
            />
          </Form.Group>
        </Col>

        <Col md={12}>
          <Form.Group>
            <Form.Label>Programme</Form.Label>

            <Form.Select
              value={programme}
              onChange={(event) =>
                setProgramme(event.target.value)
              }
            >
              {PROGRAMMES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>

      <div className="d-flex justify-content-end mt-4">
        <Button type="submit">
          Enregistrer les modifications
        </Button>
      </div>
    </Form>
  </Card.Body>
</Card>

              <Card className="border-0 profile-subscription-card">
  <Card.Body>
    <div className="d-flex align-items-center gap-3 mb-3">
      <div className="profile-settings-icon">
        💳
      </div>

      <div>
        <h2 className="h5 mb-1">
          Gestion de l’abonnement
        </h2>

        <div className="text-muted small">
          Consulte les informations de ton abonnement.
        </div>
      </div>
    </div>

    <Row className="g-3 mb-4">
      <Col md={4}>
        <div className="profile-subscription-info">
          <div className="profile-subscription-label">
            Statut actuel
          </div>

          <div className="profile-subscription-value">
            {subscriptionLabel}
          </div>
        </div>
      </Col>

      <Col md={4}>
        <div className="profile-subscription-info">
          <div className="profile-subscription-label">
            Type d’abonnement
          </div>

          <div className="profile-subscription-value">
            {subscriptionTypeLabel}
          </div>
        </div>
      </Col>

      <Col md={4}>
        <div className="profile-subscription-info">
          <div className="profile-subscription-label">
            Date de début
          </div>

          <div className="profile-subscription-value">
            {subscriptionStartLabel}
          </div>
        </div>
      </Col>
    </Row>

    <div className="profile-subscription-danger">
      <div>
        <div className="fw-semibold">
          Résilier l’abonnement
        </div>

        <div className="text-muted small">
          Cette action désactivera le renouvellement automatique. Votre accès restera actif jusqu’à la fin de la période payée.
        </div>
      </div>

      <Button
        variant="outline-danger"
        onClick={handleCancelSubscription}
      >
        Résilier mon abonnement
      </Button>
    </div>
  </Card.Body>
</Card>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}
