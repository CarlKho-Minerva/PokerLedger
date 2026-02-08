import React, { useMemo, useState } from 'react';
import { Player, GameSession } from '../types';
import { generateChartData, getPlayerColor } from '../utils/logic';
import { Maximize2, Minimize2 } from 'lucide-react';

interface WinningsChartProps {
  players: Player[];
  sessions: GameSession[];
}

const WinningsChart: React.FC<WinningsChartProps> = ({ players, sessions }) => {
  const [expanded, setExpanded] = useState(false);

  const { data, minVal, maxVal, activePlayers } = useMemo(() => {
    const data = generateChartData(players, sessions);
    let min = 0;
    let max = 0;
    
    // Find active players (those who have played at least once or have non-zero score)
    const activeIds = new Set<string>();

    data.forEach(d => {
      Object.entries(d.scores).forEach(([pid, score]) => {
        if (score !== 0) activeIds.add(pid);
        if (score < min) min = score;
        if (score > max) max = score;
      });
    });

    // Add some padding to Y axis
    const padding = Math.max(Math.abs(max - min) * 0.1, 10);
    
    return { 
      data, 
      minVal: min - padding, 
      maxVal: max + padding,
      activePlayers: players.filter(p => activeIds.has(p.id))
    };
  }, [players, sessions]);

  if (sessions.length === 0) return null;

  const width = 1000;
  const height = expanded ? 600 : 300;
  const paddingX = 60;
  const paddingY = 40;
  
  const getX = (index: number) => paddingX + (index / (data.length - 1)) * (width - paddingX * 2);
  const getY = (value: number) => height - (paddingY + ((value - minVal) / (maxVal - minVal)) * (height - paddingY * 2));

  return (
    <div className={`bg-zinc-900/60 backdrop-blur-md rounded-2xl border border-zinc-800 p-4 transition-all duration-500 ${expanded ? 'h-[650px]' : 'h-[350px]'}`}>
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Performance History</h3>
        <button onClick={() => setExpanded(!expanded)} className="text-zinc-500 hover:text-emerald-400 transition">
          {expanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        </button>
      </div>
      
      <div className="w-full h-full overflow-hidden relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
          {/* Grid lines */}
          <line x1={paddingX} y1={getY(0)} x2={width - paddingX} y2={getY(0)} stroke="#3f3f46" strokeWidth="1" strokeDasharray="4 4" />
          
          {/* Player Lines */}
          {activePlayers.map(player => {
            const points = data.map((d, i) => `${getX(i)},${getY(d.scores[player.id])}`).join(' ');
            const color = getPlayerColor(player.id);
            const lastPoint = data[data.length - 1];
            const lastY = getY(lastPoint.scores[player.id]);
            const lastX = getX(data.length - 1);

            return (
              <g key={player.id}>
                <polyline
                  points={points}
                  fill="none"
                  stroke={color}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.8"
                  className="hover:opacity-100 transition-opacity duration-300"
                />
                
                {/* Avatar at the end of the line */}
                <foreignObject x={lastX + 5} y={lastY - 12} width="24" height="24">
                  <div className="w-6 h-6 rounded-full border border-zinc-700 overflow-hidden" style={{ borderColor: color }}>
                    {player.avatar ? (
                      <img src={player.avatar} alt={player.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-zinc-800" />
                    )}
                  </div>
                </foreignObject>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export default WinningsChart;
