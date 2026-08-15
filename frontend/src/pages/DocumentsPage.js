/**
 * Page des documents
 */

import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { documentAPI } from '../services/api';

const DocumentsPage = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [program, setProgram] = useState('');

  useEffect(() => {
    fetchDocuments();
  }, [search, program]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await documentAPI.getAllDocuments(
        { status: 'approved', search, program },
        20,
        0
      );
      setDocuments(response.data.data);
    } catch (err) {
      setError('Erreur lors du chargement des documents');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="mt-4">
      <h1 className="mb-4">📚 Bibliothèque de documents</h1>

      {/* Filtres */}
      <Row className="mb-4">
        <Col md={6}>
          <Form.Control
            type="text"
            placeholder="Rechercher un document..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Col>
        <Col md={6}>
          <Form.Select value={program} onChange={(e) => setProgram(e.target.value)}>
            <option value="">Tous les programmes</option>
            <option value="Informatique">Informatique</option>
            <option value="Génie">Génie</option>
            <option value="Sciences">Sciences</option>
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
          {documents.length > 0 ? (
            documents.map((doc) => (
              <Col md={6} lg={4} key={doc.id} className="mb-4">
                <Card>
                  <Card.Body>
                    <Card.Title>{doc.title}</Card.Title>
                    <Card.Text className="text-muted small">
                      {doc.program} • {doc.course_code}
                    </Card.Text>
                    <Card.Text className="small">
                      Par: <strong>{doc.first_name} {doc.last_name}</strong>
                    </Card.Text>
                    <div className="mb-2">
                      <span className="badge bg-warning">{doc.average_rating?.toFixed(1)} ⭐</span>
                      <span className="badge bg-info ms-2">{doc.download_count} téléchargements</span>
                    </div>
                    <Link to={`/documents/${doc.id}`}>
                      <Button variant="primary" size="sm" className="w-100">
                        Voir le document
                      </Button>
                    </Link>
                  </Card.Body>
                </Card>
              </Col>
            ))
          ) : (
            <Col xs={12}>
              <Alert variant="info">Aucun document trouvé</Alert>
            </Col>
          )}
        </Row>
      )}
    </Container>
  );
};

export default DocumentsPage;
