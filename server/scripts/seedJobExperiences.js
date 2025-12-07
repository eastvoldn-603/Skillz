const { db } = require('../config/database');

const seedJobExperiences = () => {
  try {
    console.log('Seeding job experiences...');

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

    // Get skills for mapping
    const skills = db.prepare('SELECT id, name FROM skills').all();
    const skillMap = {};
    skills.forEach(skill => {
      skillMap[skill.name.toLowerCase()] = skill.id;
    });

    // Sample job experiences
    const jobExperiences = [
      {
        company: 'Tech Startup Inc',
        position: 'Junior Software Developer',
        description: 'Developed web applications using React and Node.js. Collaborated with team on agile projects. Participated in daily standups and sprint planning.',
        start_date: '2020-01-15',
        end_date: '2021-06-30',
        skills_gained: 'JavaScript, React, Node.js, Team Communication',
        skills: ['JavaScript', 'React', 'Node.js', 'Team Communication']
      },
      {
        company: 'Enterprise Solutions',
        position: 'Full Stack Developer',
        description: 'Built scalable applications with Express and PostgreSQL. Led code reviews and mentored junior developers. Implemented CI/CD pipelines and automated testing.',
        start_date: '2021-07-01',
        end_date: '2023-03-15',
        skills_gained: 'Express, PostgreSQL, Git, Team Leadership, Mentoring',
        skills: ['Express', 'PostgreSQL', 'Git', 'Team Leadership', 'Mentoring']
      },
      {
        company: 'Cloud Services Co',
        position: 'Senior Software Engineer',
        description: 'Architected cloud-based solutions using AWS and Docker. Managed DevOps pipelines and infrastructure. Led technical architecture decisions for multiple projects.',
        start_date: '2023-04-01',
        end_date: null, // Current job
        skills_gained: 'AWS, Docker, Kubernetes, Project Management',
        skills: ['AWS', 'Docker', 'Kubernetes', 'Project Management']
      },
      {
        company: 'Digital Agency Pro',
        position: 'Frontend Developer',
        description: 'Created responsive web interfaces using React and modern CSS. Collaborated with designers to implement pixel-perfect designs. Optimized performance and accessibility.',
        start_date: '2019-06-01',
        end_date: '2019-12-31',
        skills_gained: 'React, CSS, HTML, UI/UX Design, Performance Optimization',
        skills: ['React', 'CSS', 'HTML', 'UI/UX Design', 'Performance Optimization']
      },
      {
        company: 'Financial Tech Corp',
        position: 'Backend Developer',
        description: 'Developed secure APIs for financial transactions. Implemented authentication and authorization systems. Worked with PostgreSQL for data management and optimization.',
        start_date: '2018-03-01',
        end_date: '2019-05-31',
        skills_gained: 'Node.js, Express, PostgreSQL, Security, API Development',
        skills: ['Node.js', 'Express', 'PostgreSQL', 'Security', 'API Development']
      },
      {
        company: 'E-commerce Platform',
        position: 'Full Stack Developer',
        description: 'Built and maintained e-commerce platform handling thousands of daily transactions. Implemented payment processing, inventory management, and order tracking systems.',
        start_date: '2017-01-15',
        end_date: '2018-02-28',
        skills_gained: 'JavaScript, Node.js, Database Design, Payment Processing, System Architecture',
        skills: ['JavaScript', 'Node.js', 'Database Design', 'Payment Processing', 'System Architecture']
      },
      {
        company: 'Mobile App Studio',
        position: 'React Native Developer',
        description: 'Developed cross-platform mobile applications using React Native. Published apps to both iOS and Android stores. Implemented push notifications and analytics.',
        start_date: '2016-05-01',
        end_date: '2016-12-31',
        skills_gained: 'React Native, Mobile Development, iOS, Android, App Store',
        skills: ['React Native', 'Mobile Development', 'iOS', 'Android', 'App Store']
      },
      {
        company: 'Startup Accelerator',
        position: 'Software Engineering Intern',
        description: 'Assisted in developing MVP for multiple startups. Learned agile development practices and version control. Participated in code reviews and team meetings.',
        start_date: '2015-06-01',
        end_date: '2015-08-31',
        skills_gained: 'JavaScript, Git, Agile, Problem Solving, Collaboration',
        skills: ['JavaScript', 'Git', 'Agile', 'Problem Solving', 'Collaboration']
      },
      {
        company: 'Consulting Firm',
        position: 'Technical Consultant',
        description: 'Provided technical consulting to clients on software architecture and development best practices. Conducted code audits and performance reviews. Delivered training sessions.',
        start_date: '2022-01-10',
        end_date: '2023-03-20',
        skills_gained: 'Consulting, Technical Writing, Training, Code Review, Best Practices',
        skills: ['Consulting', 'Technical Writing', 'Training', 'Code Review', 'Best Practices']
      },
      {
        company: 'Open Source Project',
        position: 'Contributor',
        description: 'Contributed to open source projects. Fixed bugs, implemented features, and reviewed pull requests. Maintained documentation and helped new contributors.',
        start_date: '2019-01-01',
        end_date: null, // Ongoing
        skills_gained: 'Open Source, Git, Code Review, Documentation, Community Engagement',
        skills: ['Open Source', 'Git', 'Code Review', 'Documentation', 'Community Engagement']
      }
    ];

    let jobsCreated = 0;
    let skillsUnlocked = 0;

    for (const job of jobExperiences) {
      // Check if job already exists
      const existing = db.prepare(
        'SELECT id FROM job_experiences WHERE user_id = ? AND company = ? AND position = ?'
      ).get(userId, job.company, job.position);

      if (existing) {
        console.log(`  ⏭️  Skipping existing job: ${job.position} at ${job.company}`);
        continue;
      }

      // Insert job experience
      const result = db.prepare(`
        INSERT INTO job_experiences (user_id, company, position, description, start_date, end_date, skills_gained)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        userId,
        job.company,
        job.position,
        job.description,
        job.start_date,
        job.end_date,
        job.skills_gained
      );

      const jobId = result.lastInsertRowid;
      jobsCreated++;

      // Unlock skills
      const skillIds = [];
      const levels = [];
      const experiencePoints = [];

      for (const skillName of job.skills) {
        const skillId = skillMap[skillName.toLowerCase()];
        if (skillId) {
          skillIds.push(skillId);
          levels.push(1);
          experiencePoints.push(100);

          // Add to user_skills if not exists
          const existingSkill = db.prepare(
            'SELECT * FROM user_skills WHERE user_id = ? AND skill_id = ?'
          ).get(userId, skillId);

          if (!existingSkill) {
            db.prepare(`
              INSERT INTO user_skills (user_id, skill_id, level, experience_points, unlocked_at)
              VALUES (?, ?, 1, 100, CURRENT_TIMESTAMP)
            `).run(userId, skillId);
          } else {
            // Update if exists (increase level/XP)
            db.prepare(`
              UPDATE user_skills 
              SET level = MAX(level, 1), 
                  experience_points = experience_points + 100,
                  last_updated = CURRENT_TIMESTAMP
              WHERE user_id = ? AND skill_id = ?
            `).run(userId, skillId);
          }

          // Record in skill_unlocks
          db.prepare(`
            INSERT INTO skill_unlocks (job_experience_id, skill_id, level_granted, experience_points_granted)
            VALUES (?, ?, 1, 100)
          `).run(jobId, skillId);

          skillsUnlocked++;
        }
      }

      console.log(`  ✅ Added: ${job.position} at ${job.company} (unlocked ${skillIds.length} skills)`);
    }

    console.log('\n✅ Job experiences seeded successfully!');
    console.log(`   - ${jobsCreated} job experiences created`);
    console.log(`   - ${skillsUnlocked} skill unlocks created`);
  } catch (error) {
    console.error('Error seeding job experiences:', error);
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
      seedJobExperiences();
      console.log('\n✅ Job experiences seeding completed successfully!');
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

module.exports = seedJobExperiences;

