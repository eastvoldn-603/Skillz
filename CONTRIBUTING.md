# Contributing to Skillz

Thank you for your interest in contributing to Skillz! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Respect different viewpoints and experiences

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone <your-fork-url>`
3. Create a branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Test your changes
6. Commit with clear messages
7. Push to your fork
8. Create a Pull Request

## Development Setup

See the main [README.md](README.md) for installation instructions.

## Coding Standards

### JavaScript/Node.js

- Use ES6+ features
- Follow async/await patterns
- Use meaningful variable names
- Add JSDoc comments for functions
- Keep functions small and focused

### React

- Use functional components with hooks
- Keep components small and reusable
- Use PropTypes or TypeScript for type checking
- Follow React best practices

### CSS

- Use BEM naming convention
- Keep styles modular
- Use CSS variables for theming
- Ensure responsive design

### Git Commit Messages

Follow conventional commits:

```
type(scope): subject

body

footer
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance tasks

Example:
```
feat(resumes): add ability to duplicate resumes

Users can now duplicate existing resumes to create new ones quickly.
This saves time when creating similar resumes for different positions.
```

## Testing

- Write tests for new features
- Ensure all tests pass before submitting PR
- Aim for good test coverage
- Test edge cases

## Pull Request Process

1. Update README.md if needed
2. Update CHANGELOG.md if applicable
3. Ensure all tests pass
4. Request review from maintainers
5. Address review comments
6. Wait for approval before merging

## Feature Requests

Open an issue with:
- Clear description
- Use case
- Proposed solution (if any)
- Alternatives considered

## Bug Reports

Include:
- Description of the bug
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots (if applicable)
- Environment details

## Questions?

Open an issue with the `question` label or contact maintainers.

Thank you for contributing!

