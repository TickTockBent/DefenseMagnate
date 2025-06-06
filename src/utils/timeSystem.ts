// Real-time game system
// 1 real minute = 1 game hour

export const TIME_SCALE = {
  REAL_MINUTE_TO_GAME_HOURS: 1,
  REAL_SECOND_TO_GAME_MINUTES: 1,
  MS_PER_GAME_HOUR: 60 * 1000, // 60 seconds = 1 game hour
  MS_PER_GAME_MINUTE: 1000, // 1 second = 1 game minute
}

export function realTimeToGameHours(realMs: number): number {
  return realMs / TIME_SCALE.MS_PER_GAME_HOUR
}

export function gameHoursToRealMs(gameHours: number): number {
  return gameHours * TIME_SCALE.MS_PER_GAME_HOUR
}

export function getProductionProgress(startGameTime: number, durationHours: number, currentGameTime: number): number {
  const elapsedHours = currentGameTime - startGameTime
  return Math.min(100, (elapsedHours / durationHours) * 100)
}

export function getProductionTimeRemainingHours(startGameTime: number, durationHours: number, currentGameTime: number): number {
  const elapsedHours = currentGameTime - startGameTime
  return Math.max(0, durationHours - elapsedHours)
}

export function isProductionComplete(startGameTime: number, durationHours: number, currentGameTime: number): boolean {
  return getProductionProgress(startGameTime, durationHours, currentGameTime) >= 100
}

export function formatGameTimeRemaining(remainingHours: number): string {
  if (remainingHours <= 0) return 'Complete'
  
  const hours = Math.floor(remainingHours)
  const minutes = Math.floor((remainingHours % 1) * 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else {
    return `${minutes}m`
  }
}

export function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return 'Complete'
  
  const seconds = Math.ceil(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  
  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`
  } else {
    return `${remainingSeconds}s`
  }
}