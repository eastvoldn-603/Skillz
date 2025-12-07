import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import axios from 'axios';
import './ResumeForm.css';

const ResumeForm = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    content: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    if (isEdit) {
      fetchResume();
    }
  }, [id]);

  const fetchResume = async () => {
    try {
      const response = await axios.get(`${API_URL}/resumes/${id}`);
      setFormData({
        title: response.data.title || '',
        content: response.data.content || ''
      });
    } catch (error) {
      setError('Failed to load resume');
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
    setLoading(true);

    try {
      if (isEdit) {
        await axios.put(`${API_URL}/resumes/${id}`, formData);
      } else {
        await axios.post(`${API_URL}/resumes`, formData);
      }
      navigate('/resumes');
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to save resume');
    }
    setLoading(false);
  };

  if (fetching) {
    return <Container className="resume-form"><div className="text-center p-5">Loading...</div></Container>;
  }

  return (
    <Container className="resume-form">
      <h1 className="resume-form__title">{isEdit ? 'Edit Resume' : 'Create New Resume'}</h1>
      <Card className="resume-form__card">
        <Card.Body>
          {error && <Alert variant="danger" className="resume-form__alert">{error}</Alert>}
          <Form onSubmit={handleSubmit} className="resume-form__form">
            <Form.Group className="mb-3 resume-form__form-group">
              <Form.Label className="resume-form__label">Title</Form.Label>
              <Form.Control
                type="text"
                name="title"
                placeholder="Enter resume title"
                value={formData.title}
                onChange={handleChange}
                required
                className="resume-form__input"
              />
            </Form.Group>
            <Form.Group className="mb-3 resume-form__form-group">
              <Form.Label className="resume-form__label">Content</Form.Label>
              <Form.Control
                as="textarea"
                rows={15}
                name="content"
                placeholder="Enter resume content..."
                value={formData.content}
                onChange={handleChange}
                className="resume-form__textarea"
              />
            </Form.Group>
            <div className="resume-form__actions">
              <Button
                type="submit"
                variant="primary"
                className="resume-form__button"
                disabled={loading}
              >
                {loading ? 'Saving...' : isEdit ? 'Update Resume' : 'Create Resume'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/resumes')}
                className="resume-form__button"
              >
                Cancel
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ResumeForm;

