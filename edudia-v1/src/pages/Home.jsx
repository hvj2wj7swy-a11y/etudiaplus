import React from 'react'
import { Container, Row, Col, Button } from 'react-bootstrap'
import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <Container className="py-5">
      <Row className="align-items-center">
        <Col md={6}>
          <h1 className="display-5">Bienvenue sur Étudia+</h1>
          <p className="lead">Une application étudiante simple pour partager des ressources et poser des questions.</p>
          <div className="mb-4">
            <Link to="/documents"><Button variant="primary" className="me-2">Voir les documents</Button></Link>
            <Link to="/forum"><Button variant="outline-primary">Aller au forum</Button></Link>
          </div>
          <div className="d-flex gap-3 flex-wrap">
            <div className="badge bg-primary text-white p-3 rounded-3">Recherche de documents</div>
            <div className="badge bg-success text-white p-3 rounded-3">Forum d'entraide</div>
            <div className="badge bg-info text-dark p-3 rounded-3">Interface simple</div>
          </div>
        </Col>
      </Row>
    </Container>
  )
}
