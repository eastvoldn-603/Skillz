import React from 'react';
import './SkillNode.css';

const SkillNode = ({ node, skill, position, isSelected, onSelect }) => {
  // Determine node color based on selection status
  const getNodeColor = () => {
    if (isSelected) return '#00E676'; // Bright green - selected
    return '#4A90E2'; // Default blue
  };

  const nodeColor = getNodeColor();
  const categoryColor = node.category_color || '#4A90E2';

  const handleClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (onSelect) {
      onSelect(e);
    }
  };

  const skillName = skill?.name || node.skill_name || 'Unknown';
  const skillIcon = node.icon || skillName.charAt(0).toUpperCase();

  return (
    <g
      className={`skill-node ${isSelected ? 'skill-node--selected' : ''}`}
      transform={`translate(${position.x}, ${position.y})`}
      onClick={handleClick}
      onMouseDown={(e) => e.stopPropagation()}
      onMouseEnter={(e) => e.stopPropagation()}
      onMouseLeave={(e) => e.stopPropagation()}
      style={{ cursor: 'pointer' }}
    >
      {/* Outer ring for category color */}
      <circle
        r="50"
        fill={categoryColor}
        opacity="0.3"
      />
      
      {/* Main node circle - bigger */}
      <circle
        r="45"
        fill={nodeColor}
        stroke={isSelected ? '#fff' : categoryColor}
        strokeWidth={isSelected ? '4' : '3'}
        className="skill-node__circle"
      />

      {/* Skill icon or first letter - bigger */}
      <text
        x="0"
        y="0"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="32"
        fill="#fff"
        fontWeight="bold"
        className="skill-node__icon"
      >
        {skillIcon}
      </text>

      {/* Skill name below icon */}
      <text
        x="0"
        y="65"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="14"
        fill="#fff"
        fontWeight="bold"
        className="skill-node__name"
      >
        {skillName.length > 12 ? skillName.substring(0, 12) + '...' : skillName}
      </text>

      {/* Tooltip on hover */}
      <title>
        {skillName}
        {skill?.description ? ` - ${skill.description}` : ''}
      </title>
    </g>
  );
};

export default SkillNode;

