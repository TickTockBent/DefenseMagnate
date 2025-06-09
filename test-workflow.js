// Quick test of the workflow generator
import { WorkflowGenerator } from './src/systems/workflowGenerator.js';

try {
  console.log('Testing workflow generation for basic_sidearm...');
  const plan = WorkflowGenerator.generateManufacturingPlan(
    'basic_sidearm',
    1,
    [], // No input items
    []  // No available inventory
  );
  
  console.log('Plan generated successfully!');
  console.log('Operations:', plan.requiredOperations.map(op => op.name));
  console.log('Total operations:', plan.requiredOperations.length);
  console.log('Estimated duration:', plan.estimatedDuration, 'hours');
} catch (error) {
  console.error('Error generating plan:', error);
  console.error('Stack:', error.stack);
}