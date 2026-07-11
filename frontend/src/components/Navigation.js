/**
 * Composant Navigation
 */

import React from 'react';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navigation = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <Navbar bg="dark" expand="lg" sticky="top" className="mb-4">
      <Container>
        <Navbar.Brand as={Link} to="/dashboard" className="fw-bold">
          📚 Étudia+
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/dashboard">Tableau de bord</Nav.Link>
            <Nav.Link as={Link} to="/documents">Documents</Nav.Link>
            <Nav.Link as={Link} to="/forum">Forum</Nav.Link>
            <Nav.Link as={Link} to="/upload">Téléverser</Nav.Link>
          </Nav>
          <Nav>
            <Nav.Link as={Link} to="/profile">{user.first_name}</Nav.Link>
            <Button variant="outline-light" size="sm" onClick={handleLogout}>
              Déconnexion
            </Button>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Navigation;
