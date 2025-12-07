import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Alert, Tabs, Tab, ListGroup, Modal, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import SkillsTreeVisual from '../components/SkillsTreeVisual';
import JobExperienceForm from '../components/JobExperienceForm';
import './SkillsTree.css';

const SkillsTree = () => {
  const [treeData, setTreeData] = useState([]);
  const [allSkills, setAllSkills] = useState([]); // All available skills with details
  const [selectedSkills, setSelectedSkills] = useState([]); // Skills selected for resume
  const [jobExperiences, setJobExperiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('tree');
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [resumeTitle, setResumeTitle] = useState('');
  const [existingResumes, setExistingResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const navigate = useNavigate();

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchData();
    fetchResumes();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [treeRes, skillsRes, jobsRes] = await Promise.all([
        axios.get(`${API_URL}/skills/tree`),
        axios.get(`${API_URL}/skills`),
        axios.get(`${API_URL}/skills/user/jobs`)
      ]);

      setTreeData(treeRes.data);
      // Ensure skills have consistent ID field (tree uses skill_id, skills API uses id)
      const normalizedSkills = skillsRes.data.map(skill => ({
        ...skill,
        id: skill.id || skill.skill_id
      }));
      setAllSkills(normalizedSkills);
      setJobExperiences(jobsRes.data);
      setError('');
    } catch (err) {
      setError('Failed to load skills tree');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchResumes = async () => {
    try {
      const response = await axios.get(`${API_URL}/resumes`);
      setExistingResumes(response.data);
    } catch (err) {
      console.error('Failed to fetch resumes:', err);
    }
  };

  const handleSkillClick = (skillId) => {
    // Find the skill in allSkills
    const skill = allSkills.find(s => s.id === skillId);
    if (!skill) return;

    // Check if already selected
    const isSelected = selectedSkills.some(s => s.id === skillId);
    if (isSelected) {
      // Remove from selection
      setSelectedSkills(selectedSkills.filter(s => s.id !== skillId));
    } else {
      // Add to selection
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const handleRemoveSkill = (skillId) => {
    setSelectedSkills(selectedSkills.filter(s => s.id !== skillId));
  };

  const handleCreateResume = async () => {
    if (!resumeTitle.trim()) {
      alert('Please enter a resume title');
      return;
    }

    if (selectedSkills.length === 0) {
      alert('Please select at least one skill');
      return;
    }

    try {
      // Format skills into resume content
      const skillsText = selectedSkills.map(skill => 
        `• ${skill.name} (${skill.skill_type === 'hard' ? 'Hard' : 'Soft'} Skill)\n  ${skill.description || 'No description'}`
      ).join('\n\n');

      const content = `Skills:\n\n${skillsText}`;

      const response = await axios.post(`${API_URL}/resumes`, {
        title: resumeTitle,
        content: content
      });

      const resumeId = response.data.id;

      // Add skills to resume_skills table
      const skillPromises = selectedSkills.map(skill => 
        axios.post(`${API_URL}/resumes/${resumeId}/skills/${skill.id}`)
          .catch(err => {
            // Ignore errors (skill might already exist or user might not have it)
            console.warn('Failed to add skill to resume:', err);
          })
      );

      await Promise.all(skillPromises);

      setShowResumeModal(false);
      setResumeTitle('');
      setSelectedSkills([]);
      navigate(`/resumes/${resumeId}/edit`);
    } catch (err) {
      alert('Failed to create resume: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleUpdateResume = async () => {
    if (!selectedResumeId) {
      alert('Please select a resume to update');
      return;
    }

    if (selectedSkills.length === 0) {
      alert('Please select at least one skill');
      return;
    }

    try {
      // Get existing resume
      const resumeRes = await axios.get(`${API_URL}/resumes/${selectedResumeId}`);
      const existingContent = resumeRes.data.content || '';

      // Format skills into resume content
      const skillsText = selectedSkills.map(skill => 
        `• ${skill.name} (${skill.skill_type === 'hard' ? 'Hard' : 'Soft'} Skill)\n  ${skill.description || 'No description'}`
      ).join('\n\n');

      const newContent = existingContent + (existingContent ? '\n\n' : '') + `Skills:\n\n${skillsText}`;

      await axios.put(`${API_URL}/resumes/${selectedResumeId}`, {
        content: newContent
      });

      // Add skills to resume_skills table
      const skillPromises = selectedSkills.map(skill => 
        axios.post(`${API_URL}/resumes/${selectedResumeId}/skills/${skill.id}`)
          .catch(err => {
            // Ignore errors (skill might already exist or user might not have it)
            console.warn('Failed to add skill to resume:', err);
          })
      );

      await Promise.all(skillPromises);

      setShowResumeModal(false);
      setSelectedResumeId('');
      setSelectedSkills([]);
      navigate(`/resumes/${selectedResumeId}/edit`);
    } catch (err) {
      alert('Failed to update resume: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleJobAdded = async () => {
    await fetchData(); // Refresh data after adding job
  };

  if (loading) {
    return (
      <Container className="skills-tree">
        <div className="text-center p-5">Loading skills tree...</div>
      </Container>
    );
  }

  return (
    <Container className="skills-tree">
      <div className="skills-tree__header">
        <h1 className="skills-tree__title">🎮 Skills Tree</h1>
        <p className="skills-tree__subtitle">
          Build your career like a character in a game! Unlock skills, level up, and track your progress.
        </p>
      </div>

      {error && <Alert variant="danger" className="skills-tree__alert">{error}</Alert>}

      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="skills-tree__tabs"
      >
        <Tab eventKey="tree" title="🌳 Skills Tree">
          <div className="skills-tree__main-layout">
            <Card className="skills-tree__card skills-tree__tree-card">
              <Card.Body className="skills-tree__card-body">
                <SkillsTreeVisual
                  treeData={treeData}
                  allSkills={allSkills}
                  onSkillClick={handleSkillClick}
                  selectedSkills={selectedSkills}
                />
              </Card.Body>
            </Card>
            
            <Card className="skills-tree__card skills-tree__sidebar-card">
              <Card.Body className="skills-tree__sidebar-body">
                <h4 className="skills-tree__sidebar-title">Selected Skills</h4>
                <p className="skills-tree__sidebar-subtitle">
                  Click skills in the tree to add them here
                </p>
                
                {selectedSkills.length === 0 ? (
                  <div className="skills-tree__empty-state">
                    <p className="text-muted">No skills selected yet</p>
                  </div>
                ) : (
                  <>
                    <ListGroup className="skills-tree__skills-list">
                      {selectedSkills.map((skill) => (
                        <ListGroup.Item key={skill.id} className="skills-tree__skill-item">
                          <div className="skills-tree__skill-header">
                            <h6 className="skills-tree__skill-name">{skill.name}</h6>
                            <Button
                              variant="link"
                              size="sm"
                              className="skills-tree__remove-btn"
                              onClick={() => handleRemoveSkill(skill.id)}
                            >
                              ×
                            </Button>
                          </div>
                          <p className="skills-tree__skill-description">
                            {skill.description || 'No description available'}
                          </p>
                          <span className="skills-tree__skill-type badge bg-secondary">
                            {skill.skill_type === 'hard' ? 'Hard Skill' : 'Soft Skill'}
                          </span>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                    
                    <div className="skills-tree__actions mt-3">
                      <Button
                        variant="primary"
                        className="w-100 mb-2"
                        onClick={() => {
                          setSelectedResumeId('');
                          setResumeTitle('');
                          setIsUpdateMode(false);
                          setShowResumeModal(true);
                        }}
                      >
                        Create New Resume
                      </Button>
                      <Button
                        variant="outline-primary"
                        className="w-100"
                        onClick={() => {
                          if (existingResumes.length === 0) {
                            alert('You need to create a resume first');
                            return;
                          }
                          setSelectedResumeId('');
                          setResumeTitle('');
                          setIsUpdateMode(true);
                          setShowResumeModal(true);
                        }}
                      >
                        Update Existing Resume
                      </Button>
                    </div>
                  </>
                )}
              </Card.Body>
            </Card>
          </div>
          
          <Modal show={showResumeModal} onHide={() => {
            setShowResumeModal(false);
            setIsUpdateMode(false);
            setSelectedResumeId('');
            setResumeTitle('');
          }}>
            <Modal.Header closeButton>
              <Modal.Title>
                {isUpdateMode ? 'Update Resume' : 'Create New Resume'}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {isUpdateMode ? (
                <Form.Group className="mb-3">
                  <Form.Label>Select Resume</Form.Label>
                  <Form.Select
                    value={selectedResumeId}
                    onChange={(e) => setSelectedResumeId(e.target.value)}
                  >
                    <option value="">Choose a resume...</option>
                    {existingResumes.map(resume => (
                      <option key={resume.id} value={resume.id}>
                        {resume.title}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              ) : (
                <Form.Group className="mb-3">
                  <Form.Label>Resume Title</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter resume title"
                    value={resumeTitle}
                    onChange={(e) => setResumeTitle(e.target.value)}
                  />
                </Form.Group>
              )}
              <p className="text-muted">
                {selectedSkills.length} skill{selectedSkills.length !== 1 ? 's' : ''} will be added
              </p>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => {
                setShowResumeModal(false);
                setIsUpdateMode(false);
                setSelectedResumeId('');
                setResumeTitle('');
              }}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={isUpdateMode ? handleUpdateResume : handleCreateResume}
                disabled={isUpdateMode && !selectedResumeId}
              >
                {isUpdateMode ? 'Update Resume' : 'Create Resume'}
              </Button>
            </Modal.Footer>
          </Modal>
        </Tab>

        <Tab eventKey="jobs" title="💼 Job Experience">
          <Card className="skills-tree__card">
            <Card.Body>
              <h3 className="skills-tree__section-title">Add Job Experience</h3>
              <p className="skills-tree__section-description">
                Add your previous jobs to automatically unlock related skills!
              </p>
              <JobExperienceForm onJobAdded={handleJobAdded} />
              
              {jobExperiences.length > 0 && (
                <div className="skills-tree__jobs-list">
                  <h4 className="mt-4">Your Job History</h4>
                  {jobExperiences.map((job) => (
                    <Card key={job.id} className="mb-3">
                      <Card.Body>
                        <h5>{job.position} at {job.company}</h5>
                        {job.start_date && (
                          <p className="text-muted mb-1">
                            {new Date(job.start_date).toLocaleDateString()} - 
                            {job.end_date ? new Date(job.end_date).toLocaleDateString() : 'Present'}
                          </p>
                        )}
                        {job.description && <p>{job.description}</p>}
                        {job.skills_gained && (
                          <p className="text-info"><strong>Skills:</strong> {job.skills_gained}</p>
                        )}
                      </Card.Body>
                    </Card>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="stats" title="📊 Statistics">
          <Card className="skills-tree__card">
            <Card.Body>
              <h3 className="skills-tree__section-title">Skills Overview</h3>
              <div className="skills-tree__stats">
                <div className="skills-tree__stat-card">
                  <h4>{allSkills.length}</h4>
                  <p>Total Skills Available</p>
                </div>
                <div className="skills-tree__stat-card">
                  <h4>{allSkills.filter(s => s.skill_type === 'hard').length}</h4>
                  <p>Hard Skills</p>
                </div>
                <div className="skills-tree__stat-card">
                  <h4>{allSkills.filter(s => s.skill_type === 'soft').length}</h4>
                  <p>Soft Skills</p>
                </div>
                <div className="skills-tree__stat-card">
                  <h4>{selectedSkills.length}</h4>
                  <p>Currently Selected</p>
                </div>
              </div>

              <div className="skills-tree__top-skills mt-4">
                <h4>All Available Skills</h4>
                {allSkills.map((skill) => (
                  <div key={skill.id} className="skills-tree__skill-item">
                    <span className="skills-tree__skill-name">{skill.name}</span>
                    <span className="skills-tree__skill-level">
                      {skill.skill_type === 'hard' ? 'Hard' : 'Soft'} Skill
                    </span>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>
    </Container>
  );
};

export default SkillsTree;

