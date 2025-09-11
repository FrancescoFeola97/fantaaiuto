export interface Position {
  id: string
  name: string
  allowedRoles: string[]
  x: number // Position percentage from left (0-100)
  y: number // Position percentage from top (0-100)
}

export interface Formation {
  id: string
  name: string
  displayName: string
  positions: Position[]
}

export interface LineupPlayer {
  playerId: string
  positionId: string
}

export interface Lineup {
  formationId: string
  starters: LineupPlayer[]
  bench: string[] // Array of player IDs on bench (max 19)
}

export const FORMATIONS: Formation[] = [
  {
    id: '3-4-3',
    name: '3-4-3',
    displayName: '3-4-3',
    positions: [
      // Goalkeeper
      { id: 'gk', name: 'P', allowedRoles: ['Por'], x: 50, y: 90 },
      
      // Defenders (3)
      { id: 'dc1', name: 'DC', allowedRoles: ['Dc'], x: 25, y: 75 },
      { id: 'dc2', name: 'DC', allowedRoles: ['Dc'], x: 50, y: 75 },
      { id: 'dc3', name: 'DC/B', allowedRoles: ['Dc', 'B'], x: 75, y: 75 },
      
      // Midfielders (4)
      { id: 'e1', name: 'E', allowedRoles: ['E'], x: 20, y: 55 },
      { id: 'm1', name: 'M/C', allowedRoles: ['M', 'C'], x: 35, y: 55 },
      { id: 'c1', name: 'C', allowedRoles: ['C'], x: 65, y: 55 },
      { id: 'e2', name: 'E', allowedRoles: ['E'], x: 80, y: 55 },
      
      // Forwards (3)
      { id: 'w1', name: 'W/A', allowedRoles: ['W', 'A'], x: 25, y: 25 },
      { id: 'a1', name: 'A/PC', allowedRoles: ['A', 'Pc'], x: 50, y: 20 },
      { id: 'w2', name: 'W/A', allowedRoles: ['W', 'A'], x: 75, y: 25 },
    ]
  },
  {
    id: '3-4-1-2',
    name: '3-4-1-2',
    displayName: '3-4-1-2',
    positions: [
      // Goalkeeper
      { id: 'gk', name: 'P', allowedRoles: ['Por'], x: 50, y: 90 },
      
      // Defenders (3)
      { id: 'dc1', name: 'DC', allowedRoles: ['Dc'], x: 25, y: 75 },
      { id: 'dc2', name: 'DC', allowedRoles: ['Dc'], x: 50, y: 75 },
      { id: 'dc3', name: 'DC/B', allowedRoles: ['Dc', 'B'], x: 75, y: 75 },
      
      // Midfielders (4)
      { id: 'e1', name: 'E', allowedRoles: ['E'], x: 20, y: 55 },
      { id: 'm1', name: 'M/C', allowedRoles: ['M', 'C'], x: 35, y: 55 },
      { id: 'c1', name: 'C', allowedRoles: ['C'], x: 65, y: 55 },
      { id: 'e2', name: 'E', allowedRoles: ['E'], x: 80, y: 55 },
      
      // Attacking Midfielder (1)
      { id: 't1', name: 'T', allowedRoles: ['T'], x: 50, y: 35 },
      
      // Forwards (2)
      { id: 'a1', name: 'A/PC', allowedRoles: ['A', 'Pc'], x: 40, y: 20 },
      { id: 'a2', name: 'A/PC', allowedRoles: ['A', 'Pc'], x: 60, y: 20 },
    ]
  },
  {
    id: '3-4-2-1',
    name: '3-4-2-1',
    displayName: '3-4-2-1',
    positions: [
      // Goalkeeper
      { id: 'gk', name: 'P', allowedRoles: ['Por'], x: 50, y: 90 },
      
      // Defenders (3)
      { id: 'dc1', name: 'DC', allowedRoles: ['Dc'], x: 25, y: 75 },
      { id: 'dc2', name: 'DC', allowedRoles: ['Dc'], x: 50, y: 75 },
      { id: 'dc3', name: 'DC/B', allowedRoles: ['Dc', 'B'], x: 75, y: 75 },
      
      // Midfielders (3)
      { id: 'm1', name: 'M', allowedRoles: ['M'], x: 25, y: 55 },
      { id: 'm2', name: 'M/C', allowedRoles: ['M', 'C'], x: 50, y: 55 },
      { id: 'e1', name: 'E', allowedRoles: ['E'], x: 75, y: 55 },
      
      // Attacking Midfielders (3)
      { id: 'ew1', name: 'E/W', allowedRoles: ['E', 'W'], x: 25, y: 35 },
      { id: 't1', name: 'T', allowedRoles: ['T'], x: 50, y: 30 },
      { id: 'ta1', name: 'T/A', allowedRoles: ['T', 'A'], x: 75, y: 35 },
      
      // Forward (1)
      { id: 'a1', name: 'A/PC', allowedRoles: ['A', 'Pc'], x: 50, y: 15 },
    ]
  },
  {
    id: '3-5-2',
    name: '3-5-2',
    displayName: '3-5-2',
    positions: [
      // Goalkeeper
      { id: 'gk', name: 'Por', allowedRoles: ['Por'], x: 50, y: 90 },
      
      // Defenders (3)
      { id: 'dc1', name: 'Dc', allowedRoles: ['Dc'], x: 25, y: 75 },
      { id: 'dc2', name: 'Dc', allowedRoles: ['Dc'], x: 50, y: 75 },
      { id: 'dc3', name: 'Dc', allowedRoles: ['Dc'], x: 75, y: 75 },
      
      // Midfielders (5)
      { id: 'e1', name: 'E', allowedRoles: ['E'], x: 15, y: 55 },
      { id: 'm1', name: 'M/C', allowedRoles: ['M', 'C'], x: 35, y: 50 },
      { id: 'c1', name: 'C', allowedRoles: ['C'], x: 50, y: 45 },
      { id: 'm2', name: 'M/C', allowedRoles: ['M', 'C'], x: 65, y: 50 },
      { id: 'e2', name: 'E', allowedRoles: ['E'], x: 85, y: 55 },
      
      // Forwards (2)
      { id: 'a1', name: 'A/Pc', allowedRoles: ['A', 'Pc'], x: 40, y: 20 },
      { id: 'a2', name: 'A/Pc', allowedRoles: ['A', 'Pc'], x: 60, y: 20 },
    ]
  },
  {
    id: '3-5-1-1',
    name: '3-5-1-1',
    displayName: '3-5-1-1',
    positions: [
      // Goalkeeper
      { id: 'gk', name: 'Por', allowedRoles: ['Por'], x: 50, y: 90 },
      
      // Defenders (3)
      { id: 'dc1', name: 'Dc', allowedRoles: ['Dc'], x: 25, y: 75 },
      { id: 'dc2', name: 'Dc', allowedRoles: ['Dc'], x: 50, y: 75 },
      { id: 'dc3', name: 'Dc', allowedRoles: ['Dc'], x: 75, y: 75 },
      
      // Midfielders (5)
      { id: 'e1', name: 'E', allowedRoles: ['E'], x: 15, y: 55 },
      { id: 'm1', name: 'M', allowedRoles: ['M'], x: 35, y: 50 },
      { id: 'm2', name: 'M', allowedRoles: ['M'], x: 50, y: 45 },
      { id: 'm3', name: 'M', allowedRoles: ['M'], x: 65, y: 50 },
      { id: 'e2', name: 'E', allowedRoles: ['E'], x: 85, y: 55 },
      
      // Attacking Midfielder (1)
      { id: 't1', name: 'T/A', allowedRoles: ['T', 'A'], x: 50, y: 30 },
      
      // Forward (1)
      { id: 'a1', name: 'A/Pc', allowedRoles: ['A', 'Pc'], x: 50, y: 15 },
    ]
  },
  {
    id: '4-3-3',
    name: '4-3-3',
    displayName: '4-3-3',
    positions: [
      // Goalkeeper
      { id: 'gk', name: 'Por', allowedRoles: ['Por'], x: 50, y: 90 },
      
      // Defenders (4)
      { id: 'dd1', name: 'Dd', allowedRoles: ['Dd'], x: 20, y: 75 },
      { id: 'dc1', name: 'Dc', allowedRoles: ['Dc'], x: 40, y: 75 },
      { id: 'dc2', name: 'Dc', allowedRoles: ['Dc'], x: 60, y: 75 },
      { id: 'ds1', name: 'Ds', allowedRoles: ['Ds'], x: 80, y: 75 },
      
      // Midfielders (3)
      { id: 'm1', name: 'M/C', allowedRoles: ['M', 'C'], x: 35, y: 50 },
      { id: 'm2', name: 'M', allowedRoles: ['M'], x: 50, y: 45 },
      { id: 'm3', name: 'M/C', allowedRoles: ['M', 'C'], x: 65, y: 50 },
      
      // Forwards (3)
      { id: 'w1', name: 'W/A', allowedRoles: ['W', 'A'], x: 25, y: 20 },
      { id: 'a1', name: 'A/Pc', allowedRoles: ['A', 'Pc'], x: 50, y: 15 },
      { id: 'w2', name: 'W/A', allowedRoles: ['W', 'A'], x: 75, y: 20 },
    ]
  },
  {
    id: '4-3-1-2',
    name: '4-3-1-2',
    displayName: '4-3-1-2',
    positions: [
      // Goalkeeper
      { id: 'gk', name: 'Por', allowedRoles: ['Por'], x: 50, y: 90 },
      
      // Defenders (4)
      { id: 'dd1', name: 'Dd', allowedRoles: ['Dd'], x: 20, y: 75 },
      { id: 'dc1', name: 'Dc', allowedRoles: ['Dc'], x: 40, y: 75 },
      { id: 'dc2', name: 'Dc', allowedRoles: ['Dc'], x: 60, y: 75 },
      { id: 'ds1', name: 'Ds', allowedRoles: ['Ds'], x: 80, y: 75 },
      
      // Midfielders (3)
      { id: 'm1', name: 'M/C', allowedRoles: ['M', 'C'], x: 35, y: 50 },
      { id: 'm2', name: 'M', allowedRoles: ['M'], x: 50, y: 45 },
      { id: 'm3', name: 'M/C', allowedRoles: ['M', 'C'], x: 65, y: 50 },
      
      // Attacking Midfielder (1)
      { id: 't1', name: 'T', allowedRoles: ['T'], x: 50, y: 30 },
      
      // Forwards (2)  
      { id: 'a1', name: 'T/A/Pc', allowedRoles: ['T', 'A', 'Pc'], x: 40, y: 15 },
      { id: 'a2', name: 'A/Pc', allowedRoles: ['A', 'Pc'], x: 60, y: 15 },
    ]
  },
  {
    id: '4-4-2',
    name: '4-4-2',
    displayName: '4-4-2',
    positions: [
      // Goalkeeper
      { id: 'gk', name: 'Por', allowedRoles: ['Por'], x: 50, y: 90 },
      
      // Defenders (4)
      { id: 'dd1', name: 'Dd', allowedRoles: ['Dd'], x: 20, y: 75 },
      { id: 'dc1', name: 'Dc', allowedRoles: ['Dc'], x: 40, y: 75 },
      { id: 'dc2', name: 'Dc', allowedRoles: ['Dc'], x: 60, y: 75 },
      { id: 'ds1', name: 'Ds', allowedRoles: ['Ds'], x: 80, y: 75 },
      
      // Midfielders (4)
      { id: 'm1', name: 'M/C', allowedRoles: ['M', 'C'], x: 25, y: 50 },
      { id: 'e1', name: 'E', allowedRoles: ['E'], x: 42, y: 45 },
      { id: 'e2', name: 'E', allowedRoles: ['E'], x: 58, y: 45 },
      { id: 'm2', name: 'M/C', allowedRoles: ['M', 'C'], x: 75, y: 50 },
      
      // Forwards (2)
      { id: 'a1', name: 'A/Pc', allowedRoles: ['A', 'Pc'], x: 40, y: 20 },
      { id: 'a2', name: 'A/Pc', allowedRoles: ['A', 'Pc'], x: 60, y: 20 },
    ]
  },
  {
    id: '4-1-4-1',
    name: '4-1-4-1',
    displayName: '4-1-4-1',
    positions: [
      // Goalkeeper
      { id: 'gk', name: 'Por', allowedRoles: ['Por'], x: 50, y: 90 },
      
      // Defenders (4)
      { id: 'dd1', name: 'Dd', allowedRoles: ['Dd'], x: 20, y: 75 },
      { id: 'dc1', name: 'Dc', allowedRoles: ['Dc'], x: 40, y: 75 },
      { id: 'dc2', name: 'Dc', allowedRoles: ['Dc'], x: 60, y: 75 },
      { id: 'ds1', name: 'Ds', allowedRoles: ['Ds'], x: 80, y: 75 },
      
      // Defensive Midfielder (1)
      { id: 'm1', name: 'M', allowedRoles: ['M'], x: 50, y: 60 },
      
      // Midfielders (4)
      { id: 'c1', name: 'C/T', allowedRoles: ['C', 'T'], x: 20, y: 40 },
      { id: 'e1', name: 'E', allowedRoles: ['E'], x: 42, y: 45 },
      { id: 'e2', name: 'E', allowedRoles: ['E'], x: 58, y: 45 },
      { id: 'c2', name: 'C/T', allowedRoles: ['C', 'T'], x: 80, y: 40 },
      
      // Forward (1)
      { id: 'a1', name: 'A/Pc', allowedRoles: ['A', 'Pc'], x: 50, y: 15 },
    ]
  },
  {
    id: '4-4-1-1',
    name: '4-4-1-1',
    displayName: '4-4-1-1',
    positions: [
      // Goalkeeper
      { id: 'gk', name: 'Por', allowedRoles: ['Por'], x: 50, y: 90 },
      
      // Defenders (4)
      { id: 'dd1', name: 'Dd', allowedRoles: ['Dd'], x: 20, y: 75 },
      { id: 'dc1', name: 'Dc', allowedRoles: ['Dc'], x: 40, y: 75 },
      { id: 'dc2', name: 'Dc', allowedRoles: ['Dc'], x: 60, y: 75 },
      { id: 'ds1', name: 'Ds', allowedRoles: ['Ds'], x: 80, y: 75 },
      
      // Midfielders (4)
      { id: 'e1', name: 'E/M', allowedRoles: ['E', 'M'], x: 25, y: 55 },
      { id: 'm1', name: 'M', allowedRoles: ['M'], x: 42, y: 50 },
      { id: 'm2', name: 'M', allowedRoles: ['M'], x: 58, y: 50 },
      { id: 'e2', name: 'E/M', allowedRoles: ['E', 'M'], x: 75, y: 55 },
      
      // Attacking Midfielder (1)  
      { id: 't1', name: 'T/A', allowedRoles: ['T', 'A'], x: 50, y: 30 },
      
      // Forward (1)
      { id: 'a1', name: 'A/Pc', allowedRoles: ['A', 'Pc'], x: 50, y: 15 },
    ]
  },
  {
    id: '4-2-3-1',
    name: '4-2-3-1',
    displayName: '4-2-3-1',
    positions: [
      // Goalkeeper
      { id: 'gk', name: 'Por', allowedRoles: ['Por'], x: 50, y: 90 },
      
      // Defenders (4)
      { id: 'dd1', name: 'Dd', allowedRoles: ['Dd'], x: 20, y: 75 },
      { id: 'dc1', name: 'Dc', allowedRoles: ['Dc'], x: 40, y: 75 },
      { id: 'dc2', name: 'Dc', allowedRoles: ['Dc'], x: 60, y: 75 },
      { id: 'ds1', name: 'Ds', allowedRoles: ['Ds'], x: 80, y: 75 },
      
      // Defensive Midfielders (2)
      { id: 'm1', name: 'M', allowedRoles: ['M'], x: 40, y: 60 },
      { id: 'm2', name: 'M/C', allowedRoles: ['M', 'C'], x: 60, y: 60 },
      
      // Attacking Midfielders (3)
      { id: 'w1', name: 'W/T', allowedRoles: ['W', 'T'], x: 25, y: 35 },
      { id: 't1', name: 'T', allowedRoles: ['T'], x: 50, y: 30 },
      { id: 'w2', name: 'W/A', allowedRoles: ['W', 'A'], x: 75, y: 35 },
      
      // Forward (1)
      { id: 'a1', name: 'A/Pc', allowedRoles: ['A', 'Pc'], x: 50, y: 15 },
    ]
  }
]