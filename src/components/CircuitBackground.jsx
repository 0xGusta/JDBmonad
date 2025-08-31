import React, { useEffect, useRef } from 'react';
import './CircuitBackground.css';

const CircuitBackground = ({ children, intensity = 1 }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let time = 0;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const drawCircuit = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Create gradient background
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
      gradient.addColorStop(0, 'rgba(255, 20, 147, 0.1)'); // Pink
      gradient.addColorStop(0.3, 'rgba(138, 43, 226, 0.1)'); // Purple
      gradient.addColorStop(0.6, 'rgba(0, 191, 255, 0.1)'); // Blue
      gradient.addColorStop(1, 'rgba(0, 255, 127, 0.1)'); // Green
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw main circuit paths
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      // Main horizontal circuit
      drawCircuitPath(ctx, 0, centerY, canvas.width, centerY, time, intensity);
      
      // Vertical branches
      drawCircuitPath(ctx, centerX, 0, centerX, canvas.height, time, intensity);
      
      // Diagonal circuits
      drawCircuitPath(ctx, 0, 0, canvas.width, canvas.height, time, intensity);
      drawCircuitPath(ctx, canvas.width, 0, 0, canvas.height, time, intensity);
      
      // Curved circuits
      drawCurvedCircuit(ctx, centerX, centerY, 200, time, intensity);
      
      // Circuit nodes
      drawCircuitNodes(ctx, centerX, centerY, time, intensity);
      
      // Holographic particles
      drawHolographicParticles(ctx, time, intensity);
      
      time += 0.02;
      animationRef.current = requestAnimationFrame(drawCircuit);
    };

    const drawCircuitPath = (ctx, x1, y1, x2, y2, time, intensity) => {
      const segments = 50;
      ctx.strokeStyle = `hsl(${200 + Math.sin(time) * 30}, 70%, 60%)`;
      ctx.lineWidth = 2 * intensity;
      ctx.lineCap = 'round';
      
      ctx.beginPath();
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const x = x1 + (x2 - x1) * t;
        const y = y1 + (y2 - y1) * t;
        const wave = Math.sin(t * 10 + time * 2) * 20 * intensity;
        
        if (i === 0) {
          ctx.moveTo(x, y + wave);
        } else {
          ctx.lineTo(x, y + wave);
        }
      }
      ctx.stroke();
      
      // Add glow effect
      ctx.shadowColor = `hsl(${200 + Math.sin(time) * 30}, 70%, 60%)`;
      ctx.shadowBlur = 10 * intensity;
      ctx.stroke();
      ctx.shadowBlur = 0;
    };

    const drawCurvedCircuit = (ctx, centerX, centerY, radius, time, intensity) => {
      ctx.strokeStyle = `hsl(${280 + Math.sin(time * 0.5) * 40}, 80%, 70%)`;
      ctx.lineWidth = 3 * intensity;
      ctx.lineCap = 'round';
      
      ctx.beginPath();
      for (let angle = 0; angle <= Math.PI * 2; angle += 0.1) {
        const wave = Math.sin(angle * 8 + time * 3) * 15 * intensity;
        const x = centerX + (radius + wave) * Math.cos(angle);
        const y = centerY + (radius + wave) * Math.sin(angle);
        
        if (angle === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.stroke();
      
      // Add glow
      ctx.shadowColor = `hsl(${280 + Math.sin(time * 0.5) * 40}, 80%, 70%)`;
      ctx.shadowBlur = 15 * intensity;
      ctx.stroke();
      ctx.shadowBlur = 0;
    };

    const drawCircuitNodes = (ctx, centerX, centerY, time, intensity) => {
      const nodes = [
        { x: centerX, y: centerY, size: 8 },
        { x: centerX - 150, y: centerY - 150, size: 6 },
        { x: centerX + 150, y: centerY + 150, size: 6 },
        { x: centerX - 150, y: centerY + 150, size: 6 },
        { x: centerX + 150, y: centerY - 150, size: 6 }
      ];
      
      nodes.forEach((node, index) => {
        const pulse = Math.sin(time * 3 + index) * 0.3 + 1;
        const hue = (200 + index * 60 + time * 50) % 360;
        
        ctx.fillStyle = `hsl(${hue}, 80%, 60%)`;
        ctx.shadowColor = `hsl(${hue}, 80%, 60%)`;
        ctx.shadowBlur = 20 * intensity * pulse;
        
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size * pulse * intensity, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner core
        ctx.fillStyle = `hsl(${hue}, 100%, 80%)`;
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(node.x, node.y, (node.size * 0.5) * pulse * intensity, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    const drawHolographicParticles = (ctx, time, intensity) => {
      const particleCount = 30 * intensity;
      
      for (let i = 0; i < particleCount; i++) {
        const x = (Math.sin(time * 0.5 + i * 0.5) * 0.5 + 0.5) * canvas.width;
        const y = (Math.cos(time * 0.3 + i * 0.7) * 0.5 + 0.5) * canvas.height;
        const size = Math.sin(time + i) * 2 + 2;
        const hue = (i * 12 + time * 100) % 360;
        const alpha = Math.sin(time + i) * 0.5 + 0.5;
        
        ctx.fillStyle = `hsla(${hue}, 80%, 70%, ${alpha * 0.3 * intensity})`;
        ctx.shadowColor = `hsl(${hue}, 80%, 70%)`;
        ctx.shadowBlur = size * 2 * intensity;
        
        ctx.beginPath();
        ctx.arc(x, y, size * intensity, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    drawCircuit();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [intensity]);

  return (
    <div className="circuit-background">
      <canvas
        ref={canvasRef}
        className="circuit-canvas"
        style={{ position: 'absolute', top: 0, left: 0, zIndex: -1 }}
      />
      <div className="circuit-content">
        {children}
      </div>
    </div>
  );
};

export default CircuitBackground;
