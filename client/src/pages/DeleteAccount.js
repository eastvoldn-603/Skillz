import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './DeleteAccount.css';

const DeleteAccount = () => {
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  const CONFIRM_TEXT = 'DELETE';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (confirmText !== CONFIRM_TEXT) {
      setError(`Please type "${CONFIRM_TEXT}" to confirm`);
      return;
    }

    setLoading(true);

    try {
      await axios.delete(`${API_URL}/users/account`);
      logout();
      navigate('/login');
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to delete account');
      setLoading(false);
    }
  };

  return (
    <Container className="delete-account">
      <div className="delete-account__container">
        <Card className="delete-account__card">
          <Card.Body>
            <Card.Title className="delete-account__title">Delete Account</Card.Title>
            <Alert variant="danger" className="delete-account__warning">
              <strong>Warning:</strong> This action cannot be undone. All your data, including resumes, applications, and offers will be permanently deleted.
            </Alert>
            {error && <Alert variant="danger" className="delete-account__alert">{error}</Alert>}
            <Form onSubmit={handleSubmit} className="delete-account__form">
              <Form.Group className="mb-3 delete-account__form-group">
                <Form.Label className="delete-account__label">
                  Type <strong>{CONFIRM_TEXT}</strong> to confirm:
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder={CONFIRM_TEXT}
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  required
                  className="delete-account__input"
                />
              </Form.Group>
              <Button
                type="submit"
                variant="danger"
                className="w-100 delete-account__button"
                disabled={loading || confirmText !== CONFIRM_TEXT}
              >
                {loading ? 'Deleting Account...' : 'Delete My Account'}
              </Button>
            </Form>
          </Card.Body>
        </Card>
      </div>
    </Container>
  );
};

export default DeleteAccount;

