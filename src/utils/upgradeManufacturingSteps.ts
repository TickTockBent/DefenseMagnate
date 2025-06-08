// LEGACY: Helper to upgrade old manufacturing steps to include required_tags
// SUPERSEDED BY: Component-based manufacturing system
// This file is maintained for potential migration needs but not actively used

import { TagCategory, ManufacturingStep } from '../types';

// Add basic required_tags to steps that don't have them
export function addBasicRequiredTags(step: any): ManufacturingStep {
  // If step already has required_tags, return as-is
  if (step.required_tags) {
    return step as ManufacturingStep;
  }

  // Add basic required_tags based on step characteristics
  const required_tags = [];

  // All steps need basic manipulation and surface
  required_tags.push({ category: TagCategory.BASIC_MANIPULATION, minimum: 5 });
  required_tags.push({ category: TagCategory.SURFACE, minimum: 1 });

  // Steps with materials likely need holding capability
  if (step.material_requirements && step.material_requirements.length > 0) {
    required_tags.push({ category: TagCategory.HOLDING, minimum: true });
  }

  // Skilled labor suggests precision work
  if (step.labor_skill === 'skilled_machinist') {
    required_tags.push({ category: TagCategory.TURNING, minimum: 15 });
    required_tags.push({ category: TagCategory.MILLING, minimum: 10 });
    required_tags.push({ category: TagCategory.PRECISION_MANIPULATION, minimum: 10 });
  } else if (step.labor_skill === 'skilled_technician') {
    required_tags.push({ category: TagCategory.PRECISION_MANIPULATION, minimum: 8 });
  } else if (step.labor_skill === 'quality_inspector') {
    required_tags.push({ category: TagCategory.MEASURING, minimum: true });
    required_tags.push({ category: TagCategory.QUALITY_CONTROL, minimum: true });
  }

  // Steps with high failure chance suggest complex operations
  if (step.failure_chance > 0.1) {
    required_tags.push({ category: TagCategory.PRECISION_MANIPULATION, minimum: 12 });
  }

  return {
    ...step,
    required_tags
  };
}

// Upgrade an entire manufacturing method
export function upgradeManufacturingMethod(method: any) {
  return {
    ...method,
    steps: method.steps.map(addBasicRequiredTags)
  };
}