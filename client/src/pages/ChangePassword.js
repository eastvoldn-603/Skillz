import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import axios from 'axios';
import './ChangePassword.css';

const ChangePassword = () => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await axios.post(`${API_URL}/auth/change-password`, {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });
      setMessage('Password changed successfully');
      setTimeout(() => {
        navigate('/profile');
      }, 2000);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to change password');
    }
    setLoading(false);
  };

  return (
    <Container className="change-password">
      <div className="change-password__container">
        <Card className="change-password__card">
          <Card.Body>
            <Card.Title className="change-password__title">Change Password</Card.Title>
            {error && <Alert variant="danger" className="change-password__alert">{error}</Alert>}
            {message && <Alert variant="success" className="change-password__alert">{message}</Alert>}
            <Form onSubmit={handleSubmit} className="change-password__form">
              <Form.Group className="mb-3 change-password__form-group">
                <Form.Label className="change-password__label">Current Password</Form.Label>
                <Form.Control
                  type="password"
                  name="currentPassword"
                  placeholder="Enter current password"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  required
                  className="change-password__input"
                />
              </Form.Group>
              <Form.Group className="mb-3 change-password__form-group">
                <Form.Label className="change-password__label">New Password</Form.Label>
                <Form.Control
                  type="password"
                  name="newPassword"
                  placeholder="Enter new password (min 6 characters)"
                  value={formData.newPassword}
                  onChange={handleChange}
                  required
                  className="change-password__input"
                />
              </Form.Group>
              <Form.Group className="mb-3 change-password__form-group">
                <Form.Label className="change-password__label">Confirm New Password</Form.Label>
                <Form.Control
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm new password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="change-password__input"
                />
              </Form.Group>
              <Button
                type="submit"
                variant="primary"
                className="w-100 change-password__button"
                disabled={loading}
              >
                {loading ? 'Changing Password...' : 'Change Password'}
              </Button>
            </Form>
          </Card.Body>
        </Card>
      </div>
    </Container>
  );
};

export default ChangePassword;

