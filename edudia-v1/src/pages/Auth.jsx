import React, { useState } from 'react'
import { Container, Row, Col, Form, Button, Alert } from 'react-bootstrap'
import { useAuth } from '../context/AuthContext.jsx'

export default function Auth() {
  const [isRegister, setIsRegister] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [message, setMessage] = useState('')
  const { login, register } = useAuth()

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (isRegister) {
      register(form)
      setMessage('Compte créé (données locales).')
    } else {
      login(form)
      setMessage('Connexion réussie (données locales).')
    }
  }

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={6}>
          <div className="p-4 bg-white rounded shadow-sm">
            <h2 className="mb-4">{isRegister ? 'Inscription' : 'Connexion'}</h2>
            {message && <Alert variant="success">{message}</Alert>}
            <Form onSubmit={handleSubmit}>
              {isRegister && (
                <Form.Group className="mb-3">
                  <Form.Label>Nom complet</Form.Label>
                  <Form.Control name="name" value={form.name} onChange={handleChange} placeholder="Entrez votre nom" />
                </Form.Group>
              )}
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control name="email" type="email" value={form.email} onChange={handleChange} placeholder="Entrez votre email" />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Mot de passe</Form.Label>
                <Form.Control name="password" type="password" value={form.password} onChange={handleChange} placeholder="Entrez votre mot de passe" />
              </Form.Group>
              <Button type="submit" className="me-2">{isRegister ? 'S\'inscrire' : 'Se connecter'}</Button>
              <Button variant="link" onClick={() => { setIsRegister(!isRegister); setMessage('') }}>
                {isRegister ? 'J\'ai déjà un compte' : 'Créer un compte'}
              </Button>
            </Form>
          </div>
        </Col>
      </Row>
    </Container>
  )
}
