/**
 * Page du forum
 */

import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { forumAPI } from '../services/api';

const ForumPage = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    fetchQuestions();
  }, [search, category]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const response = await forumAPI.getQuestions(
        { search, category, isResolved: false },
        20,
        0
      );
      setQuestions(response.data.data);
    } catch (err) {
      setError('Erreur lors du chargement des questions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="mt-4">
      <Row className="mb-4">
        <Col md={8}>
          <h1>💬 Forum étudiant</h1>
        </Col>
        <Col md={4} className="text-end">
          <Link to="/forum/new">
            <Button variant="success">Poser une question</Button>
          </Link>
        </Col>
      </Row>

      {/* Filtres */}
      <Row className="mb-4">
        <Col md={6}>
          <Form.Control
            type="text"
            placeholder="Rechercher une question..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Col>
        <Col md={6}>
          <Form.Select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">Toutes les catégories</option>
            <option value="Mathématiques">Mathématiques</option>
            <option value="Informatique">Informatique</option>
            <option value="Sciences">Sciences</option>
            <option value="Général">Général</option>
          </Form.Select>
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}

      {loading ? (
        <div className="text-center">
          <Spinner animation="border" />
        </div>
      ) : (
        <Row>
          <Col xs={12}>
            {questions.length > 0 ? (
              questions.map((q) => (
                <Card key={q.id} className="mb-3">
                  <Card.Body>
                    <Link to={`/forum/questions/${q.id}`} className="text-decoration-none">
                      <Card.Title>{q.title}</Card.Title>
                    </Link>
                    <Card.Text className="text-muted">
                      {q.content.substring(0, 150)}...
                    </Card.Text>
                    <div className="d-flex justify-content-between align-items-center">
                      <small>
                        Par <strong>{q.first_name} {q.last_name}</strong> • 
                        {' '}<span className="badge bg-secondary">{q.category}</span>
                      </small>
                      <small className="text-muted">
                        {q.answer_count} réponses • {q.view_count} vues
                      </small>
                    </div>
                  </Card.Body>
                </Card>
              ))
            ) : (
              <Alert variant="info">Aucune question trouvée</Alert>
            )}
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default ForumPage;
