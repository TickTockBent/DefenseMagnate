// ASCII formatting utilities for consistent box drawing

export const BOX_WIDTH = {
  LEFT_PANEL: 20,
  CONTENT: 52,
  RIGHT_PANEL: 20,
} as const

export const COLORS = {
  // UI Structure
  border: 'text-gray-500',
  header: 'text-teal-400',
  
  // Interactive elements
  clickable: 'text-yellow-400',
  clickableHover: 'hover:text-yellow-200',
  clickableActive: 'text-white',
  
  // Status colors
  good: 'text-green-400',
  warning: 'text-orange-400',
  danger: 'text-red-400',
  info: 'text-blue-400',
  
  // Content
  label: 'text-gray-400',
  value: 'text-teal-400',
  disabled: 'text-gray-600',
} as const

// Pad string to exact length, truncating if necessary
export function padString(str: string, length: number, align: 'left' | 'right' | 'center' = 'left'): string {
  if (str.length > length) {
    return str.substring(0, length)
  }
  
  if (align === 'right') {
    return str.padStart(length)
  } else if (align === 'center') {
    const totalPadding = length - str.length
    const leftPad = Math.floor(totalPadding / 2)
    const rightPad = totalPadding - leftPad
    return ' '.repeat(leftPad) + str + ' '.repeat(rightPad)
  }
  
  return str.padEnd(length)
}

// Create a horizontal line for boxes
export function createLine(width: number, start: string = '+', middle: string = '-', end: string = '+'): string {
  return start + middle.repeat(width - 2) + end
}

// Format a box row with proper padding
export function createRow(content: string, width: number, start: string = '|', end: string = '|'): string {
  return start + padString(content, width - 2, 'left') + end
}

// Create a complete box with consistent width
export function createBox(title: string, lines: string[], width: number): string[] {
  const result: string[] = []
  
  // Top border
  result.push(createLine(width))
  
  // Title
  if (title) {
    result.push(createRow(` ${title} `, width))
    result.push(createRow('', width))
  }
  
  // Content
  lines.forEach(line => {
    result.push(createRow(` ${line}`, width))
  })
  
  // Bottom border
  result.push(createLine(width))
  
  return result
}

// Format currency values
export function formatCredits(amount: number): string {
  return `${amount.toLocaleString()}cr`
}

// Format percentage
export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`
}

// Create a progress bar
export function createProgressBar(progress: number, width: number = 10): string {
  const filled = Math.round(progress * width / 100)
  const empty = width - filled
  return `[${'='.repeat(filled)}${' '.repeat(empty)}]`
}