import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    if (result.success) {
      navigate('/dashboard'); // Still uses /dashboard route, but displays as "Home Page"
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <Container className="login">
      <div className="login__container">
        <Card className="login__card">
          <Card.Body>
            <Card.Title className="login__title">Login</Card.Title>
            {error && <Alert variant="danger" className="login__alert">{error}</Alert>}
            <Form onSubmit={handleSubmit} className="login__form">
              <Form.Group className="mb-3 login__form-group">
                <Form.Label className="login__label">Email</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="Enter email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="login__input"
                />
              </Form.Group>
              <Form.Group className="mb-3 login__form-group">
                <Form.Label className="login__label">Password</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="login__input"
                />
              </Form.Group>
              <Button
                type="submit"
                variant="primary"
                className="w-100 login__button"
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Login'}
              </Button>
            </Form>
            <div className="login__links">
              <Link to="/forgot-password" className="login__link">
                Forgot Password?
              </Link>
              <span className="login__separator">|</span>
              <Link to="/signup" className="login__link">
                Don't have an account? Sign Up
              </Link>
            </div>
          </Card.Body>
        </Card>
      </div>
    </Container>
  );
};

export default Login;

