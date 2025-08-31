import React, { useState } from 'react';
import CircuitBackground from './CircuitBackground';
import CircuitGrid from './CircuitGrid';
import './CircuitDemo.css';

const CircuitDemo = () => {
  const [selectedItems, setSelectedItems] = useState([]);
  const [intensity, setIntensity] = useState(1);
  const [showGrid, setShowGrid] = useState(true);

  const handleItemSelect = (item) => {
    setSelectedItems(prev => {
      const exists = prev.find(prevItem => prevItem.id === item.id);
      if (exists) {
        return prev.filter(prevItem => prevItem.id !== item.id);
      } else {
        return [...prev, item];
      }
    });
  };

  const handleIntensityChange = (e) => {
    setIntensity(parseFloat(e.target.value));
  };

  return (
    <CircuitBackground intensity={intensity}>
      <div className="circuit-demo">
        <header className="demo-header">
          <h1 className="holographic-text">JDBmonad Circuit Interface</h1>
          <div className="controls">
            <label>
              Circuit Intensity:
              <input
                type="range"
                min="0.1"
                max="2"
                step="0.1"
                value={intensity}
                onChange={handleIntensityChange}
                className="intensity-slider"
              />
              <span>{intensity.toFixed(1)}</span>
            </label>
            <button
              className="circuit-button"
              onClick={() => setShowGrid(!showGrid)}
            >
              {showGrid ? 'Hide Grid' : 'Show Grid'}
            </button>
          </div>
        </header>

        <main className="demo-main">
          {showGrid ? (
            <CircuitGrid
              onItemSelect={handleItemSelect}
              selectedItems={selectedItems}
              maxSelections={8}
            />
          ) : (
            <div className="placeholder-content">
              <h2 className="holographic-text">Circuit Interface</h2>
              <p>Click "Show Grid" to see the interactive circuit layout</p>
            </div>
          )}
        </main>

        <aside className="demo-sidebar">
          <div className="sidebar-section holographic-border">
            <h3>Selected Items</h3>
            {selectedItems.length === 0 ? (
              <p>No items selected</p>
            ) : (
              <ul className="selected-items-list">
                {selectedItems.map(item => (
                  <li key={item.id} className="selected-item">
                    <span className="item-type">{item.type}</span>
                    <span className="item-value">{item.value}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="sidebar-section holographic-border">
            <h3>Circuit Stats</h3>
            <div className="stat-item">
              <span>Selected:</span>
              <span className="stat-value">{selectedItems.length}/8</span>
            </div>
            <div className="stat-item">
              <span>Intensity:</span>
              <span className="stat-value">{intensity.toFixed(1)}</span>
            </div>
            <div className="stat-item">
              <span>Status:</span>
              <span className="stat-value active">Active</span>
            </div>
          </div>

          <div className="sidebar-section">
            <h3>Quick Actions</h3>
            <button className="circuit-button">Reset Selection</button>
            <button className="circuit-button">Export Data</button>
            <button className="circuit-button">Save Configuration</button>
          </div>
        </aside>

        <footer className="demo-footer">
          <div className="circuit-line"></div>
          <p>JDBmonad Circuit Interface - Powered by Monad Blockchain</p>
          <div className="circuit-line"></div>
        </footer>
      </div>
    </CircuitBackground>
  );
};

export default CircuitDemo;
