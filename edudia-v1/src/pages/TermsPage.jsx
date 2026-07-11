import React from 'react'
import { Card, Col, Container, Row } from 'react-bootstrap'
import './Legal.css'

export default function TermsPage() {
  return (
    <Container className="py-4 legal-page">
      <section className="legal-hero mb-4">
        <span className="legal-eyebrow">Étudia+ - Cadre d'utilisation</span>
        <h1>Conditions d'utilisation</h1>
        <p>
          Ces conditions encadrent l'utilisation de la plateforme Étudia+, de ses espaces de partage documentaire,
          de discussion et de ses outils d'accompagnement étudiant. En accédant au service, l'utilisateur accepte
          de respecter les règles ci-dessous.
        </p>
      </section>

      <Row className="g-4 mb-4">
        <Col md={6}>
          <Card className="legal-section-card">
            <Card.Body>
              <h2>Description du service Étudia+</h2>
              <p>
                Étudia+ est une plateforme d'entraide académique qui permet aux étudiants de consulter des documents,
                participer à des forums, organiser leurs études et utiliser des outils numériques de soutien.
              </p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="legal-section-card">
            <Card.Body>
              <h2>Conditions d'accès aux documents et forums</h2>
              <ul>
                <li>L'accès aux fonctionnalités privées peut dépendre d'une authentification et d'un abonnement actif.</li>
                <li>Les documents de programme sont réservés aux étudiants concernés lorsque cette restriction s'applique.</li>
                <li>Les espaces communautaires doivent être utilisés uniquement dans un cadre académique et respectueux.</li>
              </ul>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="legal-section-card">
            <Card.Body>
              <h2>Responsabilité des utilisateurs</h2>
              <ul>
                <li>Chaque utilisateur demeure responsable des documents, messages et réponses qu'il publie.</li>
                <li>Les contenus déposés doivent être exacts, pertinents et conformes aux règles applicables.</li>
                <li>L'utilisateur s'engage à ne pas publier d'information trompeuse, confidentielle ou nuisible.</li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="legal-section-card">
            <Card.Body>
              <h2>Contenus interdits</h2>
              <ul>
                <li>Tout contenu illégal, offensant, violent, harcelant ou discriminatoire est interdit.</li>
                <li>Le plagiat, la diffusion non autorisée de documents protégés et les faux contenus sont prohibés.</li>
                <li>Les spams, publicités abusives et détournements de la plateforme sont interdits.</li>
              </ul>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="legal-section-card">
            <Card.Body>
              <h2>Modération et administration</h2>
              <p>
                L'administration d'Étudia+ se réserve le droit de supprimer un document, une question, une réponse
                ou tout autre contenu qui contrevient aux présentes conditions, sans préavis, afin de protéger les
                utilisateurs et l'intégrité de la plateforme.
              </p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="legal-section-card">
            <Card.Body>
              <h2>Abonnement et résiliation</h2>
              <ul>
                <li>Certaines sections de la plateforme peuvent nécessiter un abonnement actif.</li>
                <li>L'utilisateur peut mettre fin à son abonnement selon les modalités prévues dans son espace personnel.</li>
                <li>La résiliation met fin à l'accès aux fonctionnalités premium à compter de la désactivation effective.</li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-4">
        <Col lg={7}>
          <Card className="legal-section-card">
            <Card.Body>
              <h2>Limitation de responsabilité</h2>
              <p>
                Étudia+ met à disposition une infrastructure de partage et d'échange, mais ne garantit pas l'exactitude,
                l'exhaustivité ou la pertinence de chaque contenu publié par les utilisateurs. L'utilisation des ressources
                disponibles se fait sous la responsabilité de chaque étudiant.
              </p>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={5}>
          <Card className="legal-contact-card">
            <Card.Body>
              <h2>Coordonnées de contact</h2>
              <p>Pour toute question relative aux conditions d'utilisation :</p>
              <ul>
                <li>Courriel : <a href="mailto:support@etudia.com">support@etudia.com</a></li>
                <li>Administration : <a href="mailto:admin@etudia.com">admin@etudia.com</a></li>
                <li>Service étudiant : Étudia+ Support</li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}
