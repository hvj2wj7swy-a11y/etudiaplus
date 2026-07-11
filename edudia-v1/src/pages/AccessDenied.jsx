import React from 'react'
import { Container, Row, Col, Card, Button } from 'react-bootstrap'
import { Link, useLocation } from 'react-router-dom'

export default function AccessDenied() {
  const location = useLocation()
  const deniedReason = location.state?.deniedReason
  const isAdminDenied = deniedReason === 'admin'

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={7} lg={6}>
          <Card className="shadow-sm">
            <Card.Body>
              <h2 className="mb-3">Accès refusé</h2>
              {isAdminDenied ? (
                <>
                  <p>Cette section est réservée aux administrateurs.</p>
                  <Button as={Link} to="/tools">Retour à l'accueil</Button>
                </>
              ) : (
                <>
                  <p>Votre abonnement est inactif. Activez un abonnement pour accéder aux fonctionnalités privées.</p>
                  <Button as={Link} to="/subscription">Aller à la page Abonnement</Button>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}
