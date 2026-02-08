import { Player, PlayerSessionInput, Settlement, GameSession } from '../types';

/**
 * Calculates who owes whom based on buy-ins and cash-outs.
 */
export const calculateSettlements = (inputs: PlayerSessionInput[]): { settlements: Settlement[], error?: string } => {
  const totalBuyIn = inputs.reduce((sum, p) => sum + p.buyIn, 0);
  const totalCashOut = inputs.reduce((sum, p) => sum + p.cashOut, 0);

  // Floating point safety check
  if (Math.abs(totalBuyIn - totalCashOut) > 0.01) {
    return {
      settlements: [],
      error: `Table imbalance! Buy-ins: ${totalBuyIn.toFixed(2)}, Cash-outs: ${totalCashOut.toFixed(2)}. Difference: ${(totalCashOut - totalBuyIn).toFixed(2)}`
    };
  }

  // Calculate net for each player
  let debtors: { id: string; amount: number }[] = [];
  let creditors: { id: string; amount: number }[] = [];

  inputs.forEach(p => {
    const net = p.cashOut - p.buyIn;
    if (net < -0.01) {
      debtors.push({ id: p.playerId, amount: Math.abs(net) });
    } else if (net > 0.01) {
      creditors.push({ id: p.playerId, amount: net });
    }
  });

  // Sort by magnitude to optimize transaction count (greedy approach)
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const settlements: Settlement[] = [];
  let i = 0; // Debtor index
  let j = 0; // Creditor index

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];

    const amount = Math.min(debtor.amount, creditor.amount);
    
    // Create settlement
    settlements.push({
      fromId: debtor.id,
      toId: creditor.id,
      amount: Number(amount.toFixed(2))
    });

    // Update remaining amounts
    debtor.amount -= amount;
    creditor.amount -= amount;

    // Move indices if settled
    if (debtor.amount < 0.01) i++;
    if (creditor.amount < 0.01) j++;
  }

  return { settlements };
};

/**
 * Rebuilds all player stats (winnings/games played) from the session history.
 * This ensures consistency if a session is edited or deleted.
 */
export const recalculatePlayerStats = (players: Player[], sessions: GameSession[]): Player[] => {
  // Reset stats
  const playerMap = new Map(players.map(p => [
    p.id, 
    { ...p, totalWinnings: 0, gamesPlayed: 0 }
  ]));

  // Apply all sessions sorted by date
  const sortedSessions = [...sessions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  sortedSessions.forEach(session => {
    session.players.forEach(record => {
      const p = playerMap.get(record.playerId);
      if (p) {
        p.gamesPlayed += 1;
        p.totalWinnings += (record.cashOut - record.buyIn);
      }
    });
  });

  return Array.from(playerMap.values());
};

/**
 * Generates data for the line chart
 */
export const generateChartData = (players: Player[], sessions: GameSession[]) => {
  const sortedSessions = [...sessions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  // Initial state (Session 0)
  const dataPoints = [{
    label: 'Start',
    scores: players.reduce((acc, p) => ({ ...acc, [p.id]: 0 }), {} as Record<string, number>)
  }];

  let currentScores = players.reduce((acc, p) => ({ ...acc, [p.id]: 0 }), {} as Record<string, number>);

  sortedSessions.forEach((session, idx) => {
    const newScores = { ...currentScores };
    session.players.forEach(p => {
      newScores[p.playerId] += (p.cashOut - p.buyIn);
    });
    currentScores = newScores;
    
    dataPoints.push({
      label: `G${idx + 1}`,
      scores: { ...currentScores }
    });
  });

  return dataPoints;
};

/**
 * Generate a consistent color from a string ID
 */
export const getPlayerColor = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 70%, 50%)`;
};

/**
 * Resize and compress image to base64 to save LocalStorage space
 */
export const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 150;
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Compress to JPEG with 0.7 quality
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};
