import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Container, Card, Table, Badge, Button, Alert } from 'react-bootstrap';
import axios from 'axios';
import './Applications.css';

const Applications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await axios.get(`${API_URL}/jobs/applications/all`);
      setApplications(response.data);
    } catch (error) {
      setError('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this application?')) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/jobs/applications/${id}`);
      setApplications(applications.filter(app => app.id !== id));
    } catch (error) {
      alert('Failed to delete application');
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'warning',
      accepted: 'success',
      rejected: 'danger',
      withdrawn: 'secondary'
    };
    return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
  };

  if (loading) {
    return <Container className="applications"><div className="text-center p-5">Loading...</div></Container>;
  }

  return (
    <Container className="applications">
      <h1 className="applications__title">My Job Applications</h1>
      {error && <Alert variant="danger" className="applications__alert">{error}</Alert>}
      {applications.length === 0 ? (
        <Card className="applications__empty">
          <Card.Body className="text-center">
            <Card.Text>You haven't applied to any jobs yet.</Card.Text>
          </Card.Body>
        </Card>
      ) : (
        <Table striped bordered hover className="applications__table">
          <thead>
            <tr>
              <th>Job Title</th>
              <th>Company</th>
              <th>Resume</th>
              <th>Status</th>
              <th>Applied Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((application) => (
              <tr key={application.id}>
                <td>
                  <Link 
                    to={`/jobs/${application.job_id}`}
                    className="applications__job-link"
                  >
                    {application.job_title}
                  </Link>
                </td>
                <td>{application.job_company}</td>
                <td>
                  {application.resume_id && application.resume_title ? (
                    <Link 
                      to={`/resumes/${application.resume_id}/edit`}
                      className="applications__resume-link"
                    >
                      {application.resume_title}
                    </Link>
                  ) : (
                    'N/A'
                  )}
                </td>
                <td>{getStatusBadge(application.status)}</td>
                <td>{new Date(application.applied_at).toLocaleDateString()}</td>
                <td>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => handleDelete(application.id)}
                    className="applications__action-button"
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

export default Applications;

