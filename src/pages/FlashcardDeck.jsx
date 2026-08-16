import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Container, Card, Button, Modal, Form } from 'react-bootstrap'
import { flashcardAPI } from '../services/api.js'

export default function FlashcardDeck() {
  const { id } = useParams()

  const navigate = useNavigate()

  const [deck, setDeck] = useState(null)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
const [question, setQuestion] = useState('')
const [answer, setAnswer] = useState('')
const [saving, setSaving] = useState(false)

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
      <h1>{deck.title}</h1>
      <Button
  variant="primary"
  className="mb-3"
  onClick={() => setShowModal(true)}
>
  + Ajouter une carte
</Button>


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
          <Card key={card.id} className="mb-3">
            <Card.Body>
              <strong>{card.question}</strong>
              <p>{card.answer}</p>
            </Card.Body>
          </Card>
        ))
      )}
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
