import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Container, Form, Modal } from 'react-bootstrap'
import { flashcardAPI } from '../services/api.js'
import './Flashcards.css'

export default function Flashcards() {
  const navigate = useNavigate()
  const [decks, setDecks] = useState([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const token = window.localStorage.getItem('edudia_auth_token')

  const loadDecks = async () => {
    if (!token) return

    try {
      const response = await flashcardAPI.getDecks(token)
      setDecks(response?.data?.decks || [])
    } catch (err) {
      console.error('Erreur chargement flashcards:', err)
      setError(err.message || 'Impossible de charger les flashcards.')
    }
  }

  useEffect(() => {
    loadDecks()
  }, [])

  const openCreateModal = () => {
    setTitle('')
    setDescription('')
    setError('')
    setShowCreateModal(true)
  }

  const closeCreateModal = () => {
    if (isSaving) return
    setShowCreateModal(false)
  }

  const handleCreateDeck = async (event) => {
    event.preventDefault()

    if (!title.trim()) {
      setError('Entre un titre pour le paquet.')
      return
    }

    try {
      setIsSaving(true)
      setError('')

      await flashcardAPI.createDeck(token, {
        title: title.trim(),
        description: description.trim()
      })

      setShowCreateModal(false)
      setTitle('')
      setDescription('')

      await loadDecks()
    } catch (err) {
      console.error('Erreur création paquet:', err)
      setError(err.message || 'Impossible de créer le paquet.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Container className="flashcards-page py-4">
      <div className="flashcards-header">
        <div>
          <h1>Flashcards</h1>
          <p className="text-muted mb-0">
            Crée tes cartes de révision et suis ta progression.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={openCreateModal}
        >
          + Nouveau paquet
        </Button>
      </div>

      {error && !showCreateModal && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      {decks.length === 0 ? (
        <div className="flashcards-empty">
          <Card>
            <Card.Body>
              <h4>Aucun paquet pour le moment</h4>

              <p className="text-muted">
                Crée ton premier paquet de flashcards pour commencer à réviser.
              </p>

              <Button
                variant="primary"
                onClick={openCreateModal}
              >
                Créer mon premier paquet
              </Button>
            </Card.Body>
          </Card>
        </div>
      ) : (
        <div className="row g-3">
          {decks.map((deck) => (
            <div
              className="col-12 col-md-6 col-lg-4"
              key={deck.id}
            >
              <Card
  className="h-100 flashcard-deck-card"
  onClick={() => {
    console.log("Clic paquet :", deck.id)
    navigate(`/flashcards/${deck.id}`)
  }}
  style={{ cursor: 'pointer' }}
>

                <Card.Body>
                  <h5>{deck.title}</h5>

                  {deck.description && (
                    <p className="text-muted">
                      {deck.description}
                    </p>
                  )}

                  <p className="mb-0">
                    {deck.card_count || 0} carte(s)
                  </p>
                </Card.Body>
              </Card>
            </div>
          ))}
        </div>
      )}

      <Modal
        show={showCreateModal}
        onHide={closeCreateModal}
        centered
      >
        <Form onSubmit={handleCreateDeck}>
          <Modal.Header closeButton>
            <Modal.Title>
              Nouveau paquet
            </Modal.Title>
          </Modal.Header>

          <Modal.Body>
            {error && (
              <div className="alert alert-danger">
                {error}
              </div>
            )}

            <Form.Group className="mb-3">
              <Form.Label>
                Titre
              </Form.Label>

              <Form.Control
                type="text"
                value={title}
                onChange={(event) =>
                  setTitle(event.target.value)
                }
                placeholder="Ex. Psychologie — Chapitre 3"
                autoFocus
              />
            </Form.Group>

            <Form.Group>
              <Form.Label>
                Description
              </Form.Label>

              <Form.Control
                as="textarea"
                rows={3}
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                placeholder="Optionnel"
              />
            </Form.Group>
          </Modal.Body>

          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={closeCreateModal}
              disabled={isSaving}
            >
              Annuler
            </Button>

            <Button
              type="submit"
              variant="primary"
              disabled={isSaving}
            >
              {isSaving
                ? 'Création...'
                : 'Créer le paquet'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  )
}