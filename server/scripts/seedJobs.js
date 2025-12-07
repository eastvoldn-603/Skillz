const { db, connect } = require('../config/database');

// TEMPORARY JOBS FOR TESTING - These will not be used in production
const sampleJobs = [
  {
    title: 'Senior Software Engineer',
    company: 'Tech Corp',
    description: 'We are looking for an experienced software engineer to join our team. You will work on cutting-edge technologies and help build scalable applications.',
    location: 'San Francisco, CA',
    salary: '$120,000 - $150,000'
  },
  {
    title: 'Full Stack Developer',
    company: 'StartupXYZ',
    description: 'Join our fast-growing startup as a full stack developer. Work with React, Node.js, and modern cloud technologies.',
    location: 'Remote',
    salary: '$90,000 - $120,000'
  },
  {
    title: 'Frontend Developer',
    company: 'Design Studio',
    description: 'Looking for a creative frontend developer to build beautiful user interfaces. Experience with React and CSS required.',
    location: 'New York, NY',
    salary: '$85,000 - $110,000'
  },
  {
    title: 'Backend Engineer',
    company: 'Cloud Services Inc',
    description: 'Seeking a backend engineer to design and implement scalable APIs and microservices. Experience with Node.js and databases required.',
    location: 'Austin, TX',
    salary: '$100,000 - $130,000'
  },
  {
    title: 'DevOps Engineer',
    company: 'Infrastructure Co',
    description: 'Join our DevOps team to manage cloud infrastructure and CI/CD pipelines. Experience with Azure, Docker, and Terraform preferred.',
    location: 'Seattle, WA',
    salary: '$110,000 - $140,000'
  },
  {
    title: 'Product Manager',
    company: 'Innovation Labs',
    description: 'Lead product development initiatives and work closely with engineering teams. Strong technical background and communication skills required.',
    location: 'Boston, MA',
    salary: '$130,000 - $160,000'
  },
  {
    title: 'Data Scientist',
    company: 'Analytics Pro',
    description: 'Analyze large datasets and build machine learning models. Python, SQL, and statistical analysis experience required.',
    location: 'Chicago, IL',
    salary: '$115,000 - $145,000'
  },
  {
    title: 'Mobile App Developer',
    company: 'Mobile First Inc',
    description: 'Develop native and cross-platform mobile applications. Experience with React Native or Flutter preferred.',
    location: 'Los Angeles, CA',
    salary: '$95,000 - $125,000'
  },
  {
    title: 'Security Engineer',
    company: 'Secure Systems',
    description: 'Implement security best practices and conduct security audits. Experience with penetration testing and security protocols required.',
    location: 'Washington, DC',
    salary: '$125,000 - $155,000'
  },
  {
    title: 'QA Automation Engineer',
    company: 'Quality Assurance Co',
    description: 'Design and implement automated testing frameworks. Experience with Selenium, Cypress, or similar tools required.',
    location: 'Denver, CO',
    salary: '$80,000 - $110,000'
  }
];

const seedJobs = async () => {
  try {
    console.log('Seeding jobs...');
    
    // Connect to database
    connect((err) => {
      if (err) {
        console.error('Database connection failed:', err);
        process.exit(1);
      }

      // Clear existing jobs (optional - remove if you want to keep existing)
      // db.prepare('DELETE FROM jobs').run();

      // Insert sample jobs
      const insert = db.prepare('INSERT INTO jobs (title, company, description, location, salary) VALUES (?, ?, ?, ?, ?)');
      
      for (const job of sampleJobs) {
        const existing = db.prepare('SELECT id FROM jobs WHERE title = ? AND company = ?').get(job.title, job.company);
        if (!existing) {
          insert.run(job.title, job.company, job.description, job.location, job.salary);
        }
      }
      
      console.log(`Successfully seeded ${sampleJobs.length} jobs`);
      process.exit(0);
    });
  } catch (error) {
    console.error('Error seeding jobs:', error);
    process.exit(1);
  }
};

// Run seed
seedJobs();
