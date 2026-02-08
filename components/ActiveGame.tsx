import React, { useState, useEffect } from 'react';
import { Player, PlayerSessionInput, Settlement, GameSession } from '../types';
import { calculateSettlements } from '../utils/logic';
import { DollarSign, ArrowRight, UserCheck, AlertTriangle, Save, Calculator, X } from 'lucide-react';

interface ActiveGameProps {
  allPlayers: Player[];
  onFinishGame: (settlements: Settlement[], inputs: PlayerSessionInput[]) => void;
  initialSession?: GameSession | null;
  onCancel?: () => void;
}

type Step = 'SELECT' | 'INPUT' | 'RESULTS';

const ActiveGame: React.FC<ActiveGameProps> = ({ allPlayers, onFinishGame, initialSession, onCancel }) => {
  const [step, setStep] = useState<Step>('SELECT');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [inputs, setInputs] = useState<PlayerSessionInput[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [settlements, setSettlements] = useState<Settlement[]>([]);

  // Initialize for Edit Mode
  useEffect(() => {
    if (initialSession) {
      const ids = new Set(initialSession.players.map(p => p.playerId));
      setSelectedIds(ids);
      setInputs(initialSession.players);
      setStep('INPUT');
    }
  }, [initialSession]);

  // Toggle player selection
  const togglePlayer = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const startInput = () => {
    if (selectedIds.size < 2) return;
    setInputs(Array.from(selectedIds).map(id => ({
      playerId: id,
      buyIn: 0,
      cashOut: 0
    })));
    setStep('INPUT');
  };

  const handleInputChange = (idx: number, field: 'buyIn' | 'cashOut', val: string) => {
    const num = parseFloat(val); // Allow NaN for empty input while typing
    const newInputs = [...inputs];
    // If NaN (empty), store as 0 for calc, but we might want to let them type... 
    // Simplified: treat empty/invalid as 0 for logic but input handles it.
    newInputs[idx] = { ...newInputs[idx], [field]: isNaN(num) ? 0 : num };
    setInputs(newInputs);
  };

  const calculate = () => {
    const result = calculateSettlements(inputs);
    if (result.error) {
      setError(result.error);
      setSettlements([]);
    } else {
      setError(null);
      setSettlements(result.settlements);
      setStep('RESULTS');
    }
  };

  const confirmFinish = () => {
    onFinishGame(settlements, inputs);
  };

  // Real-time Calculation Stats
  const totalBuyIn = inputs.reduce((acc, curr) => acc + (curr.buyIn || 0), 0);
  const totalCashOut = inputs.reduce((acc, curr) => acc + (curr.cashOut || 0), 0);
  const diff = totalCashOut - totalBuyIn;
  const isBalanced = Math.abs(diff) < 0.01;

  // Helper to get player details
  const getP = (id: string) => allPlayers.find(p => p.id === id);

  if (step === 'SELECT') {
    return (
      <div className="max-w-2xl mx-auto p-4 relative z-10">
        <div className="flex justify-between items-center mb-6">
           <h2 className="text-2xl font-bold text-emerald-400">Who's Playing?</h2>
           {onCancel && (
             <button onClick={onCancel} className="text-zinc-500 hover:text-zinc-300">
               <X />
             </button>
           )}
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          {allPlayers.map(p => {
            const isSelected = selectedIds.has(p.id);
            return (
              <button
                key={p.id}
                onClick={() => togglePlayer(p.id)}
                className={`p-4 rounded-xl border transition flex flex-col items-center gap-2 ${
                  isSelected 
                    ? 'bg-emerald-900/50 border-emerald-500 ring-1 ring-emerald-500' 
                    : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="w-16 h-16 rounded-full bg-zinc-800 overflow-hidden border-2 border-zinc-700">
                  {p.avatar ? (
                    <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-500 font-bold text-xl">{p.name[0]}</div>
                  )}
                </div>
                <span className={isSelected ? 'text-white font-semibold' : 'text-zinc-400'}>{p.name}</span>
                {isSelected && <UserCheck size={16} className="text-emerald-400" />}
              </button>
            );
          })}
        </div>
        <button
          onClick={startInput}
          disabled={selectedIds.size < 2}
          className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-emerald-900/20 transition"
        >
          Start Session
        </button>
      </div>
    );
  }

  if (step === 'INPUT') {
    return (
      <div className="max-w-3xl mx-auto p-4 relative z-10 pb-32">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-emerald-400">{initialSession ? 'Edit Stacks' : 'Record Stacks'}</h2>
          {onCancel && (
             <button onClick={onCancel} className="text-zinc-500 hover:text-zinc-300 bg-zinc-900 p-2 rounded-full">
               <X size={20} />
             </button>
           )}
        </div>
        
        {error && (
          <div className="bg-rose-900/30 border border-rose-800 text-rose-200 p-4 rounded-lg mb-6 flex items-start gap-3 animate-pulse">
            <AlertTriangle className="flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <div className="space-y-4 mb-8">
          {inputs.map((inp, idx) => {
            const player = getP(inp.playerId);
            const net = inp.cashOut - inp.buyIn;
            return (
              <div key={inp.playerId} className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-3 w-40">
                  <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden">
                    {player?.avatar && <img src={player.avatar} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <span className="font-semibold text-zinc-200 truncate">{player?.name}</span>
                </div>

                <div className="flex-1 grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-zinc-500 block mb-1">Buy In</label>
                    <div className="relative">
                      <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
                      <input
                        type="number"
                        min="0"
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg py-2 pl-8 pr-3 text-white focus:ring-1 focus:ring-emerald-500 outline-none font-mono"
                        value={inp.buyIn === 0 ? '' : inp.buyIn}
                        placeholder="0"
                        onChange={(e) => handleInputChange(idx, 'buyIn', e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 block mb-1">Cash Out</label>
                    <div className="relative">
                      <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
                      <input
                        type="number"
                        min="0"
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg py-2 pl-8 pr-3 text-white focus:ring-1 focus:ring-emerald-500 outline-none font-mono"
                        value={inp.cashOut === 0 ? '' : inp.cashOut}
                         placeholder="0"
                        onChange={(e) => handleInputChange(idx, 'cashOut', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className={`w-24 text-right font-mono font-bold ${net > 0 ? 'text-emerald-400' : net < 0 ? 'text-rose-400' : 'text-zinc-500'}`}>
                   {net > 0 ? '+' : ''}{net.toFixed(2)}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Sticky Real-time Footer */}
        <div className={`fixed bottom-0 left-0 right-0 p-4 border-t border-zinc-800 backdrop-blur-xl z-50 transition-colors ${isBalanced ? 'bg-zinc-950/90' : 'bg-rose-950/90 border-rose-800'}`}>
          <div className="max-w-3xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex gap-6 text-sm">
              <div className="flex flex-col">
                <span className="text-zinc-500 uppercase text-[10px] font-bold">Total Buy-In</span>
                <span className="font-mono text-zinc-300 font-bold">${totalBuyIn.toFixed(2)}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-zinc-500 uppercase text-[10px] font-bold">Total Cash-Out</span>
                <span className="font-mono text-zinc-300 font-bold">${totalCashOut.toFixed(2)}</span>
              </div>
              <div className="flex flex-col">
                <span className={`${isBalanced ? 'text-zinc-500' : 'text-rose-400'} uppercase text-[10px] font-bold`}>Diff</span>
                <span className={`font-mono font-bold ${isBalanced ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {diff > 0 ? '+' : ''}{diff.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex gap-3 w-full sm:w-auto">
               <button
                  onClick={() => initialSession ? onCancel?.() : setStep('SELECT')}
                  className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl transition"
                >
                  Back
                </button>
                <button
                  onClick={calculate}
                  className="flex-1 sm:flex-none px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-900/20 transition flex items-center justify-center gap-2"
                >
                  <Calculator size={18} /> Calculate
                </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-4 relative z-10">
      <h2 className="text-2xl font-bold mb-6 text-emerald-400 text-center">Settlement Plan</h2>
      
      <div className="bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4 mb-8">
        {settlements.map((s, i) => {
          const from = getP(s.fromId);
          const to = getP(s.toId);
          return (
            <div key={i} className="flex items-center justify-between p-3 border-b border-zinc-800 last:border-0">
               <div className="flex items-center gap-2">
                 <img src={from?.avatar} className="w-8 h-8 rounded-full bg-zinc-800 object-cover" />
                 <span className="font-semibold text-rose-200">{from?.name}</span>
               </div>
               
               <div className="flex flex-col items-center px-4">
                 <span className="text-xs text-zinc-500">pays</span>
                 <div className="flex items-center gap-1 text-emerald-400 font-bold font-mono text-lg">
                   <ArrowRight size={16} /> {s.amount}
                 </div>
               </div>

               <div className="flex items-center gap-2">
                 <span className="font-semibold text-emerald-200">{to?.name}</span>
                 <img src={to?.avatar} className="w-8 h-8 rounded-full bg-zinc-800 object-cover" />
               </div>
            </div>
          );
        })}
        {settlements.length === 0 && (
          <div className="text-center text-zinc-500 py-8">Everyone broke even! No transfers needed.</div>
        )}
      </div>

      <div className="flex gap-4">
          <button
            onClick={() => setStep('INPUT')}
            className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl transition"
          >
            Back
          </button>
          <button
            onClick={confirmFinish}
            className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-900/20 transition flex items-center justify-center gap-2"
          >
            <Save size={20} /> {initialSession ? 'Update Session' : 'Save Session'}
          </button>
        </div>
    </div>
  );
};

export default ActiveGame;
