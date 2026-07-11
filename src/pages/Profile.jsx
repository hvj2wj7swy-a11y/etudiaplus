import React, { useMemo, useState } from 'react'
import { Container, Row, Col, Card, Form, Button, Alert, Badge, ProgressBar, Table } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

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
  const { user, updateProgramme, deactivateSubscription } = useAuth()
  const navigate = useNavigate()
  const [programme, setProgramme] = useState(user?.programme || PROGRAMMES[0])
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

  const handleSubmit = (event) => {
    event.preventDefault()
    setMessage('')
    setError('')

    const result = updateProgramme(programme)
    if (!result?.success) {
      setError(result?.message || 'Impossible de mettre à jour le programme.')
      return
    }

    setMessage('Programme mis à jour avec succès.')
  }

  const handleCancelSubscription = () => {
    setMessage('')
    setError('')

    const confirmed = window.confirm(
      'Êtes-vous sûr de vouloir résilier votre abonnement ? Vous perdrez l’accès aux documents, forum, agenda et outils d’étude.'
    )
    if (!confirmed) return

    const ok = deactivateSubscription()
    if (!ok) {
      setError('Impossible de résilier l\'abonnement pour le moment.')
      return
    }

    navigate('/subscription', { replace: true, state: { cancelled: true } })
  }

  return (
    <Container className="py-4 profile-page">
      <Row className="justify-content-center">
        <Col md={10} lg={8}>
          <Card className="shadow-sm">
            <Card.Body>
              <h1 className="h3 mb-4">{profileTitle}</h1>

              {message && <Alert variant="success">{message}</Alert>}
              {error && <Alert variant="danger">{error}</Alert>}

              <Row className="g-3 mb-4">
                <Col md={6}>
                  <div className="border rounded p-3 bg-light">
                    <div className="text-muted small">Nom</div>
                    <div className="fw-semibold">{user?.nom || '-'}</div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="border rounded p-3 bg-light">
                    <div className="text-muted small">Email</div>
                    <div className="fw-semibold">{user?.email || '-'}</div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="border rounded p-3 bg-light">
                    <div className="text-muted small">Programme actuel</div>
                    <div className="fw-semibold">{user?.programme || '-'}</div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="border rounded p-3 bg-light">
                    <div className="text-muted small">Statut d'abonnement</div>
                    <div className="fw-semibold">{subscriptionLabel}</div>
                  </div>
                </Col>
              </Row>

              <Card className="mb-4 border-0 bg-light-subtle">
                <Card.Body>
                  <h2 className="h5 mb-3">Points et récompenses</h2>
                  <Row className="g-3 mb-3">
                    <Col md={4}>
                      <div className="border rounded p-3 bg-white h-100">
                        <div className="text-muted small">Points totaux</div>
                        <div className="fw-bold fs-4">{currentUserProfile.points || 0}</div>
                      </div>
                    </Col>
                    <Col md={4}>
                      <div className="border rounded p-3 bg-white h-100">
                        <div className="text-muted small">Niveau actuel</div>
                        <div className="fw-bold fs-5">{progressData.currentLevel.name}</div>
                      </div>
                    </Col>
                    <Col md={4}>
                      <div className="border rounded p-3 bg-white h-100">
                        <div className="text-muted small">Badges</div>
                        <div className="d-flex flex-wrap gap-2 mt-2">
                          {(currentUserProfile.badges || []).map((badge) => (
                            <Badge key={badge} bg="primary">{badge}</Badge>
                          ))}
                          {(currentUserProfile.badges || []).length === 0 && <span className="text-muted">Aucun badge</span>}
                        </div>
                      </div>
                    </Col>
                  </Row>

                  <div className="mb-2 d-flex justify-content-between align-items-center gap-2 flex-wrap">
                    <span className="fw-semibold">Progression vers le niveau suivant</span>
                    <span className="text-muted small">
                      {progressData.nextLevel ? `${progressData.pointsToNextLevel} points avant ${progressData.nextLevel.name}` : 'Niveau maximum atteint'}
                    </span>
                  </div>
                  <ProgressBar now={progressData.progressPercent} label={`${Math.round(progressData.progressPercent)}%`} />
                </Card.Body>
              </Card>

              <Card className="mb-4 border-0 bg-light-subtle">
                <Card.Body>
                  <h2 className="h5 mb-3">Top contributeurs</h2>
                  {topContributors.length === 0 ? (
                    <Alert variant="info" className="mb-0">Aucun contributeur disponible pour le moment.</Alert>
                  ) : (
                    <Table responsive hover className="mb-0 align-middle">
                      <thead>
                        <tr>
                          <th>Nom</th>
                          <th>Programme</th>
                          <th>Points</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topContributors.map((contributor) => (
                          <tr key={contributor.id}>
                            <td>{contributor.nom}</td>
                            <td>{contributor.programme || '-'}</td>
                            <td className="fw-semibold">{contributor.points}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </Card.Body>
              </Card>

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Modifier le programme d'étude</Form.Label>
                  <Form.Select value={programme} onChange={(event) => setProgramme(event.target.value)}>
                    {PROGRAMMES.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Button type="submit">Enregistrer le programme</Button>
              </Form>

              <hr className="my-4" />

              <h2 className="h5 mb-3">Gestion de l'abonnement</h2>
              <Row className="g-3 mb-3">
                <Col md={4}>
                  <div className="border rounded p-3 bg-light">
                    <div className="text-muted small">Statut actuel</div>
                    <div className="fw-semibold">{subscriptionLabel}</div>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="border rounded p-3 bg-light">
                    <div className="text-muted small">Type d'abonnement</div>
                    <div className="fw-semibold">{subscriptionTypeLabel}</div>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="border rounded p-3 bg-light">
                    <div className="text-muted small">Date de début</div>
                    <div className="fw-semibold">{subscriptionStartLabel}</div>
                  </div>
                </Col>
              </Row>

              <Button variant="outline-danger" onClick={handleCancelSubscription}>
                Résilier mon abonnement
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}
