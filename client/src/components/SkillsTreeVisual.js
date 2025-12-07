import React, { useState, useRef } from 'react';
import SkillNode from './SkillNode';
import './SkillsTreeVisual.css';

const SkillsTreeVisual = ({ treeData, allSkills, onSkillClick, selectedSkills = [] }) => {
  const [selectedNode, setSelectedNode] = useState(null);
  const [zoom, setZoom] = useState(1);
  const svgRef = useRef(null);

  // Create a map of all skills for quick lookup (handle both id and skill_id)
  const skillsMap = {};
  if (allSkills && Array.isArray(allSkills)) {
    allSkills.forEach(skill => {
      const skillId = skill.id || skill.skill_id;
      skillsMap[skillId] = { ...skill, id: skillId };
    });
  }

  // Create a set of selected skill IDs for quick lookup
  const selectedSkillIds = new Set(
    selectedSkills && Array.isArray(selectedSkills) 
      ? selectedSkills.map(s => s.id) 
      : []
  );

  // Organize nodes by tier
  const nodesByTier = {};
  if (treeData && Array.isArray(treeData)) {
    treeData.forEach(node => {
      if (!nodesByTier[node.tier]) {
        nodesByTier[node.tier] = [];
      }
      nodesByTier[node.tier].push(node);
    });
  }

  // Calculate connections between nodes
  const connections = (treeData && Array.isArray(treeData))
    ? treeData
        .filter(node => node.parent_skill_id)
        .map(node => {
          const parent = treeData.find(n => n.skill_id === node.parent_skill_id);
          if (parent) {
            return {
              from: { x: parent.position_x, y: parent.position_y },
              to: { x: node.position_x, y: node.position_y }
            };
          }
          return null;
        })
        .filter(Boolean)
    : [];

  const handleWheel = (e) => {
    // Only allow zoom on the container, not on nodes
    if (e.target.closest('.skill-node')) {
      e.stopPropagation();
      return;
    }
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.5, Math.min(2, prev * delta)));
  };

  const handleNodeClick = (e, node) => {
    e.stopPropagation(); // Prevent any parent handlers
    setSelectedNode(node);
    // Call onSkillClick to add/remove from selection
    if (onSkillClick) {
      onSkillClick(node.skill_id);
    }
  };

  // Calculate viewBox dimensions
  if (!treeData || treeData.length === 0) {
    return (
      <div className="skills-tree-visual">
        <div className="text-center p-5 text-white">
          No skills tree data available. Run <code>npm run seed:skills</code> to populate the database.
        </div>
      </div>
    );
  }

  // Calculate viewBox dimensions with padding
  const padding = 200;
  const positions = treeData && Array.isArray(treeData) && treeData.length > 0
    ? treeData.map(n => ({ x: n.position_x || 0, y: n.position_y || 0 }))
    : [{ x: 0, y: 0 }];
  const minX = Math.min(...positions.map(p => p.x), 0) - padding;
  const maxX = Math.max(...positions.map(p => p.x), 0) + padding;
  const minY = Math.min(...positions.map(p => p.y), 0) - padding;
  const maxY = Math.max(...positions.map(p => p.y), 0) + padding;
  const width = maxX - minX;
  const height = maxY - minY;
  
  // Calculate center point
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  
  // Adjust viewBox for zoom (zoom in = smaller viewBox, zoom out = larger viewBox)
  const zoomedWidth = width / zoom;
  const zoomedHeight = height / zoom;
  const zoomedMinX = centerX - zoomedWidth / 2;
  const zoomedMinY = centerY - zoomedHeight / 2;

  return (
    <div
      className="skills-tree-visual"
      onWheel={handleWheel}
    >
      <div className="skills-tree-visual__controls">
        <button
          className="skills-tree-visual__control-btn"
          onClick={() => setZoom(prev => Math.min(2, prev + 0.1))}
        >
          +
        </button>
        <button
          className="skills-tree-visual__control-btn"
          onClick={() => setZoom(prev => Math.max(0.5, prev - 0.1))}
        >
          −
        </button>
        <button
          className="skills-tree-visual__control-btn"
          onClick={() => setZoom(1)}
        >
          Reset
        </button>
        <span className="skills-tree-visual__zoom-info">{Math.round(zoom * 100)}%</span>
      </div>

      <svg
        ref={svgRef}
        className="skills-tree-visual__svg"
        viewBox={`${zoomedMinX} ${zoomedMinY} ${zoomedWidth} ${zoomedHeight}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Draw connections */}
        <g className="skills-tree-visual__connections">
          {connections.map((conn, idx) => (
            <line
              key={idx}
              x1={conn.from.x}
              y1={conn.from.y}
              x2={conn.to.x}
              y2={conn.to.y}
              stroke="#4CAF50"
              strokeWidth="3"
              opacity="0.6"
            />
          ))}
        </g>

        {/* Draw nodes */}
        <g className="skills-tree-visual__nodes">
          {(treeData && Array.isArray(treeData) ? treeData : []).map((node) => {
            const skill = skillsMap[node.skill_id];
            const isSelected = selectedSkillIds.has(node.skill_id);
            return (
              <SkillNode
                key={node.node_id}
                node={node}
                skill={skill}
                position={{ x: node.position_x || 0, y: node.position_y || 0 }}
                isSelected={isSelected || selectedNode?.node_id === node.node_id}
                onSelect={(e) => handleNodeClick(e, node)}
              />
            );
          })}
        </g>
      </svg>

      {/* Node details panel */}
      {selectedNode && skillsMap[selectedNode.skill_id] && (
        <div className="skills-tree-visual__details">
          <button
            className="skills-tree-visual__close-btn"
            onClick={() => setSelectedNode(null)}
          >
            ×
          </button>
          <h3>{skillsMap[selectedNode.skill_id].name}</h3>
          <p className="text-muted">{skillsMap[selectedNode.skill_id].description || 'No description available'}</p>
          <div className="skills-tree-visual__details-info">
            <p><strong>Type:</strong> {skillsMap[selectedNode.skill_id].skill_type === 'hard' ? 'Hard Skill' : 'Soft Skill'}</p>
            <p><strong>Category:</strong> {selectedNode.category_name || 'Uncategorized'}</p>
            <p><strong>Tier:</strong> {selectedNode.tier}</p>
            <p><strong>Status:</strong> {
              selectedSkillIds.has(selectedNode.skill_id) 
                ? <span className="text-success">Selected</span>
                : <span className="text-muted">Not Selected</span>
            }</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SkillsTreeVisual;

