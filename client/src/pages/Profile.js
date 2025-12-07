import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Card, Form, Button, Alert, Row, Col } from 'react-bootstrap';
import axios from 'axios';
import './Profile.css';

const Profile = () => {
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: ''
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API_URL}/users/profile`);
      setFormData({
        email: response.data.email || '',
        firstName: response.data.firstName || '',
        lastName: response.data.lastName || '',
        phone: response.data.phone || ''
      });
    } catch (error) {
      setError('Failed to load profile');
    } finally {
      setFetching(false);
    }
  };

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
    setLoading(true);

    try {
      await axios.put(`${API_URL}/users/profile`, formData);
      setMessage('Profile updated successfully');
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to update profile');
    }
    setLoading(false);
  };

  if (fetching) {
    return <Container className="profile"><div className="text-center p-5">Loading...</div></Container>;
  }

  return (
    <Container className="profile">
      <h1 className="profile__title">Profile</h1>
      <Row>
        <Col md={8}>
          <Card className="profile__card">
            <Card.Body>
              <Card.Title>Edit Profile Information</Card.Title>
              {error && <Alert variant="danger" className="profile__alert">{error}</Alert>}
              {message && <Alert variant="success" className="profile__alert">{message}</Alert>}
              <Form onSubmit={handleSubmit} className="profile__form">
                <Form.Group className="mb-3 profile__form-group">
                  <Form.Label className="profile__label">First Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    className="profile__input"
                  />
                </Form.Group>
                <Form.Group className="mb-3 profile__form-group">
                  <Form.Label className="profile__label">Last Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    className="profile__input"
                  />
                </Form.Group>
                <Form.Group className="mb-3 profile__form-group">
                  <Form.Label className="profile__label">Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="profile__input"
                  />
                </Form.Group>
                <Form.Group className="mb-3 profile__form-group">
                  <Form.Label className="profile__label">Phone</Form.Label>
                  <Form.Control
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="profile__input"
                  />
                </Form.Group>
                <Button
                  type="submit"
                  variant="primary"
                  className="profile__button"
                  disabled={loading}
                >
                  {loading ? 'Updating...' : 'Update Profile'}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="profile__card">
            <Card.Body>
              <Card.Title>Account Settings</Card.Title>
              <div className="profile__settings">
                <Button as={Link} to="/change-password" variant="outline-primary" className="profile__settings-button">
                  Change Password
                </Button>
                <Button as={Link} to="/delete-account" variant="outline-danger" className="profile__settings-button">
                  Delete Account
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Profile;

