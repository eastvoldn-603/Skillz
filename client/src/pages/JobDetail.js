import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Button, Form, Alert, Row, Col } from 'react-bootstrap';
import axios from 'axios';
import './JobDetail.css';

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [resumes, setResumes] = useState([]);
  const [applicationData, setApplicationData] = useState({
    resumeId: '',
    notes: ''
  });
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [alreadyApplied, setAlreadyApplied] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [jobRes, resumesRes] = await Promise.all([
        axios.get(`${API_URL}/jobs/${id}`),
        axios.get(`${API_URL}/resumes`)
      ]);

      setJob(jobRes.data);
      setResumes(resumesRes.data);

      // Check if user has any applications for this job (for info message)
      // Users can still apply with different resumes
      try {
        const applicationsRes = await axios.get(`${API_URL}/jobs/applications/all`);
        const hasApplication = applicationsRes.data.some(app => app.job_id === parseInt(id));
        setAlreadyApplied(hasApplication);
      } catch (error) {
        // Ignore if applications fetch fails
        setAlreadyApplied(false);
      }
    } catch (error) {
      setError('Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setApplicationData({
      ...applicationData,
      [e.target.name]: e.target.value
    });
  };

  const handleApply = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setApplying(true);

    try {
      // Normalize resumeId: send null instead of empty string
      const payload = {
        ...applicationData,
        resumeId: applicationData.resumeId === '' ? null : (applicationData.resumeId ? parseInt(applicationData.resumeId) : null)
      };
      
      await axios.post(`${API_URL}/jobs/${id}/apply`, payload);
      setMessage('Application submitted successfully!');
      // Refresh applications to show the new one
      try {
        const applicationsRes = await axios.get(`${API_URL}/jobs/applications/all`);
        const hasApplication = applicationsRes.data.some(app => app.job_id === parseInt(id));
        setAlreadyApplied(hasApplication);
      } catch (err) {
        // Ignore
      }
      setTimeout(() => {
        navigate('/applications');
      }, 2000);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to submit application');
    }
    setApplying(false);
  };

  if (loading) {
    return <Container className="job-detail"><div className="text-center p-5">Loading...</div></Container>;
  }

  if (!job) {
    return <Container className="job-detail"><Alert variant="danger">Job not found</Alert></Container>;
  }

  return (
    <Container className="job-detail">
      <Button variant="outline-secondary" onClick={() => navigate('/jobs')} className="job-detail__back">
        ← Back to Jobs
      </Button>
      <Row>
        <Col md={8}>
          <Card className="job-detail__card">
            <Card.Body>
              <Card.Title className="job-detail__title">{job.title}</Card.Title>
              <Card.Subtitle className="mb-3 text-muted job-detail__company">
                {job.company}
              </Card.Subtitle>
              {job.location && (
                <Card.Text className="job-detail__info">
                  <strong>Location:</strong> {job.location}
                </Card.Text>
              )}
              {job.salary && (
                <Card.Text className="job-detail__info">
                  <strong>Salary:</strong> {job.salary}
                </Card.Text>
              )}
              <Card.Text className="job-detail__description">
                <strong>Description:</strong>
                <div className="job-detail__description-text">
                  {job.description || 'No description provided.'}
                </div>
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="job-detail__card">
            <Card.Body>
              <Card.Title>Apply for this Job</Card.Title>
              {alreadyApplied && (
                <Alert variant="info" className="mb-3">
                  You have applications for this job. You can apply again with a different resume.
                  <Button
                    variant="link"
                    onClick={() => navigate('/applications')}
                    className="p-0 ms-2"
                  >
                    View Applications
                  </Button>
                </Alert>
              )}
              <>
                {error && <Alert variant="danger" className="job-detail__alert">{error}</Alert>}
                {message && <Alert variant="success" className="job-detail__alert">{message}</Alert>}
                <Form onSubmit={handleApply} className="job-detail__form">
                    {resumes.length > 0 && (
                      <Form.Group className="mb-3 job-detail__form-group">
                        <Form.Label className="job-detail__label">Select Resume (Optional)</Form.Label>
                        <Form.Select
                          name="resumeId"
                          value={applicationData.resumeId}
                          onChange={handleChange}
                          className="job-detail__input"
                        >
                          <option value="">None</option>
                          {resumes.map((resume) => (
                            <option key={resume.id} value={resume.id}>
                              {resume.title}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    )}
                    <Form.Group className="mb-3 job-detail__form-group">
                      <Form.Label className="job-detail__label">Notes (Optional)</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={4}
                        name="notes"
                        placeholder="Add any additional notes..."
                        value={applicationData.notes}
                        onChange={handleChange}
                        className="job-detail__input"
                      />
                    </Form.Group>
                    <Button
                      type="submit"
                      variant="primary"
                      className="w-100 job-detail__button"
                      disabled={applying}
                    >
                      {applying ? 'Applying...' : 'Apply Now'}
                    </Button>
                  </Form>
              </>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default JobDetail;

