import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, Card, Container, ProgressBar } from 'react-bootstrap'
import { flashcardAPI } from '../services/api.js'

export default function FlashcardStudy() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [deck, setDeck] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [knownCards, setKnownCards] = useState(0)
  const [unknownCards, setUnknownCards] = useState(0)
  const [finished, setFinished] = useState(false)
  const [error, setError] = useState('')

  const token = window.localStorage.getItem('edudia_auth_token')

  useEffect(() => {
    const loadDeck = async () => {
      try {
        const response = await flashcardAPI.getDeck(token, id)
        setDeck(response?.data?.deck)
      } catch (err) {
        console.error('Erreur chargement révision :', err)
        setError('Impossible de charger les flashcards.')
      }
    }

    loadDeck()
  }, [id, token])

  if (error) {
    return (
      <Container className="py-4">
        <div className="alert alert-danger">{error}</div>
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

  const cards = deck.cards || []

  if (cards.length === 0) {
    return (
      <Container className="py-4">
        <Button
          variant="outline-secondary"
          className="mb-3"
          onClick={() => navigate(`/flashcards/${id}`)}
        >
          ← Retour au paquet
        </Button>

        <p>Aucune carte à réviser.</p>
      </Container>
    )
  }

  const currentCard = cards[currentIndex]

  const answerCard = (known) => {
    if (known) {
      setKnownCards((value) => value + 1)
    } else {
      setUnknownCards((value) => value + 1)
    }

    if (currentIndex >= cards.length - 1) {
      setFinished(true)
      return
    }

    setCurrentIndex((value) => value + 1)
    setShowAnswer(false)
  }

  const restartStudy = () => {
    setCurrentIndex(0)
    setShowAnswer(false)
    setKnownCards(0)
    setUnknownCards(0)
    setFinished(false)
  }

  if (finished) {
    return (
      <Container className="py-4">
        <Card className="shadow-sm">
          <Card.Body className="text-center p-4">
            <h2>Révision terminée 🎉</h2>

            <p className="mt-4">
              Tu connais <strong>{knownCards}</strong> carte(s) sur{' '}
              <strong>{cards.length}</strong>.
            </p>

            <p>
              À revoir : <strong>{unknownCards}</strong>
            </p>

            <div className="d-flex justify-content-center gap-2 flex-wrap mt-4">
              <Button onClick={restartStudy}>
                Recommencer
              </Button>

              <Button
                variant="outline-secondary"
                onClick={() => navigate(`/flashcards/${id}`)}
              >
                Retour au paquet
              </Button>
            </div>
          </Card.Body>
        </Card>
      </Container>
    )
  }

  const progress = ((currentIndex + 1) / cards.length) * 100

  return (
    <Container className="py-4">
      <Button
        variant="outline-secondary"
        className="mb-3"
        onClick={() => navigate(`/flashcards/${id}`)}
      >
        ← Quitter la révision
      </Button>

      <h1>{deck.title}</h1>

      <p className="text-muted">
        Carte {currentIndex + 1} sur {cards.length}
      </p>

      <ProgressBar
        now={progress}
        className="mb-4"
      />

      <Card className="shadow-sm">
        <Card.Body className="text-center p-4">
          <h5 className="text-muted mb-3">
            Question
          </h5>

          <h2>{currentCard.question}</h2>

          {!showAnswer ? (
            <Button
              className="mt-4"
              onClick={() => setShowAnswer(true)}
            >
              Voir la réponse
            </Button>
          ) : (
            <>
              <hr className="my-4" />

              <h5 className="text-muted">
                Réponse
              </h5>

              <h3>{currentCard.answer}</h3>

              <div className="d-flex justify-content-center gap-3 flex-wrap mt-4">
                <Button
                  variant="danger"
                  onClick={() => answerCard(false)}
                >
                  ✕ Je ne sais pas
                </Button>

                <Button
                  variant="success"
                  onClick={() => answerCard(true)}
                >
                  ✓ Je sais
                </Button>
              </div>
            </>
          )}
        </Card.Body>
      </Card>
    </Container>
  )
}