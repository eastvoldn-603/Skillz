import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Container, Card, Button, Table, Alert } from 'react-bootstrap';
import axios from 'axios';
import './Resumes.css';

const Resumes = () => {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      const response = await axios.get(`${API_URL}/resumes`);
      setResumes(response.data);
    } catch (error) {
      setError('Failed to load resumes');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this resume?')) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/resumes/${id}`);
      setResumes(resumes.filter(r => r.id !== id));
    } catch (error) {
      alert('Failed to delete resume');
    }
  };

  if (loading) {
    return <Container className="resumes"><div className="text-center p-5">Loading...</div></Container>;
  }

  return (
    <Container className="resumes">
      <div className="resumes__header">
        <h1 className="resumes__title">My Resumes</h1>
        <Button as={Link} to="/resumes/new" variant="primary" className="resumes__new-button">
          Create New Resume
        </Button>
      </div>
      {error && <Alert variant="danger" className="resumes__alert">{error}</Alert>}
      {resumes.length === 0 ? (
        <Card className="resumes__empty">
          <Card.Body className="text-center">
            <Card.Text>You don't have any resumes yet.</Card.Text>
            <Button as={Link} to="/resumes/new" variant="primary">
              Create Your First Resume
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <Table striped bordered hover className="resumes__table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Created</th>
              <th>Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {resumes.map((resume) => (
              <tr key={resume.id}>
                <td>{resume.title}</td>
                <td>{new Date(resume.created_at).toLocaleDateString()}</td>
                <td>{new Date(resume.updated_at).toLocaleDateString()}</td>
                <td>
                  <Button
                    as={Link}
                    to={`/resumes/${resume.id}/edit`}
                    variant="outline-primary"
                    size="sm"
                    className="resumes__action-button"
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => handleDelete(resume.id)}
                    className="resumes__action-button"
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

export default Resumes;

