import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Container, Card, Button, Row, Col, Alert } from 'react-bootstrap';
import axios from 'axios';
import './Jobs.css';

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await axios.get(`${API_URL}/jobs`);
      setJobs(response.data);
    } catch (error) {
      setError('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Container className="jobs"><div className="text-center p-5">Loading...</div></Container>;
  }

  return (
    <Container className="jobs">
      <h1 className="jobs__title">Available Jobs</h1>
      {error && <Alert variant="danger" className="jobs__alert">{error}</Alert>}
      {jobs.length === 0 ? (
        <Card className="jobs__empty">
          <Card.Body className="text-center">
            <Card.Text>No jobs available at the moment.</Card.Text>
          </Card.Body>
        </Card>
      ) : (
        <Row className="jobs__list">
          {jobs.map((job) => (
            <Col md={6} lg={4} key={job.id} className="mb-4">
              <Card className="jobs__card">
                <Card.Body>
                  <Card.Title className="jobs__card-title">{job.title}</Card.Title>
                  <Card.Subtitle className="mb-2 text-muted jobs__card-company">
                    {job.company}
                  </Card.Subtitle>
                  {job.location && (
                    <Card.Text className="jobs__card-location">
                      📍 {job.location}
                    </Card.Text>
                  )}
                  {job.salary && (
                    <Card.Text className="jobs__card-salary">
                      💰 {job.salary}
                    </Card.Text>
                  )}
                  {job.description && (
                    <Card.Text className="jobs__card-description">
                      {job.description.substring(0, 150)}...
                    </Card.Text>
                  )}
                  <Button
                    as={Link}
                    to={`/jobs/${job.id}`}
                    variant="primary"
                    className="jobs__card-button"
                  >
                    View Details
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default Jobs;

