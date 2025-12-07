const { db } = require('../config/database');

const seedResumes = () => {
  try {
    console.log('Seeding resumes...');

    // Get Nick Eastvold user account, or first user if not found
    let user = db.prepare("SELECT id FROM users WHERE email LIKE '%eastvold%' OR first_name LIKE '%Nick%' OR last_name LIKE '%Eastvold%' LIMIT 1").get();
    if (!user) {
      user = db.prepare('SELECT id FROM users LIMIT 1').get();
    }
    if (!user) {
      console.log('⚠️  No users found. Please create a user account first.');
      return;
    }

    const userId = user.id;
    const userInfo = db.prepare('SELECT email, first_name, last_name FROM users WHERE id = ?').get(userId);
    console.log(`Using user ID: ${userId} (${userInfo.first_name} ${userInfo.last_name} - ${userInfo.email})`);

    // Get user skills to associate with resumes
    const userSkills = db.prepare(`
      SELECT us.skill_id, s.name as skill_name, s.description, s.skill_type
      FROM user_skills us
      JOIN skills s ON us.skill_id = s.id
      WHERE us.user_id = ?
      ORDER BY us.last_updated DESC
    `).all(userId);

    if (userSkills.length === 0) {
      console.log('⚠️  No user skills found. Please run seed:skills and seed:job-experiences first.');
      return;
    }

    // Sample resumes
    const resumes = [
      {
        title: 'Software Engineer Resume',
        content: `Professional Summary:
Experienced software engineer with expertise in full-stack development, cloud technologies, and agile methodologies. Passionate about building scalable applications and leading technical teams.

Skills:
• JavaScript - Proficient in modern ES6+ features and frameworks
• React - Building responsive and interactive user interfaces
• Node.js - Developing scalable server-side applications
• Express - Creating RESTful APIs and microservices
• PostgreSQL - Database design and optimization
• Git - Version control and collaborative development
• Team Leadership - Mentoring junior developers and leading projects

Experience:
See job experiences for detailed work history.`
      },
      {
        title: 'Full Stack Developer Resume',
        content: `Professional Summary:
Full stack developer specializing in modern web technologies and cloud infrastructure. Strong background in both frontend and backend development with a focus on user experience and performance.

Technical Skills:
• Frontend: React, JavaScript, HTML5, CSS3
• Backend: Node.js, Express, REST APIs
• Databases: PostgreSQL, SQLite
• DevOps: Docker, CI/CD pipelines
• Tools: Git, VS Code, Postman

Projects:
• Built scalable web applications serving thousands of users
• Implemented microservices architecture for improved performance
• Led migration to cloud infrastructure`
      },
      {
        title: 'Senior Developer Resume',
        content: `Professional Summary:
Senior software engineer with extensive experience in enterprise-level application development. Proven track record of delivering high-quality software solutions and leading cross-functional teams.

Core Competencies:
• Software Architecture - Designing scalable and maintainable systems
• Team Leadership - Mentoring developers and driving technical decisions
• Project Management - Agile methodologies and sprint planning
• Cloud Technologies - AWS, Docker, Kubernetes
• Problem Solving - Debugging complex issues and optimizing performance

Achievements:
• Led team of 5 developers on critical product launches
• Reduced application load time by 40% through optimization
• Implemented CI/CD pipelines reducing deployment time by 60%`
      },
      {
        title: 'Frontend Specialist Resume',
        content: `Professional Summary:
Creative frontend developer with a passion for building beautiful and intuitive user interfaces. Expertise in modern JavaScript frameworks and responsive design.

Skills:
• React - Component-based architecture and state management
• JavaScript - ES6+, async programming, functional programming
• CSS - Flexbox, Grid, animations, responsive design
• UI/UX - User-centered design principles
• Testing - Jest, React Testing Library
• Performance - Code optimization and bundle size reduction

Portfolio Highlights:
• Designed and developed responsive web applications
• Improved user engagement by 35% through UI improvements
• Created reusable component libraries for faster development`
      },
      {
        title: 'Backend Engineer Resume',
        content: `Professional Summary:
Backend engineer specializing in API development, database optimization, and system architecture. Strong focus on security, scalability, and performance.

Technical Expertise:
• API Development - RESTful APIs, GraphQL, microservices
• Database Design - PostgreSQL, query optimization, data modeling
• Server Technologies - Node.js, Express, authentication
• Security - JWT, encryption, secure coding practices
• DevOps - Docker, CI/CD, monitoring and logging

Key Accomplishments:
• Built APIs handling 1M+ requests per day
• Reduced database query time by 50% through optimization
• Implemented comprehensive security measures`
      }
    ];

    let resumesCreated = 0;
    let skillsAssociated = 0;

    for (const resume of resumes) {
      // Check if resume already exists
      const existing = db.prepare(
        'SELECT id FROM resumes WHERE user_id = ? AND title = ?'
      ).get(userId, resume.title);

      if (existing) {
        console.log(`  ⏭️  Skipping existing resume: ${resume.title}`);
        continue;
      }

      // Insert resume
      const result = db.prepare(`
        INSERT INTO resumes (user_id, title, content)
        VALUES (?, ?, ?)
      `).run(userId, resume.title, resume.content);

      const resumeId = result.lastInsertRowid;
      resumesCreated++;

      // Associate some skills with the resume (random selection)
      const skillsToAdd = userSkills.slice(0, Math.min(5 + Math.floor(Math.random() * 5), userSkills.length));
      
      for (const skill of skillsToAdd) {
        try {
          db.prepare(`
            INSERT INTO resume_skills (resume_id, skill_id)
            VALUES (?, ?)
          `).run(resumeId, skill.skill_id);
          skillsAssociated++;
        } catch (error) {
          // Ignore duplicate errors
          if (error.code !== 'SQLITE_CONSTRAINT_UNIQUE') {
            throw error;
          }
        }
      }

      console.log(`  ✅ Added: ${resume.title} (${skillsToAdd.length} skills)`);
    }

    console.log('\n✅ Resumes seeded successfully!');
    console.log(`   - ${resumesCreated} resumes created`);
    console.log(`   - ${skillsAssociated} skill associations created`);
  } catch (error) {
    console.error('Error seeding resumes:', error);
    throw error;
  }
};

// Run if called directly
if (require.main === module) {
  const { connect } = require('../config/database');
  
  console.log('Initializing database connection...');
  connect((err) => {
    if (err) {
      console.error('Database connection failed:', err);
      process.exit(1);
    }
    
    console.log('Database connected. Starting seed...');
    try {
      seedResumes();
      console.log('\n✅ Resume seeding completed successfully!');
      const { db } = require('../config/database');
      db.close();
      process.exit(0);
    } catch (error) {
      console.error('Error during seeding:', error);
      const { db } = require('../config/database');
      db.close();
      process.exit(1);
    }
  });
}

module.exports = seedResumes;

