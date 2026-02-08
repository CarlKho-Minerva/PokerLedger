import React, { useState, useEffect, useRef } from 'react';
import { HashRouter } from 'react-router-dom';
import { Player, GameSession, ViewState, PlayerSessionInput, Settlement } from './types';
import { STORAGE_KEY, NAV_ITEMS } from './constants';
import { recalculatePlayerStats } from './utils/logic';
import FloatingFaces from './components/FloatingFaces';
import PlayerManager from './components/PlayerManager';
import ActiveGame from './components/ActiveGame';
import WinningsChart from './components/WinningsChart';
import { Trophy, TrendingUp, TrendingDown, History as HistoryIcon, Edit, Trash2, Download, Upload, Settings } from 'lucide-react';

// Robust storage hook with recalculation capability
function usePokerData() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [sessions, setSessions] = useState<GameSession[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setPlayers(parsed.players || []);
        setSessions(parsed.sessions || []);
      } catch (e) {
        console.error("Failed to load data", e);
      }
    }
  }, []);

  // Centralized save function that ensures consistency
  const saveAndRecalculate = (currentPlayers: Player[], currentSessions: GameSession[]) => {
    const recalculatedPlayers = recalculatePlayerStats(currentPlayers, currentSessions);
    setPlayers(recalculatedPlayers);
    setSessions(currentSessions);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ players: recalculatedPlayers, sessions: currentSessions }));
  };

  const importData = (jsonData: string) => {
    try {
      const parsed = JSON.parse(jsonData);
      if (parsed.players && Array.isArray(parsed.sessions)) {
        saveAndRecalculate(parsed.players, parsed.sessions);
        alert("Data imported successfully!");
      } else {
        alert("Invalid file format.");
      }
    } catch (e) {
      alert("Failed to parse JSON file.");
    }
  };

  return { players, sessions, saveAndRecalculate, importData };
}

