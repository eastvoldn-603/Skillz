import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import axios from 'axios';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    resumes: 0,
    applications: 0,
    offers: 0
  });
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [resumesRes, applicationsRes, offersRes] = await Promise.all([
        axios.get(`${API_URL}/resumes`),
        axios.get(`${API_URL}/jobs/applications/all`),
        axios.get(`${API_URL}/jobs/offers/all`)
      ]);

      setStats({
        resumes: resumesRes.data.length,
        applications: applicationsRes.data.length,
        offers: offersRes.data.length
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Container className="dashboard"><div className="text-center p-5">Loading...</div></Container>;
  }

  return (
    <Container className="dashboard">
      <h1 className="dashboard__title">Dashboard</h1>
      <Row className="dashboard__stats">
        <Col md={4} className="mb-4">
          <Card className="dashboard__card">
            <Card.Body>
              <Card.Title className="dashboard__card-title">Resumes</Card.Title>
              <Card.Text className="dashboard__card-number">{stats.resumes}</Card.Text>
              <Button as={Link} to="/resumes" variant="primary" className="dashboard__card-button">
                Manage Resumes
              </Button>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4} className="mb-4">
          <Card className="dashboard__card">
            <Card.Body>
              <Card.Title className="dashboard__card-title">Applications</Card.Title>
              <Card.Text className="dashboard__card-number">{stats.applications}</Card.Text>
              <Button as={Link} to="/applications" variant="primary" className="dashboard__card-button">
                View Applications
              </Button>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4} className="mb-4">
          <Card className="dashboard__card">
            <Card.Body>
              <Card.Title className="dashboard__card-title">Job Offers</Card.Title>
              <Card.Text className="dashboard__card-number">{stats.offers}</Card.Text>
              <Button as={Link} to="/offers" variant="primary" className="dashboard__card-button">
                View Offers
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      <Row>
        <Col>
          <Card className="dashboard__card">
            <Card.Body>
              <Card.Title>Quick Actions</Card.Title>
              <div className="dashboard__actions">
                <Button as={Link} to="/resumes/new" variant="success" className="dashboard__action-button">
                  Create New Resume
                </Button>
                <Button as={Link} to="/jobs" variant="info" className="dashboard__action-button">
                  Browse Jobs
                </Button>
                <Button as={Link} to="/profile" variant="secondary" className="dashboard__action-button">
                  Edit Profile
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;

