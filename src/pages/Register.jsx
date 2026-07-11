import React, { useState } from 'react'
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const PROGRAMMES = [
  'Techniques de l\'informatique',
  'Sciences humaines',
  'Sciences de la nature',
  'Soins infirmiers',
  'Administration',
  'Arts, lettres et communication'
]

export default function Register() {
  const [form, setForm] = useState({ nom: '', email: '', password: '', programme: PROGRAMMES[0] })
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [error, setError] = useState('')
  const { register, loading, authNotice, clearAuthNotice } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((previous) => ({ ...previous, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!acceptedTerms) {
      setError('Vous devez accepter les Conditions d\'utilisation et la Politique de confidentialité pour continuer.')
      return
    }

    const result = await register(form)
    if (!result.success) {
      setError(result.message)
      return
    }

    const user = result.user
    const isPaid = user?.role === 'admin' || (user?.subscriptionStatus === 'active' && ['monthly', 'annual'].includes(user?.subscriptionType))
    if (!isPaid) {
      navigate('/subscription', { replace: true, state: { welcome: true } })
      return
    }

    const destination = location.state?.from || '/tools'
    navigate(destination, { replace: true })
  }

  return (
    <Container className="py-5 auth-page">
      <Row className="justify-content-center">
        <Col md={6} lg={5}>
          <Card className="shadow-sm auth-card">
            <Card.Body>
              <h2 className="mb-4">Inscription</h2>
              {authNotice && (
                <Alert variant="warning" dismissible onClose={clearAuthNotice}>
                  {authNotice}
                </Alert>
              )}
              {error && <Alert variant="danger">{error}</Alert>}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Nom complet</Form.Label>
                  <Form.Control
                    required
                    name="nom"
                    value={form.nom}
                    onChange={handleChange}
                    placeholder="Ex: Sara Dupont"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Courriel</Form.Label>
                  <Form.Control
                    required
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="nom@domaine.com"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Programme d'étude</Form.Label>
                  <Form.Select required name="programme" value={form.programme} onChange={handleChange}>
                    {PROGRAMMES.map((programme) => (
                      <option key={programme} value={programme}>{programme}</option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>Mot de passe</Form.Label>
                  <Form.Control
                    required
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Choisissez un mot de passe"
                  />
                </Form.Group>

                <Card className="border-0 bg-light-subtle mb-4">
                  <Card.Body className="py-3">
                    <Form.Check
                      id="acceptedTerms"
                      checked={acceptedTerms}
                      onChange={(event) => setAcceptedTerms(event.target.checked)}
                      label={
                        <span>
                          J'ai lu et j'accepte les{' '}
                          <Link to="/conditions">Conditions d'utilisation</Link>
                          {' '}et la{' '}
                          <Link to="/confidentialite">Politique de confidentialité</Link>
                          .
                        </span>
                      }
                    />
                  </Card.Body>
                </Card>

                <Button type="submit" className="w-100" disabled={!acceptedTerms || loading}>
                  {loading ? 'Creation du compte...' : 'Créer mon compte'}
                </Button>
              </Form>

              <p className="text-muted mt-3 mb-0">
                Déjà inscrit ? <Link to="/login">Se connecter</Link>
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}