export default function App() {
  const { players, sessions, saveAndRecalculate, importData } = usePokerData();
  const [view, setView] = useState<ViewState>('DASHBOARD');
  const [editingSession, setEditingSession] = useState<GameSession | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Close settings when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addPlayer = (player: Player) => {
    saveAndRecalculate([...players, player], sessions);
  };

  const deletePlayer = (id: string) => {
    if (confirm("Are you sure? This won't delete their history records, but they will be removed from future selection.")) {
      saveAndRecalculate(players.filter(p => p.id !== id), sessions);
    }
  };

  const deleteSession = (sessionId: string) => {
    if (confirm("Delete this game record? Player stats will be updated.")) {
      const newSessions = sessions.filter(s => s.id !== sessionId);
      saveAndRecalculate(players, newSessions);
    }
  }

  const handleFinishGame = (settlements: Settlement[], inputs: PlayerSessionInput[]) => {
    if (editingSession) {
      const updatedSessions = sessions.map(s => 
        s.id === editingSession.id 
          ? { ...s, players: inputs, settlements } 
          : s
      );
      saveAndRecalculate(players, updatedSessions);
      setEditingSession(null);
    } else {
      const newSession: GameSession = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        players: inputs,
        settlements
      };
      saveAndRecalculate(players, [newSession, ...sessions]);
    }
    setView('DASHBOARD');
  };

  const startEdit = (session: GameSession) => {
    setEditingSession(session);
    setView('NEW_GAME');
  };

  const cancelEdit = () => {
    setEditingSession(null);
    if (view === 'NEW_GAME') setView('HISTORY');
  };

  const handleExport = () => {
    const dataStr = JSON.stringify({ players, sessions }, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `poker-club-data-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowSettings(false);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
    setShowSettings(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        importData(text);
      };
      reader.readAsText(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const isEditing = editingSession !== null;

  const renderContent = () => {
    if (view === 'NEW_GAME') {
      return (
        <ActiveGame 
          allPlayers={players} 
          onFinishGame={handleFinishGame} 
          initialSession={editingSession}
          onCancel={isEditing ? cancelEdit : undefined}
        />
      );
    }

    switch (view) {
      case 'PLAYERS':
        return <PlayerManager players={players} onAddPlayer={addPlayer} onDeletePlayer={deletePlayer} />;
      case 'HISTORY':
        return (
          <div className="max-w-2xl mx-auto p-4 space-y-4">
             <h2 className="text-2xl font-bold mb-6 text-emerald-400 flex items-center gap-2">
                <HistoryIcon /> Match History
             </h2>
             {sessions.length === 0 ? <div className="text-zinc-500">No games played yet.</div> : null}
             {sessions.map(s => (
               <div key={s.id} className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-xl group hover:border-zinc-600 transition">
                  <div className="flex justify-between items-center mb-4 border-b border-zinc-800 pb-2">
                    <div className="flex flex-col">
                       <span className="text-zinc-400 text-sm">{new Date(s.date).toLocaleDateString()}</span>
                       <span className="text-zinc-600 text-xs">{new Date(s.date).toLocaleTimeString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <button 
                        onClick={() => startEdit(s)}
                        className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition" 
                        title="Edit Session"
                       >
                         <Edit size={16} />
                       </button>
                       <button 
                        onClick={() => deleteSession(s.id)}
                        className="p-2 bg-zinc-800 hover:bg-rose-900 text-rose-400 rounded-lg transition"
                        title="Delete Session"
                       >
                         <Trash2 size={16} />
                       </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {s.settlements.map((settle, i) => {
                       const fromName = players.find(p => p.id === settle.fromId)?.name || 'Unknown';
                       const toName = players.find(p => p.id === settle.toId)?.name || 'Unknown';
                       return (
                         <div key={i} className="text-sm flex justify-between text-zinc-300">
                           <span>{fromName} <span className="text-zinc-600">→</span> {toName}</span>
                           <span className="text-emerald-400 font-mono">${settle.amount}</span>
                         </div>
                       )
                    })}
                    {s.settlements.length === 0 && <div className="text-zinc-500 text-sm italic text-center">Break even</div>}
                  </div>
               </div>
             ))}
          </div>
        );
      case 'DASHBOARD':
      default:
        const sortedByWinnings = [...players].sort((a, b) => b.totalWinnings - a.totalWinnings);
        const biggestWinner = sortedByWinnings[0];
        const biggestLoser = sortedByWinnings[sortedByWinnings.length - 1];

        return (
          <div className="max-w-4xl mx-auto p-4 space-y-6">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white mb-2 uppercase italic drop-shadow-xl">
                Poker<span className="text-emerald-500">Ledger</span>
              </h1>
              <p className="text-zinc-400">University Club Tracker</p>
            </div>

            {/* Chart */}
            <WinningsChart players={players} sessions={sessions} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Winner Card */}
              <div className="bg-gradient-to-br from-emerald-900/50 to-zinc-900 border border-emerald-800/50 p-6 rounded-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
                  <Trophy size={100} />
                </div>
                <h3 className="text-emerald-400 font-bold uppercase tracking-wider text-sm mb-2 flex items-center gap-2">
                  <TrendingUp size={16} /> Semester King
                </h3>
                {biggestWinner && biggestWinner.totalWinnings > 0 ? (
                   <div className="flex items-center gap-4">
                     <div className="w-16 h-16 rounded-full border-2 border-emerald-400 overflow-hidden bg-black">
                        {biggestWinner.avatar && <img src={biggestWinner.avatar} className="w-full h-full object-cover" />}
                     </div>
                     <div>
                       <div className="text-2xl font-bold text-white">{biggestWinner.name}</div>
                       <div className="text-emerald-300 font-mono text-xl">+${biggestWinner.totalWinnings.toFixed(2)}</div>
                     </div>
                   </div>
                ) : (
                  <div className="text-zinc-500 italic">No games played yet</div>
                )}
              </div>

              {/* Loser Card */}
               <div className="bg-gradient-to-br from-rose-900/20 to-zinc-900 border border-rose-900/30 p-6 rounded-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
                  <TrendingDown size={100} />
                </div>
                <h3 className="text-rose-400 font-bold uppercase tracking-wider text-sm mb-2 flex items-center gap-2">
                  <TrendingDown size={16} /> Needs Improvement
                </h3>
                {biggestLoser && biggestLoser.totalWinnings < 0 ? (
                   <div className="flex items-center gap-4">
                     <div className="w-16 h-16 rounded-full border-2 border-rose-500 overflow-hidden bg-black filter grayscale hover:grayscale-0 transition">
                        {biggestLoser.avatar && <img src={biggestLoser.avatar} className="w-full h-full object-cover" />}
                     </div>
                     <div>
                       <div className="text-2xl font-bold text-white">{biggestLoser.name}</div>
                       <div className="text-rose-300 font-mono text-xl">${biggestLoser.totalWinnings.toFixed(2)}</div>
                     </div>
                   </div>
                ) : (
                  <div className="text-zinc-500 italic">No data yet</div>
                )}
              </div>
            </div>

            {/* Overall Leaderboard */}
            <div className="bg-zinc-900/60 backdrop-blur-md rounded-2xl border border-zinc-800 p-6">
              <h3 className="text-xl font-bold text-white mb-4">Leaderboard</h3>
              <div className="space-y-3">
                {sortedByWinnings.map((p, i) => (
                  <div key={p.id} className="flex items-center justify-between p-3 hover:bg-zinc-800/50 rounded-lg transition">
                    <div className="flex items-center gap-3">
                      <span className="text-zinc-600 font-mono w-6">#{i + 1}</span>
                      <div className="w-8 h-8 rounded-full bg-zinc-800 overflow-hidden">
                        {p.avatar && <img src={p.avatar} className="w-full h-full object-cover" />}
                      </div>
                      <span className="font-semibold text-zinc-200">{p.name}</span>
                    </div>
                    <div className={`font-mono font-bold ${p.totalWinnings >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {p.totalWinnings > 0 ? '+' : ''}{p.totalWinnings.toFixed(2)}
                    </div>
                  </div>
                ))}
                {sortedByWinnings.length === 0 && <div className="text-center text-zinc-500 py-4">Add players to start tracking</div>}
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <HashRouter>
      <div className="h-[100vh] flex flex-col bg-zinc-950 text-white font-sans selection:bg-emerald-500/30 overflow-hidden relative">
        <FloatingFaces players={players} />
        
        {/* Header - Fixed */}
        <header className="flex justify-between items-center p-4 bg-zinc-950/80 backdrop-blur-md z-40 border-b border-zinc-800 shrink-0">
          <div className="font-bold text-emerald-500">PokerLedger</div>
          <div className="relative" ref={settingsRef}>
             <button onClick={() => setShowSettings(!showSettings)} className="p-2 text-zinc-400 hover:text-white transition">
               <Settings size={20} />
             </button>
             {showSettings && (
               <div className="absolute right-0 top-full mt-2 w-48 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl p-2 flex flex-col gap-1 z-50">
                 <button onClick={handleExport} className="flex items-center gap-2 p-2 hover:bg-zinc-800 rounded-lg text-sm text-left w-full">
                   <Download size={16} /> Export JSON
                 </button>
                 <button onClick={handleImportClick} className="flex items-center gap-2 p-2 hover:bg-zinc-800 rounded-lg text-sm text-left w-full">
                   <Upload size={16} /> Import JSON
                 </button>
                 <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".json" />
               </div>
             )}
          </div>
        </header>

        {/* Main Content - Scrollable */}
        <main className="flex-1 overflow-y-auto relative z-10 pb-24 scrollbar-hide">
          {renderContent()}
        </main>

        {/* Navigation - Fixed */}
        <nav className="shrink-0 bg-zinc-950/90 backdrop-blur-lg border-t border-zinc-800 z-50">
          <div className="flex justify-around items-center p-2 max-w-2xl mx-auto">
            {NAV_ITEMS.map((item) => {
              const isActive = (view === item.id) && !editingSession;
              const handleClick = () => {
                if (editingSession) {
                   if(confirm("Discard unsaved changes?")) {
                     setEditingSession(null);
                     setView(item.id as ViewState);
                   }
                } else {
                  setView(item.id as ViewState);
                }
              };

              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={handleClick}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl transition w-full ${
                    isActive ? 'text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <Icon size={24} className={isActive ? 'fill-emerald-400/20' : ''} />
                  <span className="text-[10px] uppercase font-bold tracking-wide">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </HashRouter>
  );
}
