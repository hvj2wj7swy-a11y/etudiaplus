import React from 'react'
import { Container } from 'react-bootstrap'
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-dark text-light py-3 mt-4">
      <Container className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-2 small">
        <div>© {new Date().getFullYear()} Étudia+ — Prototype v1</div>
        <div className="d-flex flex-wrap gap-3 footer-links">
          <Link to="/conditions">Conditions d'utilisation</Link>
          <Link to="/confidentialite">Politique de confidentialité</Link>
        </div>
      </Container>
    </footer>
  )
}
