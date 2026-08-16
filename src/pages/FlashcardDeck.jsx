import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Container, Card, Button, Modal, Form } from 'react-bootstrap'
import { flashcardAPI } from '../services/api.js'
import './Flashcards.css'

export default function FlashcardDeck() {
  const { id } = useParams()

  const navigate = useNavigate()

  const [deck, setDeck] = useState(null)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
const [question, setQuestion] = useState('')
const [answer, setAnswer] = useState('')
const [saving, setSaving] = useState(false)
const [editingCard, setEditingCard] = useState(null)
const [editQuestion, setEditQuestion] = useState('')
const [editAnswer, setEditAnswer] = useState('')
const [showEditModal, setShowEditModal] = useState(false)
const [showEditDeckModal, setShowEditDeckModal] = useState(false)
const [deckTitle, setDeckTitle] = useState('')
const [deckDescription, setDeckDescription] = useState('')

  const token = window.localStorage.getItem('edudia_auth_token')

  useEffect(() => {
  const loadDeck = async () => {
    try {

      const response = await flashcardAPI.getDeck(token, id)

      setDeck(response?.data?.deck)

    } catch (err) {
      console.error("Erreur chargement paquet :", err)
      setError('Impossible de charger ce paquet.')
    }
  }

  loadDeck()
}, [id])

  const handleCreateCard = async (e) => {
  e.preventDefault()

  if (!question.trim() || !answer.trim()) return

  try {
    setSaving(true)

    await flashcardAPI.createCard(token, id, {
      question: question.trim(),
      answer: answer.trim()
    })

    setQuestion('')
    setAnswer('')
    setShowModal(false)
    setError('')

    const response = await flashcardAPI.getDeck(token, id)

setDeck(response?.data?.deck)

  } catch (err) {
    console.error('Erreur création carte:', err)
    setError('Impossible de créer la carte.')
  } finally {
    setSaving(false)
  }
}

const openEditCard = (card) => {
  setEditingCard(card)
  setEditQuestion(card.question || '')
  setEditAnswer(card.answer || '')
  setShowEditModal(true)
}

const handleUpdateCard = async (e) => {
  e.preventDefault()

  if (!editingCard) return
  if (!editQuestion.trim() || !editAnswer.trim()) return

  try {
    setSaving(true)

    await flashcardAPI.updateCard(
      token,
      id,
      editingCard.id,
      {
        question: editQuestion.trim(),
        answer: editAnswer.trim()
      }
    )

    const response = await flashcardAPI.getDeck(token, id)
    setDeck(response?.data?.deck)

    setShowEditModal(false)
    setEditingCard(null)
  } catch (err) {
    console.error('Erreur modification carte:', err)
    setError('Impossible de modifier la carte.')
  } finally {
    setSaving(false)
  }
}
const handleDeleteCard = async (cardId) => {
  const confirmed = window.confirm(
    'Supprimer cette carte ? Cette action est définitive.'
  )

  if (!confirmed) return

  try {
    setSaving(true)

    await flashcardAPI.deleteCard(
      token,
      id,
      cardId
    )

    const response = await flashcardAPI.getDeck(token, id)
    setDeck(response?.data?.deck)

  } catch (err) {
    console.error('Erreur suppression carte:', err)
    setError('Impossible de supprimer la carte.')
  } finally {
    setSaving(false)
  }
}

const openEditDeck = () => {
  setDeckTitle(deck.title || '')
  setDeckDescription(deck.description || '')
  setShowEditDeckModal(true)
}

const handleUpdateDeck = async (e) => {
  e.preventDefault()

  if (!deckTitle.trim()) return

  try {
    setSaving(true)

    await flashcardAPI.updateDeck(token, id, {
      title: deckTitle.trim(),
      description: deckDescription.trim()
    })

    const response = await flashcardAPI.getDeck(token, id)
    setDeck(response?.data?.deck)

    setShowEditDeckModal(false)
  } catch (err) {
    console.error('Erreur modification paquet:', err)
    setError('Impossible de modifier le paquet.')
  } finally {
    setSaving(false)
  }
}

const handleDeleteDeck = async () => {
  const confirmed = window.confirm(
    'Supprimer ce paquet et toutes ses cartes ? Cette action est définitive.'
  )

  if (!confirmed) return

  try {
    setSaving(true)

    await flashcardAPI.deleteDeck(token, id)

    navigate('/flashcards')
  } catch (err) {
    console.error('Erreur suppression paquet:', err)
    setError('Impossible de supprimer le paquet.')
  } finally {
    setSaving(false)
  }
}

  if (error) {
    return (
      <Container className="py-4">
        <div className="alert alert-danger">
          {error}
        </div>
      </Container>
    )
  }

  if (!deck) {
    return (
      <Container className="py-4">
        Chargement...
      </Container>
    )
  }

  return (
    <Container className="py-4">
        <Button
  variant="outline-secondary"
  className="mb-3"
  onClick={() => navigate('/flashcards')}
>
  ← Retour aux paquets
  </Button>

  <div className="flashcard-deck-actions mb-3">
  <Button
    variant="outline-secondary"
    size="sm"
    onClick={openEditDeck}
  >
    ✏️ Modifier le paquet
  </Button>

  <Button
    variant="outline-danger"
    size="sm"
    onClick={handleDeleteDeck}
    disabled={saving}
  >
    🗑️ Supprimer le paquet
  </Button>
</div>

<div className="flashcard-deck-actions mb-3">
  <Button
    variant="primary"
    onClick={() => setShowModal(true)}
  >
    + Ajouter une carte
  </Button>

  {deck.cards && deck.cards.length > 0 && (
    <Button
      variant="success"
      onClick={() => navigate(`/flashcards/${id}/study`)}
    >
      ▶ Réviser
    </Button>
  )}
</div>


      {deck.description && (
        <p className="text-muted">
          {deck.description}
        </p>
      )}

      <hr />

      {!deck.cards || deck.cards.length === 0 ? (
        <p>Aucune carte pour le moment.</p>
      ) : (
        deck.cards.map((card) => (
          <Card key={card.id} className="mb-3 flashcard-item">
            <Card.Body>
  <div className="d-flex justify-content-between align-items-start gap-3">
    <div>
      <strong>{card.question}</strong>
      <p className="mb-0">{card.answer}</p>
    </div>

    <div className="flashcard-item-actions">
  <Button
    variant="outline-secondary"
    size="sm"
    onClick={() => openEditCard(card)}
  >
    ✏️
  </Button>

  <Button
    variant="outline-danger"
    size="sm"
    onClick={() => handleDeleteCard(card.id)}
    disabled={saving}
  >
    🗑️
  </Button>
</div>
  </div>
</Card.Body>
          </Card>
        ))
      )}

<Modal
  show={showEditDeckModal}
  onHide={() => setShowEditDeckModal(false)}
  centered
>
  <Form onSubmit={handleUpdateDeck}>
    <Modal.Header closeButton>
      <Modal.Title>Modifier le paquet</Modal.Title>
    </Modal.Header>

    <Modal.Body>
      <Form.Group className="mb-3">
        <Form.Label>Titre</Form.Label>

        <Form.Control
          value={deckTitle}
          onChange={(e) => setDeckTitle(e.target.value)}
        />
      </Form.Group>

      <Form.Group>
        <Form.Label>Description</Form.Label>

        <Form.Control
          as="textarea"
          rows={3}
          value={deckDescription}
          onChange={(e) => setDeckDescription(e.target.value)}
        />
      </Form.Group>
    </Modal.Body>

    <Modal.Footer>
      <Button
        variant="secondary"
        onClick={() => setShowEditDeckModal(false)}
        disabled={saving}
      >
        Annuler
      </Button>

      <Button
        type="submit"
        variant="primary"
        disabled={saving}
      >
        {saving ? 'Enregistrement...' : 'Enregistrer'}
      </Button>
    </Modal.Footer>
  </Form>
</Modal>

      <Modal
  show={showEditModal}
  onHide={() => setShowEditModal(false)}
  centered
>
  <Form onSubmit={handleUpdateCard}>
    <Modal.Header closeButton>
      <Modal.Title>Modifier la carte</Modal.Title>
    </Modal.Header>

    <Modal.Body>
      <Form.Group className="mb-3">
        <Form.Label>Question</Form.Label>

        <Form.Control
          value={editQuestion}
          onChange={(e) => setEditQuestion(e.target.value)}
        />
      </Form.Group>

      <Form.Group>
        <Form.Label>Réponse</Form.Label>

        <Form.Control
          as="textarea"
          rows={3}
          value={editAnswer}
          onChange={(e) => setEditAnswer(e.target.value)}
        />
      </Form.Group>
    </Modal.Body>

    <Modal.Footer>
      <Button
        variant="secondary"
        onClick={() => setShowEditModal(false)}
        disabled={saving}
      >
        Annuler
      </Button>

      <Button
        type="submit"
        variant="primary"
        disabled={saving}
      >
        {saving ? 'Enregistrement...' : 'Enregistrer'}
      </Button>
    </Modal.Footer>
  </Form>
</Modal>

      <Modal
  show={showModal}
  onHide={() => setShowModal(false)}
  centered
>
  <Form onSubmit={handleCreateCard}>

    <Modal.Header closeButton>
      <Modal.Title>
        Nouvelle carte
      </Modal.Title>
    </Modal.Header>

    <Modal.Body>

      <Form.Group className="mb-3">
        <Form.Label>
          Question
        </Form.Label>

        <Form.Control
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
      </Form.Group>

      <Form.Group>
        <Form.Label>
          Réponse
        </Form.Label>

        <Form.Control
          as="textarea"
          rows={3}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
        />

      </Form.Group>

    </Modal.Body>

    <Modal.Footer>

      <Button
        variant="secondary"
        onClick={() => setShowModal(false)}
      >
        Annuler
      </Button>

      <Button
        type="submit"
        variant="primary"
        disabled={saving}
      >
        {saving ? 'Ajout...' : 'Ajouter'}
      </Button>

    </Modal.Footer>

  </Form>
</Modal>
    </Container>
  )
}
