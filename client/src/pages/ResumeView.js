import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Button, Alert, Tabs, Tab } from 'react-bootstrap';
import axios from 'axios';
import SkillsTreeVisual from '../components/SkillsTreeVisual';
import './ResumeView.css';

const ResumeView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [resume, setResume] = useState(null);
  const [treeData, setTreeData] = useState([]);
  const [userSkills, setUserSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('text'); // 'text' or 'tree'

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resumeRes, treeRes, skillsRes] = await Promise.all([
        axios.get(`${API_URL}/resumes/${id}`),
        axios.get(`${API_URL}/skills/user/tree`),
        axios.get(`${API_URL}/skills/user`)
      ]);

      setResume(resumeRes.data);
      setTreeData(treeRes.data);
      setUserSkills(skillsRes.data);
      setError('');
    } catch (err) {
      setError('Failed to load resume');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const convertToText = () => {
    if (!userSkills || userSkills.length === 0) {
      return resume?.content || 'No skills or content available.';
    }

    let text = `RESUME: ${resume?.title || 'Untitled'}\n\n`;
    text += `Generated from Skills Tree\n`;
    text += `Date: ${new Date().toLocaleDateString()}\n\n`;
    text += '='.repeat(50) + '\n\n';

    // Skills by category
    const skillsByCategory = {};
    userSkills.forEach(skill => {
      const category = skill.category_name || 'Other';
      if (!skillsByCategory[category]) {
        skillsByCategory[category] = [];
      }
      skillsByCategory[category].push(skill);
    });

    text += 'SKILLS\n';
    text += '-'.repeat(50) + '\n';
    Object.keys(skillsByCategory).sort().forEach(category => {
      text += `\n${category}:\n`;
      skillsByCategory[category]
        .sort((a, b) => b.user_level - a.user_level)
        .forEach(skill => {
          text += `  • ${skill.skill_name} - Level ${skill.user_level}/${skill.max_level} (${skill.experience_points} XP)\n`;
        });
    });

    text += '\n' + '='.repeat(50) + '\n\n';

    // Job experiences (if available)
    text += 'EXPERIENCE\n';
    text += '-'.repeat(50) + '\n';
    text += '\n(Add job experiences in Skills Tree to see them here)\n';

    // Original content if exists
    if (resume?.content) {
      text += '\n' + '='.repeat(50) + '\n\n';
      text += 'ADDITIONAL INFORMATION\n';
      text += '-'.repeat(50) + '\n';
      text += resume.content;
    }

    return text;
  };

  const handleExportToText = () => {
    const textContent = convertToText();
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${resume?.title || 'resume'}_text.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyToClipboard = () => {
    const textContent = convertToText();
    navigator.clipboard.writeText(textContent).then(() => {
      alert('Resume text copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy:', err);
      alert('Failed to copy to clipboard');
    });
  };

  if (loading) {
    return <Container className="resume-view"><div className="text-center p-5">Loading...</div></Container>;
  }

  if (error || !resume) {
    return (
      <Container className="resume-view">
        <Alert variant="danger">{error || 'Resume not found'}</Alert>
        <Button onClick={() => navigate('/resumes')}>Back to Resumes</Button>
      </Container>
    );
  }

  return (
    <Container className="resume-view">
      <div className="resume-view__header">
        <h1 className="resume-view__title">{resume.title}</h1>
        <div className="resume-view__actions">
          <Button
            variant="outline-secondary"
            onClick={() => navigate(`/resumes/${id}/edit`)}
            className="me-2"
          >
            Edit
          </Button>
          <Button
            variant="outline-primary"
            onClick={() => setViewMode(viewMode === 'text' ? 'tree' : 'text')}
            className="me-2"
          >
            {viewMode === 'text' ? '🌳 View as Skills Tree' : '📄 View as Text'}
          </Button>
          {viewMode === 'tree' && (
            <>
              <Button
                variant="outline-success"
                onClick={handleCopyToClipboard}
                className="me-2"
              >
                📋 Copy to Clipboard
              </Button>
              <Button
                variant="outline-success"
                onClick={handleExportToText}
              >
                💾 Export as Text
              </Button>
            </>
          )}
        </div>
      </div>

      {viewMode === 'text' ? (
        <Card className="resume-view__card">
          <Card.Body>
            <div className="resume-view__text-content">
              {resume.content ? (
                <pre className="resume-view__pre">{resume.content}</pre>
              ) : (
                <Alert variant="info">
                  No content yet. Switch to Skills Tree view to generate resume from your skills, or edit to add content.
                </Alert>
              )}
            </div>
          </Card.Body>
        </Card>
      ) : (
        <Card className="resume-view__card">
          <Card.Body>
            <div className="resume-view__tree-header">
              <h3>Skills Tree View</h3>
              <p className="text-muted">
                Your resume visualized as a skills tree. Click on skills to see details.
              </p>
            </div>
            {treeData.length > 0 ? (
              <SkillsTreeVisual
                treeData={treeData}
                userSkills={userSkills}
                onSkillUpdate={() => {}}
                showOnlyUnlocked={true}
              />
            ) : (
              <Alert variant="info">
                No skills tree data available. Add job experiences in the Skills Tree page to unlock skills.
              </Alert>
            )}
            <div className="resume-view__converted-text mt-4">
              <Card>
                <Card.Header>
                  <strong>Text Preview</strong>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={handleCopyToClipboard}
                    className="float-end"
                  >
                    Copy
                  </Button>
                </Card.Header>
                <Card.Body>
                  <pre className="resume-view__pre-small">{convertToText()}</pre>
                </Card.Body>
              </Card>
            </div>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default ResumeView;

