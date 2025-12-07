import React, { useState, useEffect } from 'react';
import { Form, Button, Alert, Card } from 'react-bootstrap';
import axios from 'axios';

const JobExperienceForm = ({ onJobAdded }) => {
  const [formData, setFormData] = useState({
    company: '',
    position: '',
    description: '',
    start_date: '',
    end_date: '',
    skills_gained: ''
  });
  const [availableSkills, setAvailableSkills] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loadingSkills, setLoadingSkills] = useState(true);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchSkills();
  }, []);

  const fetchSkills = async () => {
    try {
      const response = await axios.get(`${API_URL}/skills`);
      setAvailableSkills(response.data);
    } catch (err) {
      console.error('Failed to load skills:', err);
    } finally {
      setLoadingSkills(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSkillToggle = (skillId) => {
    setSelectedSkills(prev => 
      prev.includes(skillId) 
        ? prev.filter(id => id !== skillId)
        : [...prev, skillId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      // First, add the job experience
      const response = await axios.post(`${API_URL}/skills/user/jobs`, formData);
      const jobId = response.data.id;

      // Then, unlock selected skills
      if (selectedSkills.length > 0) {
        const skillIds = selectedSkills;
        const levels = selectedSkills.map(() => 1); // Default level 1
        const experiencePoints = selectedSkills.map(() => 100); // Default 100 XP

        await axios.post(`${API_URL}/skills/user/jobs/${jobId}/unlock-skills`, {
          skill_ids: skillIds,
          levels: levels,
          experience_points: experiencePoints
        });
      }
      
      // Reset form
      setFormData({
        company: '',
        position: '',
        description: '',
        start_date: '',
        end_date: '',
        skills_gained: ''
      });
      setSelectedSkills([]);
      
      setSuccess(true);
      if (onJobAdded) {
        onJobAdded();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add job experience');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form onSubmit={handleSubmit} className="job-experience-form">
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">Job experience added successfully!</Alert>}

      <Form.Group className="mb-3">
        <Form.Label>Company *</Form.Label>
        <Form.Control
          type="text"
          name="company"
          value={formData.company}
          onChange={handleChange}
          required
          placeholder="Enter company name"
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Position *</Form.Label>
        <Form.Control
          type="text"
          name="position"
          value={formData.position}
          onChange={handleChange}
          required
          placeholder="Enter job title/position"
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Description</Form.Label>
        <Form.Control
          as="textarea"
          rows={3}
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Describe your role and responsibilities"
        />
      </Form.Group>

      <div className="row">
        <Form.Group className="mb-3 col-md-6">
          <Form.Label>Start Date</Form.Label>
          <Form.Control
            type="date"
            name="start_date"
            value={formData.start_date}
            onChange={handleChange}
          />
        </Form.Group>

        <Form.Group className="mb-3 col-md-6">
          <Form.Label>End Date</Form.Label>
          <Form.Control
            type="date"
            name="end_date"
            value={formData.end_date}
            onChange={handleChange}
          />
        </Form.Group>
      </div>

      <Form.Group className="mb-3">
        <Form.Label>Skills Gained (Optional Text)</Form.Label>
        <Form.Control
          type="text"
          name="skills_gained"
          value={formData.skills_gained}
          onChange={handleChange}
          placeholder="e.g., JavaScript, React, Team Leadership"
        />
        <Form.Text className="text-muted">
          Optional: List skills as text (or select skills below to unlock them)
        </Form.Text>
      </Form.Group>

      {!loadingSkills && (
        <Card className="mb-3">
          <Card.Header>
            <strong>Unlock Skills from This Job</strong>
            <Form.Text className="text-muted ms-2">
              Select skills you gained or improved in this role
            </Form.Text>
          </Card.Header>
          <Card.Body>
            <div className="row">
              {availableSkills.map((skill) => (
                <div key={skill.id} className="col-md-4 mb-2">
                  <Form.Check
                    type="checkbox"
                    id={`skill-${skill.id}`}
                    label={`${skill.icon || ''} ${skill.name}`}
                    checked={selectedSkills.includes(skill.id)}
                    onChange={() => handleSkillToggle(skill.id)}
                  />
                </div>
              ))}
            </div>
            {selectedSkills.length > 0 && (
              <Alert variant="info" className="mt-2 mb-0">
                {selectedSkills.length} skill(s) selected - will be unlocked at level 1
              </Alert>
            )}
          </Card.Body>
        </Card>
      )}

      <Button
        type="submit"
        variant="primary"
        disabled={loading}
        className="job-experience-form__submit"
      >
        {loading ? 'Adding...' : 'Add Job Experience & Unlock Skills'}
      </Button>
    </Form>
  );
};

export default JobExperienceForm;

