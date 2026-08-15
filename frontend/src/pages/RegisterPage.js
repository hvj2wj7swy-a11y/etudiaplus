/**
 * Page d'inscription
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Form, Button, Alert } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    school: '',
    program: '',
    session: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
      setError('Tous les champs requis doivent être remplis');
      setLoading(false);
      return;
    }

    const result = await register(formData);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message);
    }
    
    setLoading(false);
  };

  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', paddingTop: '20px' }}>
      <div style={{ width: '100%', maxWidth: '500px', paddingBottom: '20px' }}>
        <h1 className="text-center mb-4">📚 Étudia+</h1>
        <h2 className="text-center mb-4">Inscription</h2>

        {error && <Alert variant="danger">{error}</Alert>}

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Prénom</Form.Label>
            <Form.Control
              type="text"
              name="firstName"
              placeholder="Entrez votre prénom"
              value={formData.firstName}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Nom</Form.Label>
            <Form.Control
              type="text"
              name="lastName"
              placeholder="Entrez votre nom"
              value={formData.lastName}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              name="email"
              placeholder="Entrez votre email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Mot de passe</Form.Label>
            <Form.Control
              type="password"
              name="password"
              placeholder="Entrez un mot de passe"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Établissement scolaire</Form.Label>
            <Form.Control
              type="text"
              name="school"
              placeholder="Ex: Université de Montréal"
              value={formData.school}
              onChange={handleChange}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Programme d'études</Form.Label>
            <Form.Control
              type="text"
              name="program"
              placeholder="Ex: Informatique"
              value={formData.program}
              onChange={handleChange}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Session</Form.Label>
            <Form.Select name="session" value={formData.session} onChange={handleChange}>
              <option value="">Sélectionnez une session</option>
              <option value="Automne 2024">Automne 2024</option>
              <option value="Hiver 2025">Hiver 2025</option>
              <option value="Été 2025">Été 2025</option>
            </Form.Select>
          </Form.Group>

          <Button variant="primary" type="submit" className="w-100" disabled={loading}>
            {loading ? 'Inscription...' : 'S\'inscrire'}
          </Button>
        </Form>

        <p className="text-center mt-3">
          Vous avez déjà un compte? <Link to="/login">Connectez-vous</Link>
        </p>
      </div>
    </Container>
  );
};

export default RegisterPage;
