import React, { useState } from 'react';
import './CircuitGrid.css';

const CircuitGrid = ({ onItemSelect, selectedItems = [], maxSelections = 8 }) => {
  const [hoveredItem, setHoveredItem] = useState(null);

  // Circuit nodes data - inspired by the sketch
  const circuitNodes = [
    { id: 'node-1', type: 'segmented', size: 'large', position: 'center-left', value: 1 },
    { id: 'node-2', type: 'segmented', size: 'small', position: 'top', value: 2 },
    { id: 'node-3', type: 'segmented', size: 'small', position: 'right', value: 3 },
    { id: 'node-4', type: 'segmented', size: 'small', position: 'bottom', value: 4 },
    { id: 'node-5', type: 'segmented', size: 'small', position: 'far-right', value: 5 },
    { id: 'node-6', type: 'empty', size: 'small', position: 'top-right', value: 6 },
    { id: 'node-7', type: 'empty', size: 'small', position: 'bottom-middle', value: 7 },
    { id: 'node-8', type: 'empty', size: 'small', position: 'bottom-middle-2', value: 8 }
  ];

  // Side circuit elements
  const sideNodes = Array.from({ length: 5 }, (_, i) => ({
    id: `side-${i + 1}`,
    position: i < 3 ? 'left' : 'right',
    index: i
  }));

  const handleNodeClick = (node) => {
    if (onItemSelect) {
      onItemSelect(node);
    }
  };

  const isSelected = (nodeId) => selectedItems.some(item => item.id === nodeId);

  return (
    <div className="circuit-grid-container">
      {/* Main hourglass outline */}
      <div className="hourglass-outline">
        {/* Top section */}
        <div className="top-section">
          <div className="title-box holographic-text">
            <div>MONA NI MAL</div>
            <div>GAME</div>
          </div>
          <div className="time-display">10.53 MON</div>
          <div className="divider"></div>
          <div className="section-title">ULTIMO SORTEO</div>
        </div>

        {/* Middle section - Circuit nodes */}
        <div className="middle-section">
          <div className="circuit-nodes-grid">
            {circuitNodes.map((node) => (
              <div
                key={node.id}
                className={`circuit-node-item ${node.type} ${node.size} ${node.position} ${
                  isSelected(node.id) ? 'selected' : ''
                } ${hoveredItem === node.id ? 'hovered' : ''}`}
                onClick={() => handleNodeClick(node)}
                onMouseEnter={() => setHoveredItem(node.id)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                {node.type === 'segmented' ? (
                  <div className="segmented-circle">
                    {Array.from({ length: 6 }, (_, i) => (
                      <div key={i} className="segment" style={{ transform: `rotate(${i * 60}deg)` }}></div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-circle"></div>
                )}
                <div className="node-value">{node.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom section - Large ovals */}
        <div className="bottom-section">
          <div className="large-oval top-oval">
            <div className="oval-content">Interaction Zone 1</div>
          </div>
          <div className="large-oval bottom-oval">
            <div className="oval-content">Interaction Zone 2</div>
          </div>
        </div>
      </div>

      {/* Side circuit elements */}
      <div className="side-nodes left-nodes">
        {sideNodes.filter(node => node.position === 'left').map((node) => (
          <div key={node.id} className="side-node" style={{ top: `${node.index * 20}%` }}>
            <div className="side-node-inner"></div>
          </div>
        ))}
      </div>

      <div className="side-nodes right-nodes">
        {sideNodes.filter(node => node.position === 'right').map((node) => (
          <div key={node.id} className="side-node" style={{ top: `${node.index * 20}%` }}>
            <div className="side-node-inner"></div>
          </div>
        ))}
      </div>

      {/* Combat Wall indicator */}
      <div className="combat-wall-indicator">
        <div className="combat-wall-circle">
          <span>COMBAT WALL</span>
        </div>
      </div>

      {/* Circuit lines connecting nodes */}
      <div className="circuit-connections">
        <div className="circuit-line horizontal-line"></div>
        <div className="circuit-line vertical-line"></div>
        <div className="circuit-line diagonal-line-1"></div>
        <div className="circuit-line diagonal-line-2"></div>
      </div>
    </div>
  );
};

export default CircuitGrid;
