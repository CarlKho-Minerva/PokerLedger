# PokerLedger

A lightweight, offline-first poker tracking application for university clubs.

## Features

- **Dashboard**: Leaderboards, "Semester King" tracking, and performance charts.
- **Game Tracking**: Record buy-ins and cash-outs.
- **Real-time Accounting**: Auto-calculates settlements and warns about table imbalances.
- **History**: View and edit past game sessions.
- **Data Management**: Import/Export JSON data to keep your records safe locally.
- **Fun UI**: Floating faces and interactive elements.

## Usage

1. **Add Players**: Go to the Players tab and add members (names + photos).
2. **Start Game**: 
   - Select players.
   - Input buy-ins/cash-outs.
   - See live balance checks at the bottom.
   - Save to generate settlements.
3. **Edit History**: Go to History tab, click the Pencil icon to modify a past session.
4. **Export**: Click the Settings (Cog) icon in the header to backup your data to a JSON file.

## Tech Stack

- React + TypeScript
- Tailwind CSS
- LocalStorage for persistence
