import React, { useEffect, useMemo, useState } from 'react'
import { Alert, Badge, Button, ButtonGroup, Card, Col, Container, Form, Row } from 'react-bootstrap'
import { useAuth } from '../context/AuthContext.jsx'

const DOCUMENTS_KEY = 'edudia_documents'
const FAVORITES_KEY = 'edudia_favorites'

const safeParse = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

const normalizeDocument = (doc) => ({
  ...doc,
  authorId: doc.authorId ?? null,
  rating: Number(doc.rating || 0),
  ratingBonusGranted: Boolean(doc.ratingBonusGranted),
  downloadCount: Number(doc.downloadCount || 0),
  ratings: Array.isArray(doc.ratings) ? doc.ratings : [],
  comments: Array.isArray(doc.comments) ? doc.comments : []
})

const getStoredDocuments = () => {
  const stored = safeParse(window.localStorage.getItem(DOCUMENTS_KEY), null)
  return Array.isArray(stored) ? stored.map(normalizeDocument) : []
}

const getStoredFavorites = () => {
  const stored = safeParse(window.localStorage.getItem(FAVORITES_KEY), [])
  return Array.isArray(stored) ? stored : []
}

const getTypeIcon = (type) => {
  if (type === 'pdf') return 'PDF'
  if (type === 'word') return 'WORD'
  if (type === 'powerpoint') return 'PPT'
  if (type === 'image') return 'IMG'
  return 'FILE'
}

export default function Favorites() {
  const { user } = useAuth()
  const [documents] = useState(() => getStoredDocuments())
  const [favorites, setFavorites] = useState(() => getStoredFavorites())
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    setFavorites(getStoredFavorites())
  }, [user?.id])

  const favoriteDocuments = useMemo(() => {
    if (!user?.id) return []

    const favoriteIds = favorites
      .filter((favorite) => favorite.userId === user.id)
      .map((favorite) => favorite.documentId)

    return documents.filter((document) => favoriteIds.includes(document.id))
  }, [documents, favorites, user?.id])

  const filteredDocuments = useMemo(() => {
    if (filter === 'all') return favoriteDocuments
    if (filter === 'pdf') return favoriteDocuments.filter((document) => document.fileType === 'pdf')
    if (filter === 'word') return favoriteDocuments.filter((document) => document.fileType === 'word')
    if (filter === 'powerpoint') return favoriteDocuments.filter((document) => document.fileType === 'powerpoint')
    if (filter === 'image') return favoriteDocuments.filter((document) => document.fileType === 'image')
    return favoriteDocuments
  }, [favoriteDocuments, filter])

  const removeFromFavorites = (documentId) => {
    if (!user?.id) return

    const nextFavorites = favorites.filter((favorite) => !(favorite.userId === user.id && favorite.documentId === documentId))
    setFavorites(nextFavorites)
    window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(nextFavorites))
  }

  const totalFavorites = favoriteDocuments.length

  return (
    <Container className="py-4">
      <Row className="align-items-center mb-4">
        <Col>
          <h1 className="mb-1">Favoris</h1>
          <p className="text-muted mb-0">Retrouvez rapidement vos documents préférés.</p>
        </Col>
        <Col xs="auto">
          <Badge bg="primary" className="fs-6 px-3 py-2">Mes favoris ({totalFavorites})</Badge>
        </Col>
      </Row>

      <Card className="mb-4">
        <Card.Body>
          <div className="d-flex flex-wrap gap-2 align-items-center">
            <span className="text-muted">Filtrer :</span>
            <ButtonGroup>
              <Button variant={filter === 'all' ? 'primary' : 'outline-primary'} onClick={() => setFilter('all')}>Tous</Button>
              <Button variant={filter === 'pdf' ? 'primary' : 'outline-primary'} onClick={() => setFilter('pdf')}>PDF</Button>
              <Button variant={filter === 'word' ? 'primary' : 'outline-primary'} onClick={() => setFilter('word')}>Word</Button>
              <Button variant={filter === 'powerpoint' ? 'primary' : 'outline-primary'} onClick={() => setFilter('powerpoint')}>PowerPoint</Button>
              <Button variant={filter === 'image' ? 'primary' : 'outline-primary'} onClick={() => setFilter('image')}>Images</Button>
            </ButtonGroup>
          </div>
        </Card.Body>
      </Card>

      {filteredDocuments.length === 0 ? (
        <Alert variant="info">Aucun document dans vos favoris</Alert>
      ) : (
        <Row className="g-3">
          {filteredDocuments.map((document) => (
            <Col md={6} lg={4} key={document.id}>
              <Card className="h-100 shadow-sm">
                <Card.Body className="d-flex flex-column gap-3">
                  <div className="d-flex align-items-center justify-content-between gap-2">
                    <div className="d-flex align-items-center gap-2">
                      <Badge bg="secondary">{getTypeIcon(document.fileType)}</Badge>
                      <div>
                        <div className="fw-semibold">{document.title}</div>
                        <small className="text-muted">{document.course || '-'} · {document.category || '-'}</small>
                      </div>
                    </div>
                    <Badge bg="warning" text="dark">Favori</Badge>
                  </div>

                  <div className="text-muted small">Par {document.author || 'Étudiant'}</div>
                  <div className="text-muted small">Ajouté le {document.date || '-'}</div>

                  <div className="d-flex justify-content-between align-items-center gap-2 mt-auto">
                    <div className="text-muted small">{document.downloadCount || 0} téléchargement(s)</div>
                    <Button size="sm" variant="outline-danger" onClick={() => removeFromFavorites(document.id)}>
                      Retirer des favoris
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  )
}