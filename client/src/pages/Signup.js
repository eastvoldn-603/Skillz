import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import './Signup.css';

const Signup = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    const { confirmPassword, ...signupData } = formData;
    const result = await signup(signupData);
    
    if (result.success) {
      navigate('/dashboard'); // Still uses /dashboard route, but displays as "Home Page"
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <Container className="signup">
      <div className="signup__container">
        <Card className="signup__card">
          <Card.Body>
            <Card.Title className="signup__title">Sign Up</Card.Title>
            {error && <Alert variant="danger" className="signup__alert">{error}</Alert>}
            <Form onSubmit={handleSubmit} className="signup__form">
              <Form.Group className="mb-3 signup__form-group">
                <Form.Label className="signup__label">First Name</Form.Label>
                <Form.Control
                  type="text"
                  name="firstName"
                  placeholder="Enter first name"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="signup__input"
                />
              </Form.Group>
              <Form.Group className="mb-3 signup__form-group">
                <Form.Label className="signup__label">Last Name</Form.Label>
                <Form.Control
                  type="text"
                  name="lastName"
                  placeholder="Enter last name"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="signup__input"
                />
              </Form.Group>
              <Form.Group className="mb-3 signup__form-group">
                <Form.Label className="signup__label">Email</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  placeholder="Enter email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="signup__input"
                />
              </Form.Group>
              <Form.Group className="mb-3 signup__form-group">
                <Form.Label className="signup__label">Phone (Optional)</Form.Label>
                <Form.Control
                  type="tel"
                  name="phone"
                  placeholder="Enter phone number"
                  value={formData.phone}
                  onChange={handleChange}
                  className="signup__input"
                />
              </Form.Group>
              <Form.Group className="mb-3 signup__form-group">
                <Form.Label className="signup__label">Password</Form.Label>
                <Form.Control
                  type="password"
                  name="password"
                  placeholder="Enter password (min 6 characters)"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="signup__input"
                />
              </Form.Group>
              <Form.Group className="mb-3 signup__form-group">
                <Form.Label className="signup__label">Confirm Password</Form.Label>
                <Form.Control
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="signup__input"
                />
              </Form.Group>
              <Button
                type="submit"
                variant="primary"
                className="w-100 signup__button"
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Sign Up'}
              </Button>
            </Form>
            <div className="signup__links">
              <Link to="/login" className="signup__link">
                Already have an account? Login
              </Link>
            </div>
          </Card.Body>
        </Card>
      </div>
    </Container>
  );
};

export default Signup;

