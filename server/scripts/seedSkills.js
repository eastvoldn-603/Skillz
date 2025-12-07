const { db } = require('../config/database');

const seedSkills = () => {
  try {
    console.log('Seeding skills tree...');

    // Insert skill categories
    const categories = [
      { name: 'Programming Languages', description: 'Technical programming skills', icon: '💻', color: '#4A90E2' },
      { name: 'Frameworks & Libraries', description: 'Development frameworks and tools', icon: '⚙️', color: '#50C878' },
      { name: 'Databases', description: 'Database technologies', icon: '🗄️', color: '#FF6B6B' },
      { name: 'DevOps & Cloud', description: 'Infrastructure and deployment', icon: '☁️', color: '#FFA500' },
      { name: 'Communication', description: 'Interpersonal and communication skills', icon: '💬', color: '#9B59B6' },
      { name: 'Leadership', description: 'Management and leadership abilities', icon: '👥', color: '#E74C3C' },
      { name: 'Problem Solving', description: 'Analytical and problem-solving skills', icon: '🧩', color: '#3498DB' },
      { name: 'Design', description: 'UI/UX and design skills', icon: '🎨', color: '#E91E63' }
    ];

    const categoryMap = {};
    for (const cat of categories) {
      const existing = db.prepare('SELECT id FROM skill_categories WHERE name = ?').get(cat.name);
      if (!existing) {
        const result = db.prepare('INSERT INTO skill_categories (name, description, icon, color) VALUES (?, ?, ?, ?)')
          .run(cat.name, cat.description, cat.icon, cat.color);
        categoryMap[cat.name] = result.lastInsertRowid;
      } else {
        categoryMap[cat.name] = existing.id;
      }
    }

    // Insert skills
    const skills = [
      // Hard Skills - Programming Languages
      { name: 'JavaScript', description: 'JavaScript programming language', skill_type: 'hard', category: 'Programming Languages', max_level: 10, icon: '🟨' },
      { name: 'Python', description: 'Python programming language', skill_type: 'hard', category: 'Programming Languages', max_level: 10, icon: '🐍' },
      { name: 'Java', description: 'Java programming language', skill_type: 'hard', category: 'Programming Languages', max_level: 10, icon: '☕' },
      { name: 'C++', description: 'C++ programming language', skill_type: 'hard', category: 'Programming Languages', max_level: 10, icon: '⚡' },
      { name: 'TypeScript', description: 'TypeScript programming language', skill_type: 'hard', category: 'Programming Languages', max_level: 10, icon: '🔷' },
      
      // Hard Skills - Frameworks
      { name: 'React', description: 'React framework', skill_type: 'hard', category: 'Frameworks & Libraries', max_level: 10, icon: '⚛️' },
      { name: 'Node.js', description: 'Node.js runtime', skill_type: 'hard', category: 'Frameworks & Libraries', max_level: 10, icon: '🟢' },
      { name: 'Express', description: 'Express.js framework', skill_type: 'hard', category: 'Frameworks & Libraries', max_level: 10, icon: '🚂' },
      { name: 'Vue.js', description: 'Vue.js framework', skill_type: 'hard', category: 'Frameworks & Libraries', max_level: 10, icon: '💚' },
      { name: 'Angular', description: 'Angular framework', skill_type: 'hard', category: 'Frameworks & Libraries', max_level: 10, icon: '🅰️' },
      
      // Hard Skills - Databases
      { name: 'SQL', description: 'SQL database language', skill_type: 'hard', category: 'Databases', max_level: 10, icon: '🗃️' },
      { name: 'MongoDB', description: 'MongoDB NoSQL database', skill_type: 'hard', category: 'Databases', max_level: 10, icon: '🍃' },
      { name: 'PostgreSQL', description: 'PostgreSQL database', skill_type: 'hard', category: 'Databases', max_level: 10, icon: '🐘' },
      { name: 'Redis', description: 'Redis in-memory database', skill_type: 'hard', category: 'Databases', max_level: 10, icon: '🔴' },
      
      // Hard Skills - DevOps
      { name: 'Docker', description: 'Docker containerization', skill_type: 'hard', category: 'DevOps & Cloud', max_level: 10, icon: '🐳' },
      { name: 'Kubernetes', description: 'Kubernetes orchestration', skill_type: 'hard', category: 'DevOps & Cloud', max_level: 10, icon: '⚓' },
      { name: 'AWS', description: 'Amazon Web Services', skill_type: 'hard', category: 'DevOps & Cloud', max_level: 10, icon: '☁️' },
      { name: 'Git', description: 'Version control with Git', skill_type: 'hard', category: 'DevOps & Cloud', max_level: 10, icon: '📦' },
      
      // Soft Skills
      { name: 'Team Communication', description: 'Effective team communication', skill_type: 'soft', category: 'Communication', max_level: 10, icon: '💬' },
      { name: 'Public Speaking', description: 'Public speaking and presentations', skill_type: 'soft', category: 'Communication', max_level: 10, icon: '🎤' },
      { name: 'Written Communication', description: 'Clear written communication', skill_type: 'soft', category: 'Communication', max_level: 10, icon: '✍️' },
      { name: 'Team Leadership', description: 'Leading teams effectively', skill_type: 'soft', category: 'Leadership', max_level: 10, icon: '👑' },
      { name: 'Project Management', description: 'Managing projects and timelines', skill_type: 'soft', category: 'Leadership', max_level: 10, icon: '📊' },
      { name: 'Mentoring', description: 'Mentoring and coaching others', skill_type: 'soft', category: 'Leadership', max_level: 10, icon: '🎓' },
      { name: 'Critical Thinking', description: 'Analytical and critical thinking', skill_type: 'soft', category: 'Problem Solving', max_level: 10, icon: '🧠' },
      { name: 'Debugging', description: 'Systematic problem debugging', skill_type: 'soft', category: 'Problem Solving', max_level: 10, icon: '🔍' },
      { name: 'UI Design', description: 'User interface design', skill_type: 'hard', category: 'Design', max_level: 10, icon: '🎨' },
      { name: 'UX Design', description: 'User experience design', skill_type: 'hard', category: 'Design', max_level: 10, icon: '✨' }
    ];

    const skillMap = {};
    for (const skill of skills) {
      const categoryId = categoryMap[skill.category];
      const existing = db.prepare('SELECT id FROM skills WHERE name = ?').get(skill.name);
      if (!existing) {
        const result = db.prepare('INSERT INTO skills (category_id, name, description, skill_type, max_level, icon) VALUES (?, ?, ?, ?, ?, ?)')
          .run(categoryId, skill.name, skill.description, skill.skill_type, skill.max_level, skill.icon);
        skillMap[skill.name] = result.lastInsertRowid;
      } else {
        skillMap[skill.name] = existing.id;
      }
    }

    // Create skill tree structure (tiered progression)
    // Tier 1: Foundation skills (no prerequisites)
    const tier1Skills = ['JavaScript', 'Python', 'SQL', 'Team Communication', 'Critical Thinking'];
    let positionX = 0;
    for (const skillName of tier1Skills) {
      if (skillMap[skillName]) {
        const existing = db.prepare('SELECT id FROM skill_tree_nodes WHERE skill_id = ?').get(skillMap[skillName]);
        if (!existing) {
          db.prepare('INSERT INTO skill_tree_nodes (skill_id, parent_skill_id, position_x, position_y, tier) VALUES (?, NULL, ?, 0, 1)')
            .run(skillMap[skillName], positionX);
        }
        positionX += 200;
      }
    }

    // Tier 2: Intermediate skills (require tier 1)
    const tier2Skills = [
      { name: 'React', parent: 'JavaScript' },
      { name: 'Node.js', parent: 'JavaScript' },
      { name: 'TypeScript', parent: 'JavaScript' },
      { name: 'Express', parent: 'Node.js' },
      { name: 'MongoDB', parent: 'SQL' },
      { name: 'PostgreSQL', parent: 'SQL' },
      { name: 'Public Speaking', parent: 'Team Communication' },
      { name: 'Written Communication', parent: 'Team Communication' },
      { name: 'Debugging', parent: 'Critical Thinking' }
    ];

    positionX = 0;
    for (const skill of tier2Skills) {
      if (skillMap[skill.name] && skillMap[skill.parent]) {
        const existing = db.prepare('SELECT id FROM skill_tree_nodes WHERE skill_id = ?').get(skillMap[skill.name]);
        if (!existing) {
          db.prepare('INSERT INTO skill_tree_nodes (skill_id, parent_skill_id, position_x, position_y, tier) VALUES (?, ?, ?, 200, 2)')
            .run(skillMap[skill.name], skillMap[skill.parent], positionX);
        }
        positionX += 200;
      }
    }

    // Tier 3: Advanced skills
    const tier3Skills = [
      { name: 'Vue.js', parent: 'React' },
      { name: 'Angular', parent: 'TypeScript' },
      { name: 'Docker', parent: 'Node.js' },
      { name: 'Git', parent: 'Node.js' },
      { name: 'Team Leadership', parent: 'Public Speaking' },
      { name: 'Project Management', parent: 'Written Communication' },
      { name: 'Mentoring', parent: 'Team Leadership' }
    ];

    positionX = 0;
    for (const skill of tier3Skills) {
      if (skillMap[skill.name] && skillMap[skill.parent]) {
        const existing = db.prepare('SELECT id FROM skill_tree_nodes WHERE skill_id = ?').get(skillMap[skill.name]);
        if (!existing) {
          db.prepare('INSERT INTO skill_tree_nodes (skill_id, parent_skill_id, position_x, position_y, tier) VALUES (?, ?, ?, 400, 3)')
            .run(skillMap[skill.name], skillMap[skill.parent], positionX);
        }
        positionX += 200;
      }
    }

    // Tier 4: Expert skills
    const tier4Skills = [
      { name: 'Kubernetes', parent: 'Docker' },
      { name: 'AWS', parent: 'Docker' },
      { name: 'Redis', parent: 'PostgreSQL' }
    ];

    positionX = 0;
    for (const skill of tier4Skills) {
      if (skillMap[skill.name] && skillMap[skill.parent]) {
        const existing = db.prepare('SELECT id FROM skill_tree_nodes WHERE skill_id = ?').get(skillMap[skill.name]);
        if (!existing) {
          db.prepare('INSERT INTO skill_tree_nodes (skill_id, parent_skill_id, position_x, position_y, tier) VALUES (?, ?, ?, 600, 4)')
            .run(skillMap[skill.name], skillMap[skill.parent], positionX);
        }
        positionX += 200;
      }
    }

    console.log('✅ Skills tree seeded successfully!');
    console.log(`   - ${categories.length} categories`);
    console.log(`   - ${skills.length} skills`);
    console.log(`   - Skill tree structure created with tiers`);

  } catch (error) {
    console.error('Error seeding skills:', error);
    throw error;
  }
};

// Run if called directly
if (require.main === module) {
  // Initialize database connection first
  const { connect } = require('../config/database');
  
  console.log('Initializing database connection...');
  connect((err) => {
    if (err) {
      console.error('Database connection failed:', err);
      process.exit(1);
    }
    
    console.log('Database connected. Starting seed...');
    try {
      seedSkills();
      console.log('\n✅ Skills tree seeding completed successfully!');
      // Close database connection
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

module.exports = seedSkills;

