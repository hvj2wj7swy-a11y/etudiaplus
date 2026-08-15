import React, { useState } from 'react'
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const { login, loading, authNotice, clearAuthNotice } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((previous) => ({ ...previous, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    const result = await login(form)
    if (!result.success) {
      setError(result.message)
      return
    }

    const user = result.user
    const isPaid = user?.role === 'admin' || (user?.subscriptionStatus === 'active' && ['monthly', 'annual'].includes(user?.subscriptionType))
    if (!isPaid) {
      navigate('/subscription', { replace: true })
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
              <h2 className="mb-4">Connexion</h2>
              {authNotice && (
                <Alert variant="warning" dismissible onClose={clearAuthNotice}>
                  {authNotice}
                </Alert>
              )}
              {error && <Alert variant="danger">{error}</Alert>}

              <Form onSubmit={handleSubmit}>
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

                <Form.Group className="mb-4">
  <Form.Label>Mot de passe</Form.Label>

  <Form.Control
    required
    type="password"
    name="password"
    value={form.password}
    onChange={handleChange}
    placeholder="••••••••"
  />

  <div className="text-end mt-2">
    <Link to="/forgot-password">
      Mot de passe oublié ?
    </Link>
  </div>
</Form.Group>

                <Button type="submit" className="w-100" disabled={loading}>
                  {loading ? 'Connexion...' : 'Se connecter'}
                </Button>
              </Form>

              <p className="text-muted mt-3 mb-0">
                Pas encore de compte ? <Link to="/register">Créer un compte</Link>
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}
