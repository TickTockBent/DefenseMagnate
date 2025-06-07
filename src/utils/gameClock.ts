// Global game clock system
// 1 real minute = 1 game hour

export interface GameTime {
  totalGameHours: number;
  days: number;
  hours: number;
  isPaused: boolean;
  gameSpeed: number; // 1.0 = normal, 2.0 = 2x speed, etc.
}

export const TIME_SCALE = {
  REAL_MINUTE_TO_GAME_HOURS: 1,
  MS_PER_GAME_HOUR: 60 * 1000, // 60 seconds = 1 game hour (1 real minute = 1 game hour)
}

export function createGameTime(): GameTime {
  return {
    totalGameHours: 0,
    days: 0,
    hours: 0,
    isPaused: false,
    gameSpeed: 1.0,
  }
}

export function updateGameTime(gameTime: GameTime, deltaMs: number): GameTime {
  if (gameTime.isPaused) return gameTime;
  
  const gameHoursDelta = (deltaMs * gameTime.gameSpeed) / TIME_SCALE.MS_PER_GAME_HOUR;
  const newTotalHours = gameTime.totalGameHours + gameHoursDelta;
  
  return {
    ...gameTime,
    totalGameHours: newTotalHours,
    days: Math.floor(newTotalHours / 24),
    hours: Math.floor(newTotalHours % 24),
  };
}

export function formatGameTime(gameTime: GameTime): string {
  const days = gameTime.days;
  const hours = Math.floor(gameTime.hours);
  const minutes = Math.floor((gameTime.totalGameHours % 1) * 60);
  
  if (days > 0) {
    return `Day ${days + 1}, ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  } else {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
}

export function formatGameSpeed(speed: number): string {
  if (speed === 1.0) return 'Normal';
  if (speed === 0) return 'Paused';
  return `${speed}x`;
}