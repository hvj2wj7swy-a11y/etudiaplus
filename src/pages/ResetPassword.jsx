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
import {
  Link,
  useNavigate,
  useSearchParams
} from 'react-router-dom'
import { authApi } from '../services/api.js'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()

    setError('')
    setSuccess('')

    if (!token) {
      setError('Lien invalide.')
      return
    }

    if (password.length < 8) {
      setError(
        'Le mot de passe doit contenir au moins 8 caractères.'
      )
      return
    }

    if (password !== confirmPassword) {
      setError(
        'Les mots de passe ne correspondent pas.'
      )
      return
    }

    setLoading(true)

    try {

      await authApi.resetPassword(
        token,
        password
      )

      setSuccess(
        'Votre mot de passe a été modifié avec succès.'
      )

      setTimeout(() => {
        navigate('/login')
      }, 2000)

    } catch (err) {

      setError(
        err.message ||
        'Impossible de modifier le mot de passe.'
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
                Nouveau mot de passe
              </h2>

              {success && (
                <Alert variant="success">
                  {success}
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
                    Nouveau mot de passe
                  </Form.Label>

                  <Form.Control
                    required
                    type="password"
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>
                    Confirmer le mot de passe
                  </Form.Label>

                  <Form.Control
                    required
                    type="password"
                    value={confirmPassword}
                    onChange={(e) =>
                      setConfirmPassword(e.target.value)
                    }
                  />
                </Form.Group>

                <Button
                  type="submit"
                  className="w-100"
                  disabled={loading}
                >
                  {loading
                    ? 'Modification...'
                    : 'Modifier le mot de passe'}
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