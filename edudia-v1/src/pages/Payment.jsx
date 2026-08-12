import React from 'react'
import { Container, Row, Col, Card, Button, Alert } from 'react-bootstrap'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { subscriptionApi } from '../services/api'

const PLAN_DETAILS = {
  monthly: { label: 'Mensuel', price: '9,99 $ CAD / mois' },
  annual: { label: 'Annuel', price: '90 $ CAD / an' }
}

export default function Payment() {
  const [searchParams] = useSearchParams()
  const plan = searchParams.get('plan') === 'annual' ? 'annual' : 'monthly'
  const { user } = useAuth()

  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'admin') return <Navigate to="/tools" replace />
  if (user.subscriptionStatus === 'active' && ['monthly', 'annual'].includes(user.subscriptionType)) {
    return <Navigate to="/documents" replace />
  }

  const confirmPayment = async () => {
  try {
    const token =
      window.localStorage.getItem('edudia_auth_token')

    const result =
      await subscriptionApi.createCheckoutSession(
        token,
        { plan }
      )

    if (result?.data?.url) {
      window.location.href = result.data.url
      return
    }

    console.error(
      'Aucune URL Stripe reçue :',
      result
    )
  } catch (error) {
    console.error(
      'Erreur paiement Stripe :',
      error
    )
  }
}

  const selectedPlan = PLAN_DETAILS[plan]

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col lg={7}>
          <Card className="shadow-sm">
            <Card.Body>
              <h2 className="mb-3">Paiement simulé</h2>
              <Alert variant="info">Mode de preparation Stripe: tant que Stripe n est pas configure, le paiement est simule.</Alert>

              <p><strong>Offre selectionnee :</strong> {selectedPlan.label}</p>
              <p><strong>Prix :</strong> {selectedPlan.price}</p>
              <p className="text-muted">Cliquez sur "Valider le paiement" pour activer votre abonnement.</p>

              <div className="d-flex gap-2 justify-content-end mt-4">
                <Button as={Link} to="/subscription" variant="outline-secondary">Retour</Button>
                <Button onClick={confirmPayment}>Valider le paiement</Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}
