# JDBmonad Circuit Interface

This project implements a circuit-inspired interface with holographic effects for the JDBmonad game, based on the provided design sketches.

## Created Components

### 1. CircuitBackground
An animated background that simulates electronic circuits with:
- Animated wavy lines
- Pulsating circuit nodes
- Holographic particles
- Moving color gradients
- Glow and shadow effects

**Props:**
- `intensity`: Controls the intensity of effects (0.1 - 2.0)
- `children`: Content to be rendered over the background

### 2. CircuitGrid
An interactive circuit grid with hourglass-shaped layout that includes:
- Segmented and empty nodes
- Side circuit elements
- "Combat Wall" indicator
- Animated connection lines
- Responsive layout

**Props:**
- `onItemSelect`: Callback for item selection
- `selectedItems`: Array of selected items
- `maxSelections`: Maximum number of selections allowed

### 3. CircuitDemo
A complete demonstration that integrates all components with:
- Intensity controls
- Statistics sidebar
- Selected items list
- Quick actions
- Responsive layout

## How to Use

### 1. Import components
```jsx
import CircuitBackground from './components/CircuitBackground';
import CircuitGrid from './components/CircuitGrid';
import CircuitDemo from './components/CircuitDemo';
```

### 2. Use CircuitBackground as wrapper
```jsx
<CircuitBackground intensity={1.5}>
  <div>Your content here</div>
</CircuitBackground>
```

### 3. Implement CircuitGrid
```jsx
const [selectedItems, setSelectedItems] = useState([]);

const handleItemSelect = (item) => {
  // Selection logic
};

<CircuitGrid
  onItemSelect={handleItemSelect}
  selectedItems={selectedItems}
  maxSelections={8}
/>
```

### 4. Use complete CircuitDemo
```jsx
<CircuitDemo />
```

## Integration with JDBmonad

To integrate with the existing game:

1. **Replace current background:**
   ```jsx
   // In App.jsx
   <CircuitBackground intensity={1}>
     {/* All existing content */}
   </CircuitBackground>
   ```

2. **Apply circuit styles to existing elements:**
   - Add `circuit-button` classes to buttons
   - Use `holographic-text` for titles
   - Apply `holographic-border` to cards

3. **Replace BettingGrid:**
   ```jsx
   // Instead of BettingGrid, use CircuitGrid
   <CircuitGrid
     onItemSelect={handleBetSelection}
     selectedItems={playerBets}
     maxSelections={maxBetsPerRaffle}
   />
   ```

## Technical Features

- **Canvas-based animations** for optimized performance
- **CSS Grid and Flexbox** for responsive layout
- **Holographic effects** with gradients and CSS animations
- **Intensity system** to control visual effects
- **Mobile-first design** with responsive breakpoints

## Customization

### Colors
Main colors can be changed in CSS:
- Blue: `#00bfff`
- Purple: `#8a2be2`
- Pink: `#ff1493`
- Green: `#00ff7f`

### Animations
- Animation speed can be adjusted in keyframes
- Glow effects can be modified via `box-shadow`
- Particles can be adjusted by changing `particleCount`

### Layout
- Node grid can be modified by changing `grid-template-columns`
- Side element positioning can be adjusted
- Node sizes can be customized

## Performance

- Uses `requestAnimationFrame` for smooth animations
- Canvas optimized with `will-change` and `transform: translateZ(0)`
- Debounce on resize events
- Automatic animation cleanup

## Compatibility

- **Modern browsers** with CSS Grid and Flexbox support
- **Mobile responsive** with optimized breakpoints
- **Fallbacks** for browsers without canvas support
- **Progressive enhancement** for advanced features

## Next Steps

1. **Smart contract integration** for betting functionality
2. **Sound system** for audio feedback
3. **Transition animations** between game states
4. **Customizable themes** for different game modes
5. **Performance optimizations** for mobile devices

## Complete Usage Example

```jsx
import React, { useState } from 'react';
import CircuitBackground from './components/CircuitBackground';
import CircuitGrid from './components/CircuitGrid';

function GameInterface() {
  const [selectedBets, setSelectedBets] = useState([]);
  const [circuitIntensity, setCircuitIntensity] = useState(1);

  const handleBetSelection = (item) => {
    setSelectedBets(prev => {
      const exists = prev.find(prevItem => prevItem.id === item.id);
      if (exists) {
        return prev.filter(prevItem => prevItem.id !== item.id);
      } else {
        return [...prev, item];
      }
    });
  };

  return (
    <CircuitBackground intensity={circuitIntensity}>
      <div className="game-container">
        <header>
          <h1 className="holographic-text">JDBmonad</h1>
          <input
            type="range"
            min="0.1"
            max="2"
            step="0.1"
            value={circuitIntensity}
            onChange={(e) => setCircuitIntensity(parseFloat(e.target.value))}
          />
        </header>
        
        <main>
          <CircuitGrid
            onItemSelect={handleBetSelection}
            selectedItems={selectedBets}
            maxSelections={8}
          />
        </main>
        
        <footer>
          <button className="circuit-button">
            Place Bet ({selectedBets.length})
          </button>
        </footer>
      </div>
    </CircuitBackground>
  );
}

export default GameInterface;
```

This circuit system provides a solid foundation for creating a modern and engaging game interface, maintaining the existing JDBmonad functionality while adding unique and interactive visual elements.
