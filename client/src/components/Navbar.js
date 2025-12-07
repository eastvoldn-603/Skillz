import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar as BootstrapNavbar, Nav, Button, Container } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <BootstrapNavbar bg="dark" variant="dark" expand="lg" className="navbar">
      <Container>
        <BootstrapNavbar.Brand as={Link} to="/dashboard" className="navbar__brand">
          Skillz
        </BootstrapNavbar.Brand>
        <BootstrapNavbar.Toggle aria-controls="basic-navbar-nav" />
        <BootstrapNavbar.Collapse id="basic-navbar-nav">
          {token ? (
            <>
              <Nav className="me-auto navbar__nav">
                <Nav.Link as={Link} to="/dashboard" className="navbar__link">
                  Home Page
                </Nav.Link>
                <Nav.Link as={Link} to="/resumes" className="navbar__link">
                  Resumes
                </Nav.Link>
                <Nav.Link as={Link} to="/jobs" className="navbar__link">
                  Jobs
                </Nav.Link>
                <Nav.Link as={Link} to="/applications" className="navbar__link">
                  Applications
                </Nav.Link>
                <Nav.Link as={Link} to="/offers" className="navbar__link">
                  Offers
                </Nav.Link>
                <Nav.Link as={Link} to="/skills-tree" className="navbar__link">
                  🎮 Skills Tree
                </Nav.Link>
                <Nav.Link as={Link} to="/profile" className="navbar__link">
                  Profile
                </Nav.Link>
              </Nav>
              <Nav className="navbar__nav">
                <span className="navbar__user me-3">
                  {user?.firstName} {user?.lastName}
                </span>
                <Button variant="outline-light" onClick={handleLogout} className="navbar__logout">
                  Logout
                </Button>
              </Nav>
            </>
          ) : (
            <Nav className="ms-auto navbar__nav">
              <Nav.Link as={Link} to="/login" className="navbar__link">
                Login
              </Nav.Link>
              <Nav.Link as={Link} to="/signup" className="navbar__link">
                Sign Up
              </Nav.Link>
            </Nav>
          )}
        </BootstrapNavbar.Collapse>
      </Container>
    </BootstrapNavbar>
  );
};

export default Navbar;

