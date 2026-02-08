import React, { useState, useRef } from 'react';
import { Player } from '../types';
import { compressImage } from '../utils/logic';
import { Camera, Trash2, UserPlus } from 'lucide-react';

interface PlayerManagerProps {
  players: Player[];
  onAddPlayer: (player: Player) => void;
  onDeletePlayer: (id: string) => void;
}

const PlayerManager: React.FC<PlayerManagerProps> = ({ players, onAddPlayer, onDeletePlayer }) => {
  const [newName, setNewName] = useState('');
  const [newAvatar, setNewAvatar] = useState<string | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const compressed = await compressImage(e.target.files[0]);
        setNewAvatar(compressed);
      } catch (err) {
        console.error("Image processing failed", err);
        alert("Could not process image.");
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newPlayer: Player = {
      id: crypto.randomUUID(),
      name: newName.trim(),
      avatar: newAvatar,
      totalWinnings: 0,
      gamesPlayed: 0
    };

    onAddPlayer(newPlayer);
    setNewName('');
    setNewAvatar(undefined);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-8 relative z-10 max-w-2xl mx-auto p-4">
      <div className="bg-zinc-900/80 backdrop-blur-md p-6 rounded-2xl border border-zinc-800 shadow-xl">
        <h2 className="text-xl font-bold mb-4 text-emerald-400 flex items-center gap-2">
          <UserPlus size={20} /> Add New Player
        </h2>
        
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="w-full">
            <label className="block text-xs text-zinc-400 mb-1">Name</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 text-white p-3 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition"
              placeholder="e.g. The Shark"
            />
          </div>

          <div className="flex-shrink-0">
             <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-12 h-12 rounded-lg border border-dashed border-zinc-600 flex items-center justify-center hover:bg-zinc-800 transition overflow-hidden relative"
            >
              {newAvatar ? (
                <img src={newAvatar} alt="preview" className="w-full h-full object-cover" />
              ) : (
                <Camera size={20} className="text-zinc-500" />
              )}
            </button>
          </div>

          <button
            type="submit"
            disabled={!newName}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition shadow-lg shadow-emerald-900/20"
          >
            Add
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {players.map(player => (
          <div key={player.id} className="bg-zinc-900/60 backdrop-blur-sm border border-zinc-800 p-4 rounded-xl flex items-center gap-4 group hover:border-zinc-700 transition">
            <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden border border-zinc-700">
               {player.avatar ? (
                 <img src={player.avatar} alt={player.name} className="w-full h-full object-cover" />
               ) : (
                 <span className="text-lg font-bold text-zinc-500">{player.name[0].toUpperCase()}</span>
               )}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-zinc-200">{player.name}</h3>
              <p className="text-xs text-zinc-500">
                Winnings: <span className={player.totalWinnings >= 0 ? "text-emerald-400" : "text-rose-400"}>
                  {player.totalWinnings > 0 ? '+' : ''}{player.totalWinnings.toFixed(2)}
                </span>
              </p>
            </div>
            <button
              onClick={() => onDeletePlayer(player.id)}
              className="p-2 text-zinc-600 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition"
              title="Delete Player"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlayerManager;
