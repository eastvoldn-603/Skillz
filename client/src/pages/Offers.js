import React, { useEffect, useState } from 'react';
import { Container, Card, Table, Badge, Button, Alert } from 'react-bootstrap';
import axios from 'axios';
import './Offers.css';

const Offers = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const response = await axios.get(`${API_URL}/jobs/offers/all`);
      setOffers(response.data);
    } catch (error) {
      setError('Failed to load offers');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this offer?')) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/jobs/offers/${id}`);
      setOffers(offers.filter(offer => offer.id !== id));
    } catch (error) {
      alert('Failed to delete offer');
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'warning',
      accepted: 'success',
      rejected: 'danger'
    };
    return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
  };

  if (loading) {
    return <Container className="offers"><div className="text-center p-5">Loading...</div></Container>;
  }

  return (
    <Container className="offers">
      <h1 className="offers__title">Job Offers</h1>
      {error && <Alert variant="danger" className="offers__alert">{error}</Alert>}
      {offers.length === 0 ? (
        <Card className="offers__empty">
          <Card.Body className="text-center">
            <Card.Text>You don't have any job offers yet.</Card.Text>
          </Card.Body>
        </Card>
      ) : (
        <Table striped bordered hover className="offers__table">
          <thead>
            <tr>
              <th>Job Title</th>
              <th>Company</th>
              <th>Salary</th>
              <th>Start Date</th>
              <th>Status</th>
              <th>Received</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {offers.map((offer) => (
              <tr key={offer.id}>
                <td>{offer.job_title}</td>
                <td>{offer.job_company}</td>
                <td>{offer.salary || 'N/A'}</td>
                <td>{offer.start_date ? new Date(offer.start_date).toLocaleDateString() : 'N/A'}</td>
                <td>{getStatusBadge(offer.status)}</td>
                <td>{new Date(offer.created_at).toLocaleDateString()}</td>
                <td>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => handleDelete(offer.id)}
                    className="offers__action-button"
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Container>
  );
};

export default Offers;

