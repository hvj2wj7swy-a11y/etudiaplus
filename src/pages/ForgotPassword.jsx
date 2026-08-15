import React, { useState } from 'react'
import {
  Alert,
  Button,
  Card,
  Col,
  Container,
  Form,
  Row
} from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { authApi } from '../services/api.js'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()

    setError('')
    setMessage('')
    setLoading(true)

    try {
      const response =
        await authApi.forgotPassword(email)

      setMessage(
        response?.message ||
          'Si un compte existe avec cette adresse, un lien de réinitialisation sera envoyé.'
      )
    } catch (err) {
      setError(
        err.message ||
          'Impossible de traiter la demande.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={6} lg={5}>
          <Card className="shadow-sm">
            <Card.Body className="p-4">
              <h2 className="mb-3">
                Mot de passe oublié
              </h2>

              <p className="text-muted">
                Entre l’adresse courriel associée à
                ton compte. Nous t’enverrons un lien
                pour choisir un nouveau mot de passe.
              </p>

              {message && (
                <Alert variant="success">
                  {message}
                </Alert>
              )}

              {error && (
                <Alert variant="danger">
                  {error}
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Adresse courriel
                  </Form.Label>

                  <Form.Control
                    required
                    type="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    placeholder="nom@domaine.com"
                  />
                </Form.Group>

                <Button
                  type="submit"
                  className="w-100"
                  disabled={loading}
                >
                  {loading
                    ? 'Envoi...'
                    : 'Envoyer le lien'}
                </Button>
              </Form>

              <div className="mt-3">
                <Link to="/login">
                  Retour à la connexion
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}