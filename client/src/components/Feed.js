import React, { useEffect, useState } from 'react';
import { Card, Form, Button, Spinner, Alert } from 'react-bootstrap';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './Feed.css';

const Feed = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [newPost, setNewPost] = useState('');
  const [error, setError] = useState('');

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchFeed();
    // Refresh feed every 30 seconds
    const interval = setInterval(fetchFeed, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchFeed = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/feed`);
      setPosts(response.data);
      setError('');
    } catch (error) {
      console.error('Failed to fetch feed:', error);
      setError('Failed to load feed');
    } finally {
      setLoading(false);
    }
  };

  const handlePost = async (e) => {
    e.preventDefault();
    if (!newPost.trim()) return;

    try {
      setPosting(true);
      const response = await axios.post(`${API_URL}/feed`, { content: newPost });
      setPosts([response.data, ...posts]);
      setNewPost('');
      setError('');
    } catch (error) {
      console.error('Failed to create post:', error);
      setError('Failed to create post');
    } finally {
      setPosting(false);
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="feed">
      <Card className="feed__card">
        <Card.Header className="feed__header">
          <h5 className="mb-0">📢 Feed</h5>
        </Card.Header>
        <Card.Body className="feed__body">
          {/* Post Creation Form */}
          <Form onSubmit={handlePost} className="feed__post-form mb-3">
            <Form.Group>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="What's on your mind?"
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                className="feed__post-input"
                maxLength={1000}
              />
              <div className="feed__post-actions mt-2">
                <small className="text-muted">{newPost.length}/1000</small>
                <Button 
                  type="submit" 
                  variant="primary" 
                  size="sm"
                  disabled={!newPost.trim() || posting}
                  className="feed__post-button"
                >
                  {posting ? <Spinner size="sm" /> : 'Post'}
                </Button>
              </div>
            </Form.Group>
          </Form>

          {error && <Alert variant="danger" className="feed__alert">{error}</Alert>}

          {/* Feed Posts */}
          {loading ? (
            <div className="feed__loading text-center py-4">
              <Spinner animation="border" />
            </div>
          ) : posts.length === 0 ? (
            <div className="feed__empty text-center py-4 text-muted">
              <p>No posts yet. Connect with people to see their updates!</p>
            </div>
          ) : (
            <div className="feed__posts">
              {posts.map((post) => (
                <Card key={post.id} className="feed__post-card mb-3">
                  <Card.Body>
                    <div className="feed__post-header">
                      <div className="feed__post-author">
                        <strong>
                          {post.first_name} {post.last_name}
                        </strong>
                      </div>
                      <small className="text-muted feed__post-time">
                        {formatTimeAgo(post.created_at)}
                      </small>
                    </div>
                    <div className="feed__post-content mt-2">
                      {post.content}
                    </div>
                  </Card.Body>
                </Card>
              ))}
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default Feed;

