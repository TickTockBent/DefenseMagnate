// Pure utility functions for formatting and display

import { TagCategory } from '../constants/enums';

// Helper to get human-readable name for a tag category
export function getTagCategoryName(category: TagCategory): string {
  switch (category) {
    case TagCategory.BASIC_MANIPULATION: return 'Basic Manipulation';
    case TagCategory.PRECISION_MANIPULATION: return 'Precision Manipulation';
    case TagCategory.HEAVY_MANIPULATION: return 'Heavy Manipulation';
    case TagCategory.TURNING: return 'Turning';
    case TagCategory.MILLING: return 'Milling';
    case TagCategory.DRILLING: return 'Drilling';
    case TagCategory.GRINDING: return 'Grinding';
    case TagCategory.CUTTING: return 'Cutting';
    case TagCategory.WELDING: return 'Welding';
    case TagCategory.FORMING: return 'Forming';
    case TagCategory.SURFACE: return 'Surface';
    case TagCategory.STORAGE: return 'Storage';
    case TagCategory.HOLDING: return 'Holding';
    case TagCategory.MEASURING: return 'Measuring';
    case TagCategory.COOLING: return 'Cooling';
    case TagCategory.HEATING: return 'Heating';
    case TagCategory.POWERED: return 'Powered';
    case TagCategory.MANUAL: return 'Manual';
    case TagCategory.AUTOMATED: return 'Automated';
    case TagCategory.COMPUTER_CONTROLLED: return 'Computer Controlled';
    case TagCategory.CLEAN_ROOM: return 'Clean Room';
    case TagCategory.HAZMAT: return 'Hazmat';
    case TagCategory.TEMPERATURE_CONTROLLED: return 'Temperature Controlled';
    case TagCategory.VACUUM_CAPABLE: return 'Vacuum Capable';
    case TagCategory.HEAVY_LIFTING: return 'Heavy Lifting';
    case TagCategory.PRECISION_PLACEMENT: return 'Precision Placement';
    case TagCategory.MATERIAL_FEED: return 'Material Feed';
    case TagCategory.QUALITY_CONTROL: return 'Quality Control';
    case TagCategory.DIMENSIONAL_INSPECTION: return 'Dimensional Inspection';
    case TagCategory.MATERIAL_TESTING: return 'Material Testing';
    case TagCategory.CALIBRATION: return 'Calibration';
    case TagCategory.ELECTRONICS_ASSEMBLY: return 'Electronics Assembly';
    case TagCategory.SOLDERING: return 'Soldering';
    case TagCategory.CIRCUIT_TESTING: return 'Circuit Testing';
    case TagCategory.FIRMWARE_PROGRAMMING: return 'Firmware Programming';
    case TagCategory.INJECTION_MOLDING: return 'Injection Molding';
    case TagCategory.CASTING: return 'Casting';
    case TagCategory.EXTRUSION: return 'Extrusion';
    case TagCategory.STAMPING: return 'Stamping';
    case TagCategory.FORGING: return 'Forging';
    case TagCategory.COMPOSITE_LAYUP: return 'Composite Layup';
    case TagCategory.CHEMICAL_PROCESSING: return 'Chemical Processing';
    case TagCategory.CRYSTALLINE_GROWTH: return 'Crystalline Growth';
    case TagCategory.NANO_FABRICATION: return 'Nano Fabrication';
    case TagCategory.OPTICS_HANDLING: return 'Optics Handling';
    case TagCategory.VIBRATION_ISOLATION: return 'Vibration Isolation';
    default: return String(category);
  }
}

// Format currency values
export function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString()}`;
}

// Format percentage values
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

// Format time duration in hours/minutes
export function formatDuration(hours: number): string {
  if (hours < 1) {
    const minutes = Math.round(hours * 60);
    return `${minutes}m`;
  } else if (hours < 24) {
    return `${hours.toFixed(1)}h`;
  } else {
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours.toFixed(1)}h`;
  }
}

// Format quantity with appropriate units
export function formatQuantity(quantity: number, unit?: string): string {
  if (unit) {
    return `${quantity.toLocaleString()} ${unit}`;
  }
  return quantity.toLocaleString();
}