import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Card, Button, Table, Alert } from 'react-bootstrap';
import axios from 'axios';
import './Resumes.css';

const Resumes = () => {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

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
        <>
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
                      to={`/resumes/${resume.id}`}
                      variant="outline-info"
                      size="sm"
                      className="resumes__action-button me-1"
                    >
                      View
                    </Button>
                    <Button
                      as={Link}
                      to={`/resumes/${resume.id}/edit`}
                      variant="outline-primary"
                      size="sm"
                      className="resumes__action-button me-1"
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
          {resumes.length >= 2 && (
            <div className="mt-4">
              <Card>
                <Card.Body>
                  <h4>Compare Resumes</h4>
                  <p className="text-muted">Select two resumes to compare side-by-side:</p>
                  <div className="d-flex gap-2 mb-3 flex-wrap">
                    <select className="form-select" id="compare-resume-1" style={{ maxWidth: '300px' }}>
                      <option value="">Select first resume...</option>
                      {resumes.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
                    </select>
                    <select className="form-select" id="compare-resume-2" style={{ maxWidth: '300px' }}>
                      <option value="">Select second resume...</option>
                      {resumes.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
                    </select>
                    <Button
                      variant="primary"
                      onClick={() => {
                        const id1 = document.getElementById('compare-resume-1').value;
                        const id2 = document.getElementById('compare-resume-2').value;
                        if (id1 && id2 && id1 !== id2) {
                          navigate(`/resumes/compare/${id1}/${id2}`);
                        } else {
                          alert('Please select two different resumes to compare');
                        }
                      }}
                    >
                      Compare
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </div>
          )}
        </>
      )}
    </Container>
  );
};

export default Resumes;

