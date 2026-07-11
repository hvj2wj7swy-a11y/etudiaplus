/**
 * Page du tableau de bord
 */

import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { dashboardAPI, userAPI } from '../services/api';

const DashboardPage = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await dashboardAPI.getDashboard();
      setDashboardData(response.data.data);
    } catch (err) {
      setError('Erreur lors du chargement du tableau de bord');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Container className="mt-5"><Spinner animation="border" /></Container>;
  if (error) return <Container className="mt-5"><Alert variant="danger">{error}</Alert></Container>;

  return (
    <Container className="mt-4">
      <h1 className="mb-4">📊 Tableau de bord</h1>

      <Row className="mb-4">
        <Col md={6}>
          <Card className="h-100 border-primary">
            <Card.Body>
              <Card.Title>🔎 Rechercher des documents</Card.Title>
              <Card.Text>
                Accédez à la bibliothèque et recherchez des documents par titre, programme ou matière.
              </Card.Text>
              <Link to="/documents">
                <Button variant="primary">Voir les documents</Button>
              </Link>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="h-100 border-success">
            <Card.Body>
              <Card.Title>💬 Forum étudiant</Card.Title>
              <Card.Text>
                Posez des questions, consultez les réponses et participez à la communauté.
              </Card.Text>
              <Link to="/forum">
                <Button variant="success">Voir le forum</Button>
              </Link>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Statistiques */}
      <Row className="mb-4">
        <Col md={6}>
          <Card>
            <Card.Body className="text-center">
              <h3>{dashboardData?.userStatistics?.documents_uploaded || 0}</h3>
              <p>Documents</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card>
            <Card.Body className="text-center">
              <h3>{dashboardData?.userStatistics?.questions_asked || 0}</h3>
              <p>Questions</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Documents récents */}
      <Row className="mb-4">
        <Col md={6}>
          <h3>📄 Documents récents</h3>
          {dashboardData?.recentDocuments?.length > 0 ? (
            <div>
              {dashboardData.recentDocuments.map((doc) => (
                <Card key={doc.id} className="mb-2">
                  <Card.Body>
                    <Card.Title>{doc.title}</Card.Title>
                    <Card.Text className="text-muted small">{doc.program} - {doc.course_code}</Card.Text>
                    <Link to={`/documents/${doc.id}`}>
                      <Button size="sm" variant="outline-primary">Voir</Button>
                    </Link>
                  </Card.Body>
                </Card>
              ))}
            </div>
          ) : (
            <p>Aucun document disponible</p>
          )}
        </Col>

        {/* Questions récentes */}
        <Col md={6}>
          <h3>💬 Questions récentes</h3>
          {dashboardData?.recentQuestions?.length > 0 ? (
            <div>
              {dashboardData.recentQuestions.map((q) => (
                <Card key={q.id} className="mb-2">
                  <Card.Body>
                    <Card.Title>{q.title}</Card.Title>
                    <Card.Text className="text-muted small">{q.answer_count} réponses</Card.Text>
                    <Link to={`/forum/questions/${q.id}`}>
                      <Button size="sm" variant="outline-primary">Voir</Button>
                    </Link>
                  </Card.Body>
                </Card>
              ))}
            </div>
          ) : (
            <p>Aucune question disponible</p>
          )}
        </Col>
      </Row>

      {/* Meilleurs contributeurs */}
      <Row>
        <Col md={12}>
          <h3>⭐ Meilleurs contributeurs</h3>
          {dashboardData?.topContributors?.length > 0 ? (
            <div className="d-flex gap-2 flex-wrap">
              {dashboardData.topContributors.map((contributor) => (
                <Card key={contributor.id} style={{ width: '180px' }}>
                  <Card.Body className="text-center">
                    <Card.Title>{contributor.first_name} {contributor.last_name}</Card.Title>
                    <p className="mb-0"><strong>{contributor.points}</strong> points</p>
                    <small className="text-muted">{contributor.documents_count} documents</small>
                  </Card.Body>
                </Card>
              ))}
            </div>
          ) : (
            <p>Aucun contributeur</p>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default DashboardPage;
