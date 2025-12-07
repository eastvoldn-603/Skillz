import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Container, Card, Button, Alert, Row, Col, Badge, Modal } from 'react-bootstrap';
import axios from 'axios';
import './ResumeCompare.css';

const ResumeCompare = () => {
  const { id1, id2 } = useParams();
  const navigate = useNavigate();
  const [resume1, setResume1] = useState(null);
  const [resume2, setResume2] = useState(null);
  const [skills1, setSkills1] = useState([]);
  const [skills2, setSkills2] = useState([]);
  const [jobs1, setJobs1] = useState([]);
  const [jobs2, setJobs2] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState({ left: [], right: [] });
  const [selectedJobs, setSelectedJobs] = useState({ left: [], right: [] });
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverSide, setDragOverSide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState({ show: false, type: '', side: '', id: null, resumeId: null });

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    if (id1 && id2) {
      fetchData();
    }
  }, [id1, id2]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [res1, res2, skillsRes1, skillsRes2, jobsRes1, jobsRes2] = await Promise.all([
        axios.get(`${API_URL}/resumes/${id1}`),
        axios.get(`${API_URL}/resumes/${id2}`),
        axios.get(`${API_URL}/resumes/${id1}/skills`),
        axios.get(`${API_URL}/resumes/${id2}/skills`),
        axios.get(`${API_URL}/skills/user/jobs`),
        axios.get(`${API_URL}/skills/user/jobs`)
      ]);

      setResume1(res1.data);
      setResume2(res2.data);
      setSkills1(skillsRes1.data);
      setSkills2(skillsRes2.data);
      setJobs1(jobsRes1.data);
      setJobs2(jobsRes2.data);
      setError('');
    } catch (err) {
      setError('Failed to load resumes');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSkillSelection = (side, skillId) => {
    setSelectedSkills(prev => {
      const current = prev[side] || [];
      const index = current.indexOf(skillId);
      if (index > -1) {
        return { ...prev, [side]: current.filter(id => id !== skillId) };
      } else {
        return { ...prev, [side]: [...current, skillId] };
      }
    });
  };

  const toggleJobSelection = (side, jobId) => {
    setSelectedJobs(prev => {
      const current = prev[side] || [];
      const index = current.indexOf(jobId);
      if (index > -1) {
        return { ...prev, [side]: current.filter(id => id !== jobId) };
      } else {
        return { ...prev, [side]: [...current, jobId] };
      }
    });
  };

  const copyAll = (fromSide, toSide) => {
    // Copy selected skills
    const fromSkills = fromSide === 'left' ? skills1 : skills2;
    const toResumeId = toSide === 'left' ? id1 : id2;
    const selected = selectedSkills[fromSide] || [];
    
    const skillPromises = selected.map(skillId => {
      const skill = fromSkills.find(s => s.skill_id === skillId);
      if (skill) {
        // Add skill to target resume
        return axios.post(`${API_URL}/resumes/${toResumeId}/skills/${skillId}`)
          .catch(err => {
            // Ignore "already exists" errors
            if (err.response?.status !== 400) {
              console.error('Failed to copy skill:', err);
            }
          });
      }
      return Promise.resolve();
    });

    // Copy selected jobs
    const fromJobs = fromSide === 'left' ? jobs1 : jobs2;
    const toJobs = toSide === 'left' ? jobs1 : jobs2;
    const selectedJobIds = selectedJobs[fromSide] || [];
    
    const jobPromises = selectedJobIds.map(jobId => {
      const job = fromJobs.find(j => j.id === jobId);
      if (job && !toJobs.find(j => j.id === jobId)) {
        return axios.post(`${API_URL}/skills/user/jobs`, {
          company: job.company,
          position: job.position,
          description: job.description,
          start_date: job.start_date,
          end_date: job.end_date,
          skills_gained: job.skills_gained
        }).catch(err => console.error('Failed to copy job:', err));
      }
      return Promise.resolve();
    });

    Promise.all([...skillPromises, ...jobPromises]).then(() => {
      setSelectedSkills({ left: [], right: [] });
      setSelectedJobs({ left: [], right: [] });
      setTimeout(() => fetchData(), 500);
    });
  };

  const handleDragStart = (e, item, type, side) => {
    e.stopPropagation();
    const dragData = { item, type, side };
    setDraggedItem(dragData);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.dropEffect = 'move';
    // Store in multiple formats for compatibility
    e.dataTransfer.setData('text/plain', `${type}:${item}:${side}`);
    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    console.log(`Drag started: ${type} ${item} from ${side}`, dragData);
  };

  const handleDragOver = (e, side) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverSide(side);
  };

  const handleDragLeave = () => {
    setDragOverSide(null);
  };

  const handleDrop = async (e, toSide) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverSide(null);

    console.log('handleDrop called for side:', toSide);
    console.log('Current draggedItem state:', draggedItem);

    // Try to get drag data from dataTransfer as fallback
    let dragData = draggedItem;
    if (!dragData) {
      console.log('draggedItem is null, trying dataTransfer...');
      try {
        const jsonData = e.dataTransfer.getData('application/json');
        if (jsonData) {
          dragData = JSON.parse(jsonData);
          console.log('Got drag data from JSON:', dragData);
        } else {
          const textData = e.dataTransfer.getData('text/plain');
          if (textData) {
            const [type, item, side] = textData.split(':');
            dragData = { item: parseInt(item), type, side };
            console.log('Got drag data from text:', dragData);
          }
        }
      } catch (err) {
        console.error('Error parsing drag data:', err);
      }
    }

    if (!dragData) {
      console.error('No dragged item found in state or dataTransfer');
      alert('Failed to get drag data. Please try again.');
      return;
    }

    const { item, type, side: fromSide } = dragData;
    console.log('Processing drop:', { item, type, fromSide, toSide });

    if (fromSide === toSide) {
      console.log('Cannot drop on same side');
      setDraggedItem(null);
      return;
    }

    if (type === 'skill') {
      const fromResumeId = fromSide === 'left' ? id1 : id2;
      const toResumeId = toSide === 'left' ? id1 : id2;
      const skill = (fromSide === 'left' ? skills1 : skills2).find(s => s.skill_id === item);
      const toSkills = toSide === 'left' ? skills1 : skills2;
      
      console.log('Drag drop details:', {
        type,
        item,
        fromSide,
        toSide,
        fromResumeId,
        toResumeId,
        skillFound: !!skill,
        skillName: skill?.skill_name
      });
      
      // Check if skill already exists in target resume
      if (toSkills.find(s => s.skill_id === item)) {
        console.log('Skill already exists in target resume');
        alert('This skill is already in the target resume');
        setDraggedItem(null);
        return;
      }
      
      if (!skill) {
        console.error('❌ Skill not found in source resume. Looking for skill_id:', item);
        console.log('Available skills:', fromSide === 'left' ? skills1 : skills2);
        alert(`Skill not found in source resume. Skill ID: ${item}`);
        setDraggedItem(null);
        return;
      }
      
      console.log(`Copying skill ${item} (${skill.skill_name}) from resume ${fromResumeId} to resume ${toResumeId}`);
      
      // Add skill to target resume (axios already has auth header from AuthContext)
      try {
        const response = await axios.post(`${API_URL}/resumes/${toResumeId}/skills/${item}`);
        console.log('✅ Skill copied successfully:', response.data);
        setDraggedItem(null);
        // Force refresh after a short delay
        await new Promise(resolve => setTimeout(resolve, 300));
        await fetchData();
        console.log('✅ Data refreshed after skill copy');
      } catch (err) {
        console.error('❌ Failed to copy skill:', err);
        console.error('Error details:', {
          status: err.response?.status,
          data: err.response?.data,
          message: err.message,
          url: `${API_URL}/resumes/${toResumeId}/skills/${item}`
        });
        // Show error to user
        if (err.response?.status === 404) {
          if (err.response?.data?.error?.includes('Skill not found in your skills')) {
            alert('Skill not found in your skills. Please ensure the skill is unlocked first.');
          } else {
            alert('Resume or skill not found. Please try again.');
          }
        } else if (err.response?.status === 400) {
          // Skill already exists, just refresh
          console.log('Skill already exists, refreshing...');
          setDraggedItem(null);
          await new Promise(resolve => setTimeout(resolve, 300));
          await fetchData();
        } else {
          alert('Failed to copy skill: ' + (err.response?.data?.error || err.message || 'Unknown error'));
        }
        setDraggedItem(null);
      }
    } else if (type === 'job') {
      const job = (fromSide === 'left' ? jobs1 : jobs2).find(j => j.id === item);
      const toJobs = toSide === 'left' ? jobs1 : jobs2;
      
      if (job && !toJobs.find(j => j.id === item)) {
        axios.post(`${API_URL}/skills/user/jobs`, {
          company: job.company,
          position: job.position,
          description: job.description,
          start_date: job.start_date,
          end_date: job.end_date,
          skills_gained: job.skills_gained
        }).then(() => {
          setTimeout(() => fetchData(), 300);
        }).catch(err => console.error('Failed to copy job:', err));
      }
    }

    setDraggedItem(null);
  };

  const handleDeleteSkill = async (skillId, resumeId) => {
    try {
      await axios.delete(`${API_URL}/resumes/${resumeId}/skills/${skillId}`);
      await fetchData();
      setShowDeleteModal({ show: false, type: '', side: '', id: null });
    } catch (err) {
      console.error('Failed to delete skill:', err);
      alert('Failed to remove skill from resume: ' + (err.response?.data?.error || 'Unknown error'));
    }
  };

  const handleDeleteJob = async (jobId) => {
    try {
      await axios.delete(`${API_URL}/skills/user/jobs/${jobId}`);
      await fetchData();
      setShowDeleteModal({ show: false, type: '', side: '', id: null });
    } catch (err) {
      console.error('Failed to delete job:', err);
      alert('Failed to delete job: ' + (err.response?.data?.error || 'Unknown error'));
    }
  };

  if (loading) {
    return <Container className="resume-compare"><div className="text-center p-5">Loading...</div></Container>;
  }

  if (error || !resume1 || !resume2) {
    return (
      <Container className="resume-compare">
        <Alert variant="danger">{error || 'Resumes not found'}</Alert>
        <Button onClick={() => navigate('/resumes')}>Back to Resumes</Button>
      </Container>
    );
  }

  return (
    <Container className="resume-compare">
      <div className="resume-compare__header">
        <h1 className="resume-compare__title">Compare Resumes</h1>
        <Button variant="outline-secondary" onClick={() => navigate('/resumes')}>
          Back to Resumes
        </Button>
      </div>

      <Row className="resume-compare__row">
        {/* Left Resume */}
        <Col md={6} className="resume-compare__col">
          <Card className="resume-compare__card">
            <Card.Header className="resume-compare__card-header">
              <h3>{resume1.title}</h3>
              <Button
                variant="success"
                size="lg"
                className="resume-compare__copy-all-btn"
                onClick={() => copyAll('left', 'right')}
                disabled={
                  (!selectedSkills.left || selectedSkills.left.length === 0) &&
                  (!selectedJobs.left || selectedJobs.left.length === 0)
                }
              >
                → Copy All Selected
              </Button>
            </Card.Header>
            <Card.Body
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleDragOver(e, 'right');
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleDragLeave();
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Drop event triggered on right side');
                handleDrop(e, 'right');
              }}
              className={dragOverSide === 'right' ? 'resume-compare__drop-zone' : ''}
            >
              <div className="resume-compare__section">
                <h4>Skills</h4>
                {skills1.length === 0 ? (
                  <p className="text-muted">No skills</p>
                ) : (
                  <div className="resume-compare__skills">
                    {skills1.map(skill => (
                      <Badge
                        key={skill.skill_id}
                        bg={selectedSkills.left?.includes(skill.skill_id) ? 'primary' : 'secondary'}
                        className="resume-compare__skill-badge"
                        draggable={true}
                        onDragStart={(e) => {
                          e.stopPropagation();
                          handleDragStart(e, skill.skill_id, 'skill', 'left');
                        }}
                        onDragEnd={() => {
                          // Don't clear draggedItem here, let handleDrop do it
                        }}
                        onClick={() => toggleSkillSelection('left', skill.skill_id)}
                        style={{ cursor: 'grab', margin: '0.25rem' }}
                      >
                        {skill.skill_name} (Lv.{skill.user_level})
                        <Button
                          variant="link"
                          size="sm"
                          className="resume-compare__delete-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowDeleteModal({ show: true, type: 'skill', side: 'left', id: skill.skill_id, resumeId: id1 });
                          }}
                        >
                          ×
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="resume-compare__section">
                <h4>Job Experiences</h4>
                {jobs1.length === 0 ? (
                  <p className="text-muted">No job experiences</p>
                ) : (
                  <div className="resume-compare__jobs">
                    {jobs1.map(job => (
                      <Card
                        key={job.id}
                        className={`resume-compare__job-card ${selectedJobs.left?.includes(job.id) ? 'selected' : ''}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, job.id, 'job', 'left')}
                        onClick={() => toggleJobSelection('left', job.id)}
                        style={{ cursor: 'grab', marginBottom: '0.5rem' }}
                      >
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <h6>{job.position} at {job.company}</h6>
                              {job.start_date && (
                                <small className="text-muted">
                                  {new Date(job.start_date).toLocaleDateString()} - 
                                  {job.end_date ? new Date(job.end_date).toLocaleDateString() : 'Present'}
                                </small>
                              )}
                            </div>
                            <Button
                              variant="link"
                              size="sm"
                              className="text-danger"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowDeleteModal({ show: true, type: 'job', side: 'left', id: job.id });
                              }}
                            >
                              ×
                            </Button>
                          </div>
                        </Card.Body>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Right Resume */}
        <Col md={6} className="resume-compare__col">
          <Card className="resume-compare__card">
            <Card.Header className="resume-compare__card-header">
              <h3>{resume2.title}</h3>
              <Button
                variant="success"
                size="lg"
                className="resume-compare__copy-all-btn"
                onClick={() => copyAll('right', 'left')}
                disabled={
                  (!selectedSkills.right || selectedSkills.right.length === 0) &&
                  (!selectedJobs.right || selectedJobs.right.length === 0)
                }
              >
                ← Copy All Selected
              </Button>
            </Card.Header>
            <Card.Body
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleDragOver(e, 'left');
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleDragLeave();
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Drop event triggered on left side');
                handleDrop(e, 'left');
              }}
              className={dragOverSide === 'left' ? 'resume-compare__drop-zone' : ''}
            >
              <div className="resume-compare__section">
                <h4>Skills</h4>
                {skills2.length === 0 ? (
                  <p className="text-muted">No skills</p>
                ) : (
                  <div className="resume-compare__skills">
                    {skills2.map(skill => (
                      <Badge
                        key={skill.skill_id}
                        bg={selectedSkills.right?.includes(skill.skill_id) ? 'primary' : 'secondary'}
                        className="resume-compare__skill-badge"
                        draggable={true}
                        onDragStart={(e) => {
                          e.stopPropagation();
                          handleDragStart(e, skill.skill_id, 'skill', 'right');
                        }}
                        onDragEnd={() => {
                          // Don't clear draggedItem here, let handleDrop do it
                        }}
                        onClick={() => toggleSkillSelection('right', skill.skill_id)}
                        style={{ cursor: 'grab', margin: '0.25rem' }}
                      >
                        {skill.skill_name} (Lv.{skill.user_level})
                        <Button
                          variant="link"
                          size="sm"
                          className="resume-compare__delete-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowDeleteModal({ show: true, type: 'skill', side: 'right', id: skill.skill_id, resumeId: id2 });
                          }}
                        >
                          ×
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="resume-compare__section">
                <h4>Job Experiences</h4>
                {jobs2.length === 0 ? (
                  <p className="text-muted">No job experiences</p>
                ) : (
                  <div className="resume-compare__jobs">
                    {jobs2.map(job => (
                      <Card
                        key={job.id}
                        className={`resume-compare__job-card ${selectedJobs.right?.includes(job.id) ? 'selected' : ''}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, job.id, 'job', 'right')}
                        onClick={() => toggleJobSelection('right', job.id)}
                        style={{ cursor: 'grab', marginBottom: '0.5rem' }}
                      >
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <h6>{job.position} at {job.company}</h6>
                              {job.start_date && (
                                <small className="text-muted">
                                  {new Date(job.start_date).toLocaleDateString()} - 
                                  {job.end_date ? new Date(job.end_date).toLocaleDateString() : 'Present'}
                                </small>
                              )}
                            </div>
                            <Button
                              variant="link"
                              size="sm"
                              className="text-danger"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowDeleteModal({ show: true, type: 'job', side: 'right', id: job.id });
                              }}
                            >
                              ×
                            </Button>
                          </div>
                        </Card.Body>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal.show} onHide={() => setShowDeleteModal({ show: false, type: '', side: '', id: null })}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {showDeleteModal.type === 'skill' 
            ? 'Are you sure you want to remove this skill from this resume? (The skill will remain in your skills list)'
            : `Are you sure you want to delete this ${showDeleteModal.type}?`}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal({ show: false, type: '', side: '', id: null })}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              if (showDeleteModal.type === 'skill') {
                handleDeleteSkill(showDeleteModal.id, showDeleteModal.resumeId);
              } else if (showDeleteModal.type === 'job') {
                handleDeleteJob(showDeleteModal.id);
              }
            }}
          >
            {showDeleteModal.type === 'skill' ? 'Remove from Resume' : 'Delete'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ResumeCompare;

