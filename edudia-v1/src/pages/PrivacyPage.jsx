import React from 'react'
import { Card, Col, Container, Row } from 'react-bootstrap'
import './Legal.css'

export default function PrivacyPage() {
  return (
    <Container className="py-4 legal-page">
      <section className="legal-hero mb-4">
        <span className="legal-eyebrow">Étudia+ - Protection des données</span>
        <h1>Politique de confidentialité</h1>
        <p>
          Cette politique explique quelles données sont traitées dans Étudia+, pourquoi elles sont utilisées et quels
          droits disposent les utilisateurs concernant leurs informations personnelles et leurs contenus publiés.
        </p>
      </section>

      <Row className="g-4 mb-4">
        <Col md={6}>
          <Card className="legal-section-card">
            <Card.Body>
              <h2>Données collectées</h2>
              <ul>
                <li>Nom</li>
                <li>Email</li>
                <li>Programme d'études</li>
                <li>Documents publiés</li>
                <li>Messages du forum</li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="legal-section-card">
            <Card.Body>
              <h2>Utilisation des données</h2>
              <ul>
                <li>Permettre l'accès au compte et aux espaces privés de la plateforme.</li>
                <li>Associer les documents et messages à leurs auteurs.</li>
                <li>Organiser les contenus selon le programme d'études et les droits d'accès.</li>
                <li>Améliorer la modération, la sécurité et la qualité du service.</li>
              </ul>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="legal-section-card">
            <Card.Body>
              <h2>Conservation des données</h2>
              <p>
                Les données sont conservées pendant la durée nécessaire au fonctionnement du service, à la gestion du compte,
                à la modération des contenus et au respect des obligations applicables. Certaines informations peuvent être
                supprimées ou anonymisées lorsqu'elles ne sont plus nécessaires.
              </p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="legal-section-card">
            <Card.Body>
              <h2>Protection des informations</h2>
              <p>
                Étudia+ met en place des mesures raisonnables de protection pour limiter l'accès non autorisé, la perte,
                l'altération ou la diffusion non voulue des données traitées par la plateforme.
              </p>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="legal-section-card">
            <Card.Body>
              <h2>Droits des utilisateurs</h2>
              <ul>
                <li>Consulter les informations liées à leur compte.</li>
                <li>Demander la correction d'une donnée inexacte.</li>
                <li>Demander des précisions sur l'utilisation de leurs informations.</li>
                <li>Demander la suppression de certains contenus ou du compte, selon les limites applicables.</li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="legal-section-card">
            <Card.Body>
              <h2>Suppression du compte</h2>
              <p>
                Un utilisateur peut demander la suppression de son compte et des données associées. Certaines informations
                peuvent toutefois être conservées temporairement si cela est nécessaire pour la sécurité, la modération,
                ou le respect d'exigences légales et administratives.
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col lg={6}>
          <Card className="legal-contact-card">
            <Card.Body>
              <h2>Contact confidentialité</h2>
              <p>Pour toute demande relative à la confidentialité ou à vos données personnelles :</p>
              <ul>
                <li>Courriel : <a href="mailto:confidentialite@etudia.com">confidentialite@etudia.com</a></li>
                <li>Support : <a href="mailto:support@etudia.com">support@etudia.com</a></li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}
