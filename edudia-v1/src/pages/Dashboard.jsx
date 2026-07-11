import React from 'react'
import { Container, Row, Col, Card } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import './Dashboard.css'

export default function Dashboard() {
  return (
    <Container className="py-4 dashboard-page">
      <h1>Tableau de bord</h1>
      <Row className="g-4 mt-3">
        <Col md={6} lg={4} className="d-flex">
          <Card as={Link} to="/notes" className="h-100 w-100 dashboard-link-card text-decoration-none">
            <Card.Body className="d-flex flex-column justify-content-center">
              <Card.Title className="mb-2">Notes</Card.Title>
              <Card.Text className="mb-0">Ouvrez votre cahier numerique, organisez vos cours et annotez chaque page.</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} lg={4} className="d-flex">
          <Card as={Link} to="/documents" className="h-100 w-100 dashboard-link-card text-decoration-none">
            <Card.Body className="d-flex flex-column justify-content-center">
              <Card.Title className="mb-2">Documents</Card.Title>
              <Card.Text className="mb-0">Voyez les documents déposés par les autres étudiants</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} lg={4} className="d-flex">
          <Card as={Link} to="/forum" className="h-100 w-100 dashboard-link-card text-decoration-none">
            <Card.Body className="d-flex flex-column justify-content-center">
              <Card.Title className="mb-2">Forum</Card.Title>
              <Card.Text className="mb-0">Chattez avec les gens de votre progamme</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} lg={4} className="d-flex">
          <Card as={Link} to="/agenda" className="h-100 w-100 dashboard-link-card text-decoration-none">
            <Card.Body className="d-flex flex-column justify-content-center">
              <Card.Title className="mb-2">Agenda</Card.Title>
              <Card.Text className="mb-0">Voir mes cours, examens et devoirs à venir</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

    </Container>
  )
}
