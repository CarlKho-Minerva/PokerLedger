import React, { useMemo } from 'react';
import { Player } from '../types';

interface FloatingFacesProps {
  players: Player[];
}

const FloatingFaces: React.FC<FloatingFacesProps> = ({ players }) => {
  const faces = useMemo(() => {
    const activePlayers = players.filter(p => p.avatar);
    if (activePlayers.length === 0) return [];
    
    // Generate static random positions for visual flair
    return Array.from({ length: 12 }).map((_, i) => {
      const player = activePlayers[i % activePlayers.length];
      const isLeft = Math.random() > 0.5;
      
      // Strict margins: Left (0-15%) or Right (85-100%)
      const xPos = isLeft 
        ? Math.random() * 15 
        : 85 + Math.random() * 15;
      
      const yPos = Math.random() * 100;
      const size = 60 + Math.random() * 40; // 60px to 100px

      return {
        id: `face-${i}`,
        src: player.avatar,
        style: {
          left: `${xPos}%`,
          top: `${yPos}%`,
          width: `${size}px`,
          height: `${size}px`,
          transform: `rotate(${Math.random() * 30 - 15}deg)`,
          opacity: 0.15,
          animationDelay: `${Math.random() * 5}s`,
          animationDuration: `${5 + Math.random() * 5}s`
        }
      };
    });
  }, [players]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {faces.map((face) => (
        <img
          key={face.id}
          src={face.src}
          alt=""
          className="absolute rounded-full object-cover border-2 border-zinc-800 grayscale hover:grayscale-0 transition-all duration-1000 animate-float"
          style={face.style}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/90 via-zinc-950/80 to-zinc-950/90" />
    </div>
  );
};

export default FloatingFaces;
