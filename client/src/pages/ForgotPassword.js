import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import axios from 'axios';
import './ForgotPassword.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/auth/forgot-password`, { email });
      setMessage(response.data.message);
      // In production, the token would be sent via email
      if (response.data.resetToken) {
        setMessage(`${response.data.message}. Reset token: ${response.data.resetToken}`);
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to send reset email');
    }
    setLoading(false);
  };

  return (
    <Container className="forgot-password">
      <div className="forgot-password__container">
        <Card className="forgot-password__card">
          <Card.Body>
            <Card.Title className="forgot-password__title">Forgot Password</Card.Title>
            {error && <Alert variant="danger" className="forgot-password__alert">{error}</Alert>}
            {message && <Alert variant="success" className="forgot-password__alert">{message}</Alert>}
            <Form onSubmit={handleSubmit} className="forgot-password__form">
              <Form.Group className="mb-3 forgot-password__form-group">
                <Form.Label className="forgot-password__label">Email</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="forgot-password__input"
                />
              </Form.Group>
              <Button
                type="submit"
                variant="primary"
                className="w-100 forgot-password__button"
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </Form>
            <div className="forgot-password__links">
              <Link to="/login" className="forgot-password__link">
                Back to Login
              </Link>
            </div>
          </Card.Body>
        </Card>
      </div>
    </Container>
  );
};

export default ForgotPassword;

