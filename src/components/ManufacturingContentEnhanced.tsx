// LEGACY COMPONENT - Disabled during v1 migration
// Uses old ManufacturingStep.required_tags structure and legacy production system

export function ManufacturingContentEnhanced() {
  return (
    <div className="font-mono text-teal-400 p-4">
      <div className="text-yellow-400">⚠ LEGACY COMPONENT DISABLED</div>
      <div className="text-gray-400 text-sm">
        This enhanced manufacturing component uses legacy interfaces and has been disabled during v1 migration.
        Use the Manufacturing tab with machine workspace system instead.
      </div>
    </div>
  );
}