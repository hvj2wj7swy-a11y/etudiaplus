import React, { useState } from 'react'
import { Container, Row, Col, Card, Button, Alert } from 'react-bootstrap'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const plans = [
  {
    id: 'trial',
    label: 'Essai gratuit',
    price: '30 jours',
    description: 'Active automatiquement a la creation du compte. Ensuite, choisissez une offre payante.',
    badge: 'Inclus'
  },
  {
    id: 'monthly',
    label: 'Mensuel',
    price: '9,99 $ CAD / mois',
    description: 'Renouvellement automatique. Resiliation possible a tout moment.',
    badge: ''
  },
  {
    id: 'annual',
    label: 'Annuel',
    price: '90 $ CAD / an',
    description: 'Renouvellement automatique. Resiliation possible a tout moment.',
    badge: 'Economisez environ 25 %'
  }
]

export default function Subscription() {
  const [selectedPlan, setSelectedPlan] = useState('monthly')
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'admin') return <Navigate to="/tools" replace />
  if (user.subscriptionStatus === 'active' && ['monthly', 'annual'].includes(user.subscriptionType)) {
    return <Navigate to="/documents" replace />
  }

  const denied = Boolean(location.state?.denied)
  const welcome = Boolean(location.state?.welcome)

  const proceedToPayment = () => {
    navigate(`/payment?plan=${selectedPlan}`)
  }

  const trialEndDate = user?.trialEnd ? new Date(user.trialEnd).toLocaleDateString('fr-CA') : ''

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col lg={8}>
          <Card className="shadow-sm">
            <Card.Body>
              <h2 className="mb-3">Abonnement</h2>

              {denied && (
                <Alert variant="warning">
                  Accès refusé : votre abonnement est inactif. Choisissez une offre pour continuer.
                </Alert>
              )}

              {welcome && (
                <Alert variant="success">
                  Compte cree avec succes. Votre essai gratuit de 30 jours est actif.
                </Alert>
              )}

              {trialEndDate && (
                <Alert variant="info">
                  Votre essai se termine le {trialEndDate}. Pour garder l acces Premium ensuite, choisissez un plan payant.
                </Alert>
              )}

              <Row className="g-3 mt-1">
                {plans.map((plan) => (
                  <Col md={6} key={plan.id}>
                    <Card
                      className={`h-100 ${selectedPlan === plan.id ? 'border-primary' : ''} ${plan.id === 'trial' ? 'bg-light' : ''}`}
                      role={plan.id === 'trial' ? undefined : 'button'}
                      onClick={() => {
                        if (plan.id !== 'trial') setSelectedPlan(plan.id)
                      }}
                    >
                      <Card.Body>
                        <Card.Title className="d-flex justify-content-between align-items-center">
                          <span>{plan.label}</span>
                          {plan.badge ? <span className="badge bg-primary-subtle text-primary-emphasis">{plan.badge}</span> : null}
                        </Card.Title>
                        <Card.Subtitle className="mb-2 text-primary">{plan.price}</Card.Subtitle>
                        <Card.Text>{plan.description}</Card.Text>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>

              <div className="d-flex justify-content-end mt-4">
                <Button onClick={proceedToPayment}>Continuer vers le paiement</Button>
              </div>

              <p className="text-muted small mt-3 mb-0">Taxes applicables en sus.</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}
