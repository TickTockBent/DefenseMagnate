// LEGACY COMPONENT - Disabled during v1 migration
// Uses old production analysis system and ManufacturingStep interfaces

import { ManufacturingMethod } from '../types';

interface ConstraintsTooltipProps {
  method: ManufacturingMethod;
  trigger: React.ReactNode;
}

export function ConstraintsTooltip({ method, trigger }: ConstraintsTooltipProps) {
  return (
    <div className="relative">
      {trigger}
      <div className="absolute z-10 p-2 bg-gray-800 border border-yellow-600 text-xs">
        <div className="text-yellow-400">⚠ LEGACY TOOLTIP DISABLED</div>
        <div className="text-gray-400">
          Constraints analysis disabled during v1 migration.
          Use machine workspace system for equipment requirements.
        </div>
      </div>
    </div>
  );
}