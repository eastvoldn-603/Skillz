import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Form, InputGroup } from 'react-bootstrap';
import axios from 'axios';
import Feed from '../components/Feed';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    resumes: 0,
    applications: 0,
    offers: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const navigate = useNavigate();

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [resumesRes, applicationsRes, offersRes] = await Promise.all([
        axios.get(`${API_URL}/resumes`),
        axios.get(`${API_URL}/jobs/applications/all`),
        axios.get(`${API_URL}/jobs/offers/all`)
      ]);

      setStats({
        resumes: resumesRes.data.length,
        applications: applicationsRes.data.length,
        offers: offersRes.data.length
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setShowSearchResults(false);
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/jobs`);
      const allJobs = response.data;
      const filtered = allJobs.filter(job => 
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (job.description && job.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (job.location && job.location.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setSearchResults(filtered);
      setShowSearchResults(true);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const handleJobClick = (jobId) => {
    navigate(`/jobs/${jobId}`);
    setShowSearchResults(false);
    setSearchQuery('');
  };

  if (loading) {
    return <Container className="dashboard"><div className="text-center p-5">Loading...</div></Container>;
  }

  return (
    <Container className="dashboard">
      <h1 className="dashboard__title">Home Page</h1>
      
      <Row>
        {/* Feed on Left Side */}
        <Col md={4} className="mb-4">
          <Feed />
        </Col>
        
        {/* Main Content on Right Side */}
        <Col md={8}>
          {/* Job Search Bar */}
          <Row className="mb-4">
            <Col className="mx-auto">
          <Card className="dashboard__search-card">
            <Card.Body>
              <Form onSubmit={handleSearch}>
                <InputGroup size="lg">
                  <Form.Control
                    type="text"
                    placeholder="Search for jobs by title, company, location, or description..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (!e.target.value.trim()) {
                        setShowSearchResults(false);
                      }
                    }}
                    className="dashboard__search-input"
                  />
                  <Button type="submit" variant="primary" className="dashboard__search-button">
                    🔍 Search
                  </Button>
                </InputGroup>
              </Form>
              
              {/* Search Results */}
              {showSearchResults && searchResults.length > 0 && (
                <div className="dashboard__search-results mt-3">
                  <h6 className="mb-2">Search Results ({searchResults.length})</h6>
                  <div className="dashboard__search-results-list">
                    {searchResults.map((job) => (
                      <Card 
                        key={job.id} 
                        className="dashboard__search-result-card mb-2"
                        onClick={() => handleJobClick(job.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <Card.Body>
                          <Card.Title className="dashboard__search-result-title">
                            {job.title}
                          </Card.Title>
                          <Card.Subtitle className="mb-2 text-muted">
                            {job.company}
                          </Card.Subtitle>
                          {job.location && (
                            <Card.Text className="small text-muted mb-0">
                              📍 {job.location}
                            </Card.Text>
                          )}
                        </Card.Body>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
              
              {showSearchResults && searchResults.length === 0 && (
                <div className="dashboard__search-no-results mt-3 text-center text-muted">
                  No jobs found matching your search.
                </div>
              )}
            </Card.Body>
            </Card>
          </Col>
        </Row>
        
        <Row className="dashboard__stats">
        <Col md={4} className="mb-4">
          <Card className="dashboard__card">
            <Card.Body>
              <Card.Title className="dashboard__card-title">Resumes</Card.Title>
              <Card.Text className="dashboard__card-number">{stats.resumes}</Card.Text>
              <Button as={Link} to="/resumes" variant="primary" className="dashboard__card-button">
                Manage Resumes
              </Button>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4} className="mb-4">
          <Card className="dashboard__card">
            <Card.Body>
              <Card.Title className="dashboard__card-title">Applications</Card.Title>
              <Card.Text className="dashboard__card-number">{stats.applications}</Card.Text>
              <Button as={Link} to="/applications" variant="primary" className="dashboard__card-button">
                View Applications
              </Button>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4} className="mb-4">
          <Card className="dashboard__card">
            <Card.Body>
              <Card.Title className="dashboard__card-title">Job Offers</Card.Title>
              <Card.Text className="dashboard__card-number">{stats.offers}</Card.Text>
              <Button as={Link} to="/offers" variant="primary" className="dashboard__card-button">
                View Offers
              </Button>
            </Card.Body>
          </Card>
          </Col>
        </Row>
        <Row>
          <Col>
            <Card className="dashboard__card">
              <Card.Body>
                <Card.Title>Quick Actions</Card.Title>
                <div className="dashboard__actions">
                  <Button as={Link} to="/resumes/new" variant="success" className="dashboard__action-button">
                    Create New Resume
                  </Button>
                  <Button as={Link} to="/jobs" variant="info" className="dashboard__action-button">
                    Browse Jobs
                  </Button>
                  <Button as={Link} to="/profile" variant="secondary" className="dashboard__action-button">
                    Edit Profile
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;

