// Intelligent Job Creation Interface - Manufacturing v2 Phase 3
// Revolutionary two-panel interface for scalable, intelligent manufacturing

import React, { useState, useEffect, useCallback } from 'react';
import { useGameStore } from '../state/gameStoreWithEquipment';
import { 
  Facility, 
  ItemInstance, 
  BaseItem,
  ItemTag,
  ItemManufacturingType,
  Enhancement,
  EnhancementSelection
} from '../types';
import { InventoryActionDiscovery, DiscoveredAction, ActionType } from '../systems/inventoryActionDiscovery';
import { AutomaticWorkflowGeneration, GeneratedWorkflow } from '../systems/automaticWorkflowGeneration';
import { ConditionTreatmentPlanner, TreatmentPlan } from '../systems/conditionTreatmentPlanner';
import { equipmentDatabase } from '../data/equipment';
import { inventoryManager } from '../utils/inventoryManager';
import { getBaseItem, baseItems } from '../data/baseItems';

interface IntelligentJobCreationInterfaceProps {
  facility: Facility;
  onJobStart: (workflow: GeneratedWorkflow, enhancements?: EnhancementSelection) => void;
}

// Available tabs in the left panel
enum LeftPanelTab {
  PRODUCT_TREE = 'product_tree',
  INVENTORY_ACTIONS = 'inventory_actions',
  SEARCH = 'search'
}

// Selected item for workflow generation
interface SelectedItem {
  type: 'new_product' | 'inventory_item' | 'discovered_action';
  productId?: string;
  inventoryItem?: ItemInstance;
  action?: DiscoveredAction;
}

export function IntelligentJobCreationInterface({ facility, onJobStart }: IntelligentJobCreationInterfaceProps) {
  // Left panel state
  const [activeTab, setActiveTab] = useState<LeftPanelTab>(LeftPanelTab.INVENTORY_ACTIONS);
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Right panel state
  const [generatedWorkflow, setGeneratedWorkflow] = useState<GeneratedWorkflow | null>(null);
  const [treatmentPlan, setTreatmentPlan] = useState<TreatmentPlan | null>(null);
  const [selectedEnhancements, setSelectedEnhancements] = useState<Enhancement[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Get facility inventory
  const facilityInventory = facility.inventory;
  const inventoryItems = facilityInventory ? inventoryManager.getAllItems(facilityInventory) : [];

  // Generate workflow when selection changes
  useEffect(() => {
    if (selectedItem) {
      generateWorkflow(selectedItem);
    } else {
      setGeneratedWorkflow(null);
      setTreatmentPlan(null);
    }
  }, [selectedItem]);

  const generateWorkflow = useCallback(async (item: SelectedItem) => {
    setIsGenerating(true);
    try {
      let workflow: GeneratedWorkflow | null = null;
      let treatment: TreatmentPlan | null = null;

      if (item.type === 'new_product' && item.productId) {
        // Generate manufacturing workflow for new product
        const baseItem = getBaseItem(item.productId);
        if (baseItem) {
          workflow = AutomaticWorkflowGeneration.generateManufacturingWorkflow(baseItem, 1); // Generate for 1 unit
        }
      } else if (item.type === 'inventory_item' && item.inventoryItem) {
        const inventoryItem = item.inventoryItem;
        const baseItem = getBaseItem(inventoryItem.baseItemId);
        
        if (baseItem) {
          // Generate treatment plan if needed
          const facilityCapabilities = facility.equipment_capacity || new Map();
          treatment = ConditionTreatmentPlanner.generateTreatmentPlan(
            inventoryItem, 
            baseItem, 
            facilityCapabilities
          );
          
          // Generate repair workflow for damaged items
          if (inventoryItem.tags.some(tag => ['damaged', 'junk'].includes(tag))) {
            workflow = AutomaticWorkflowGeneration.generateRepairWorkflow(inventoryItem);
          } else {
            // Generate disassembly workflow for functional assemblies
            workflow = AutomaticWorkflowGeneration.generateDisassemblyWorkflow(inventoryItem);
          }
        }
      } else if (item.type === 'discovered_action' && item.action && item.inventoryItem) {
        const action = item.action;
        const inventoryItem = item.inventoryItem;
        
        // Generate workflow based on action type
        switch (action.type) {
          case ActionType.REPAIR:
            workflow = AutomaticWorkflowGeneration.generateRepairWorkflow(inventoryItem);
            break;
          case ActionType.DISASSEMBLE:
            workflow = AutomaticWorkflowGeneration.generateDisassemblyWorkflow(inventoryItem, true);
            break;
          case ActionType.CLEAN:
            const baseItem = getBaseItem(inventoryItem.baseItemId);
            if (baseItem) {
              const conditions = ['drenched', 'corroded']; // Would be detected automatically
              workflow = AutomaticWorkflowGeneration.generateTreatmentWorkflow(inventoryItem, conditions as any);
            }
            break;
        }
      }
      
      setGeneratedWorkflow(workflow);
      setTreatmentPlan(treatment);
    } catch (error) {
      console.error('Failed to generate workflow:', error);
      setGeneratedWorkflow(null);
      setTreatmentPlan(null);
    } finally {
      setIsGenerating(false);
    }
  }, [facility]);

  const handleJobStart = () => {
    if (!generatedWorkflow) return;
    
    // Create enhancement selection if any are selected
    let enhancementSelection: EnhancementSelection | undefined;
    if (selectedEnhancements.length > 0) {
      enhancementSelection = {
        jobId: `temp-${Date.now()}`,
        selectedEnhancements,
        totalTimeModifier: selectedEnhancements.reduce((acc, e) => acc * e.timeModifier, 1.0),
        totalComplexityModifier: selectedEnhancements.reduce((acc, e) => acc * e.complexityModifier, 1.0),
        totalQualityModifier: selectedEnhancements.reduce((acc, e) => acc + e.qualityModifier, 0),
        additionalCosts: selectedEnhancements.flatMap(e => e.costs),
        additionalTags: [...new Set(selectedEnhancements.flatMap(e => e.outputTags))]
      };
    }
    
    onJobStart(generatedWorkflow, enhancementSelection);
    
    // Reset selection after starting job
    setSelectedItem(null);
    setSelectedEnhancements([]);
  };

  return (
    <div className="h-full flex bg-gray-900 text-gray-100">
      {/* Left Panel: Selection */}
      <div className="w-1/2 border-r border-gray-700 flex flex-col">
        {/* Tab Navigation */}
        <div className="border-b border-gray-700 flex">
          <button
            onClick={() => setActiveTab(LeftPanelTab.INVENTORY_ACTIONS)}
            className={`px-4 py-2 text-sm font-mono border-r border-gray-700 ${
              activeTab === LeftPanelTab.INVENTORY_ACTIONS 
                ? 'bg-teal-800 text-teal-100' 
                : 'bg-gray-800 text-gray-400 hover:text-gray-200'
            }`}
          >
            📦 INVENTORY
          </button>
          <button
            onClick={() => setActiveTab(LeftPanelTab.PRODUCT_TREE)}
            className={`px-4 py-2 text-sm font-mono border-r border-gray-700 ${
              activeTab === LeftPanelTab.PRODUCT_TREE 
                ? 'bg-teal-800 text-teal-100' 
                : 'bg-gray-800 text-gray-400 hover:text-gray-200'
            }`}
          >
            📋 CATALOG
          </button>
          <button
            onClick={() => setActiveTab(LeftPanelTab.SEARCH)}
            className={`px-4 py-2 text-sm font-mono ${
              activeTab === LeftPanelTab.SEARCH 
                ? 'bg-teal-800 text-teal-100' 
                : 'bg-gray-800 text-gray-400 hover:text-gray-200'
            }`}
          >
            🔍 SEARCH
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === LeftPanelTab.INVENTORY_ACTIONS && (
            <InventoryActionsPanel 
              inventoryItems={inventoryItems}
              facility={facility}
              onItemSelect={setSelectedItem}
              selectedItem={selectedItem}
            />
          )}
          
          {activeTab === LeftPanelTab.PRODUCT_TREE && (
            <ProductTreePanel 
              onProductSelect={(productId) => setSelectedItem({ type: 'new_product', productId })}
              selectedProductId={selectedItem?.type === 'new_product' ? selectedItem.productId : undefined}
            />
          )}
          
          {activeTab === LeftPanelTab.SEARCH && (
            <SearchPanel 
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onItemSelect={setSelectedItem}
            />
          )}
        </div>
      </div>

      {/* Right Panel: Workflow Preview */}
      <div className="w-1/2 flex flex-col">
        <div className="border-b border-gray-700 px-4 py-2">
          <h3 className="text-sm font-mono text-gray-400">WORKFLOW PREVIEW</h3>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {isGenerating ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-teal-400 font-mono">⚙ Analyzing workflow...</div>
            </div>
          ) : generatedWorkflow ? (
            <WorkflowPreviewPanel 
              workflow={generatedWorkflow}
              treatmentPlan={treatmentPlan}
              selectedEnhancements={selectedEnhancements}
              onEnhancementChange={setSelectedEnhancements}
              onJobStart={handleJobStart}
            />
          ) : selectedItem ? (
            <div className="text-center text-gray-500 mt-8">
              <div className="text-4xl mb-4">🔧</div>
              <div>Select an action to generate workflow</div>
            </div>
          ) : (
            <div className="text-center text-gray-500 mt-8">
              <div className="text-4xl mb-4">👈</div>
              <div>Select an item or product to begin</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Sub-components for each panel
interface InventoryActionsPanelProps {
  inventoryItems: ItemInstance[];
  facility: Facility;
  onItemSelect: (item: SelectedItem) => void;
  selectedItem: SelectedItem | null;
}

function InventoryActionsPanel({ inventoryItems, facility, onItemSelect, selectedItem }: InventoryActionsPanelProps) {
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const facilityCapabilities = facility.equipment_capacity || new Map();
  
  // Group items by base type and condition, filtering out raw materials
  const groupedItems = inventoryItems
    .filter(item => {
      const baseItem = getBaseItem(item.baseItemId);
      return baseItem && baseItem.manufacturingType !== ItemManufacturingType.RAW_MATERIAL; // Filter out tier 1 items
    })
    .reduce((acc, item) => {
      const baseItem = getBaseItem(item.baseItemId);
      if (!baseItem) return acc;
      
      // Group by base item and exact tag combination for clarity
      const sortedTags = [...item.tags].sort();
      const tagKey = sortedTags.length > 0 ? sortedTags.join('_') : 'pristine';
      const key = `${baseItem.id}_${tagKey}`;
      
      if (!acc[key]) {
        acc[key] = {
          baseItem,
          condition: item.tags.includes(ItemTag.DAMAGED) ? 'damaged' : 'functional',
          items: [],
          totalQuantity: 0,
          averageQuality: 0,
          tags: sortedTags
        };
      }
      
      acc[key].items.push(item);
      acc[key].totalQuantity += item.quantity;
      acc[key].averageQuality = acc[key].items.reduce((sum, i) => sum + i.quality * i.quantity, 0) / acc[key].totalQuantity;
      
      return acc;
    }, {} as Record<string, { baseItem: BaseItem; condition: string; items: ItemInstance[]; totalQuantity: number; averageQuality: number; tags: string[] }>);

  const toggleGroup = (key: string) => {
    // Only allow one group to be expanded at a time
    setExpandedGroup(expandedGroup === key ? null : key);
  };

  const getPrimaryActions = (items: ItemInstance[], condition: string): { action: string; icon: string; description: string }[] => {
    if (condition === 'damaged') {
      return [
        { action: 'repair', icon: '🔧', description: 'Restore to working condition' },
        { action: 'disassemble', icon: '🔬', description: 'Salvage usable components' }
      ];
    } else {
      return [
        { action: 'disassemble', icon: '🔬', description: 'Break down into components' },
        { action: 'refurbish', icon: '✨', description: 'Improve quality and condition' }
      ];
    }
  };

  return (
    <div className="space-y-2">
      <div className="text-xs text-gray-400 mb-4">
        Inventory items ({Object.keys(groupedItems).length} groups):
      </div>
      
      {Object.entries(groupedItems).map(([key, group]) => {
        const isExpanded = expandedGroup === key;
        const representativeItem = group.items[0];
        const primaryActions = getPrimaryActions(group.items, group.condition);
        
        return (
          <div key={key} className="border border-gray-700 bg-gray-800 rounded">
            {/* Collapsible Header */}
            <button
              onClick={() => toggleGroup(key)}
              className="w-full p-3 text-left flex items-center justify-between hover:bg-gray-750 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <span className="text-gray-400 text-sm">{isExpanded ? '▼' : '▶'}</span>
                <div>
                  <div className="font-medium text-teal-400 text-sm">
                    {group.baseItem.name}
                    {group.tags.length > 0 ? (
                      <span className="ml-2 text-xs text-blue-300">
                        [{group.tags.join(', ')}]
                      </span>
                    ) : (
                      <span className="ml-2 text-xs px-2 py-1 rounded bg-green-900 text-green-300">
                        pristine
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">
                    {group.totalQuantity} units • {Math.round(group.averageQuality)}% quality
                  </div>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                {primaryActions.length} actions
              </div>
            </button>
            
            {/* Expanded Actions */}
            {isExpanded && (
              <div className="border-t border-gray-700 p-3 space-y-2">
                {primaryActions.map((actionDef, idx) => {
                  const actions = InventoryActionDiscovery.analyzeItem(representativeItem, facility, equipmentDatabase);
                  const matchingAction = actions.find(a => a.name.toLowerCase().includes(actionDef.action));
                  const isFeasible = matchingAction?.feasible ?? false;
                  
                  return (
                    <button
                      key={idx}
                      onClick={() => matchingAction && onItemSelect({ 
                        type: 'discovered_action', 
                        action: matchingAction, 
                        inventoryItem: representativeItem 
                      })}
                      disabled={!isFeasible}
                      className={`w-full text-left p-2 rounded text-sm transition-colors ${
                        isFeasible
                          ? selectedItem?.type === 'discovered_action' && 
                            selectedItem?.action?.name.toLowerCase().includes(actionDef.action) &&
                            selectedItem?.inventoryItem?.baseItemId === representativeItem.baseItemId &&
                            selectedItem?.inventoryItem?.tags.includes(ItemTag.DAMAGED) === (group.condition === 'damaged')
                            ? 'bg-teal-700 text-teal-100 border border-teal-500'
                            : 'hover:bg-gray-700 text-gray-300 border border-gray-600'
                          : 'text-gray-600 cursor-not-allowed border border-gray-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span>{actionDef.icon}</span>
                          <span className="font-medium capitalize">{actionDef.action}</span>
                        </div>
                        <span className={isFeasible ? 'text-green-400' : 'text-red-400'}>
                          {isFeasible ? '✓' : '✗'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 mt-1 ml-6">
                        {actionDef.description}
                      </div>
                      {matchingAction && isFeasible && (
                        <div className="text-xs text-gray-500 mt-1 ml-6">
                          ~{matchingAction.estimatedTime}min • {matchingAction.estimatedCost}cr
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
      
      {Object.keys(groupedItems).length === 0 && (
        <div className="text-center text-gray-500 py-8">
          <div className="text-2xl mb-2">📦</div>
          <div>No items in inventory</div>
        </div>
      )}
    </div>
  );
}

function ProductTreePanel({ onProductSelect, selectedProductId }: {
  onProductSelect: (productId: string) => void;
  selectedProductId?: string;
}) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedSubcategory, setExpandedSubcategory] = useState<string | null>(null);
  
  // Group products by manufacturing method/process instead of abstract type
  const getManufacturingMethod = (product: BaseItem): string => {
    // Analyze the product to determine its primary manufacturing method
    if (product.manufacturingType === ItemManufacturingType.ASSEMBLY) {
      return 'Assembly Operations';
    } else if (product.manufacturingType === ItemManufacturingType.SHAPED_MATERIAL) {
      // Determine specific shaping method based on product characteristics
      if (product.id.includes('tube') || product.id.includes('cylinder')) {
        return 'Turning Operations';
      } else if (product.id.includes('billet') || product.id.includes('component')) {
        return 'Milling Operations';
      } else if (product.id.includes('casing') || product.id.includes('plastic')) {
        return 'Forming Operations';
      } else {
        return 'Precision Machining';
      }
    }
    return 'Other Operations';
  };

  // Group products by category → manufacturing method, filtering out raw materials
  const productsByCategory = Object.values(baseItems)
    .filter(product => product.manufacturingType !== ItemManufacturingType.RAW_MATERIAL)
    .reduce((acc, product) => {
      const category = product.category;
      const method = getManufacturingMethod(product);
      
      if (!acc[category]) {
        acc[category] = {};
      }
      if (!acc[category][method]) {
        acc[category][method] = [];
      }
      acc[category][method].push(product);
      return acc;
    }, {} as Record<string, Record<string, BaseItem[]>>);

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const toggleSubcategory = (subcategoryKey: string) => {
    // Only allow one manufacturing method to be expanded at a time
    setExpandedSubcategory(expandedSubcategory === subcategoryKey ? null : subcategoryKey);
  };

  return (
    <div className="space-y-2">
      <div className="text-xs text-gray-400 mb-4">
        Manufacturing catalog (by operation type):
      </div>
      
      {Object.entries(productsByCategory).map(([category, methodGroups]) => {
        const isCategoryExpanded = expandedCategories.has(category);
        const totalProducts = Object.values(methodGroups).flat().length;
        
        return (
          <div key={category} className="border border-gray-700 bg-gray-800 rounded">
            {/* Category Header */}
            <button
              onClick={() => toggleCategory(category)}
              className="w-full p-3 text-left flex items-center justify-between hover:bg-gray-750 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <span className="text-gray-400 text-sm">{isCategoryExpanded ? '▼' : '▶'}</span>
                <div>
                  <div className="font-medium text-blue-400 text-sm capitalize">
                    {category.replace('_', ' ').toLowerCase()}
                  </div>
                  <div className="text-xs text-gray-400">
                    {totalProducts} items • {Object.keys(methodGroups).length} methods
                  </div>
                </div>
              </div>
            </button>
            
            {/* Expanded Methods */}
            {isCategoryExpanded && (
              <div className="border-t border-gray-700 p-2 space-y-1">
                {Object.entries(methodGroups).map(([method, products]) => {
                  const subcategoryKey = `${category}_${method}`;
                  const isSubcategoryExpanded = expandedSubcategory === subcategoryKey;
                  
                  return (
                    <div key={method} className="border border-gray-600 bg-gray-900 rounded">
                      {/* Method Header */}
                      <button
                        onClick={() => toggleSubcategory(subcategoryKey)}
                        className="w-full p-2 text-left flex items-center justify-between hover:bg-gray-800 transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-500 text-xs">{isSubcategoryExpanded ? '▼' : '▶'}</span>
                          <div>
                            <div className="text-sm text-yellow-400 font-medium">{method}</div>
                            <div className="text-xs text-gray-500">{products.length} items</div>
                          </div>
                        </div>
                      </button>
                      
                      {/* Expanded Products */}
                      {isSubcategoryExpanded && (
                        <div className="border-t border-gray-600 p-2 space-y-1">
                          {products.map(product => (
                            <button
                              key={product.id}
                              onClick={() => onProductSelect(product.id)}
                              className={`w-full text-left p-2 rounded text-sm transition-colors ml-2 ${
                                selectedProductId === product.id
                                  ? 'bg-teal-700 text-teal-100 border border-teal-500'
                                  : 'hover:bg-gray-700 text-gray-300 border border-gray-600'
                              }`}
                            >
                              <div className="font-medium">{product.name}</div>
                              <div className="text-xs text-gray-400 mt-1">{product.description}</div>
                              <div className="text-xs text-gray-500 mt-1">
                                {product.baseValue}cr • {product.manufacturingType.replace('_', ' ').toLowerCase()}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function SearchPanel({ searchQuery, onSearchChange, onItemSelect }: {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onItemSelect: (item: SelectedItem) => void;
}) {
  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Search products and actions..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full bg-gray-800 border border-gray-600 text-gray-300 text-sm p-2 focus:border-teal-400 focus:outline-none"
      />
      
      <div className="text-center text-gray-500 py-8">
        <div className="text-2xl mb-2">🔍</div>
        <div>Search functionality coming soon</div>
      </div>
    </div>
  );
}

interface WorkflowPreviewPanelProps {
  workflow: GeneratedWorkflow;
  treatmentPlan: TreatmentPlan | null;
  selectedEnhancements: Enhancement[];
  onEnhancementChange: (enhancements: Enhancement[]) => void;
  onJobStart: () => void;
}

function WorkflowPreviewPanel({ 
  workflow, 
  treatmentPlan, 
  selectedEnhancements, 
  onEnhancementChange, 
  onJobStart 
}: WorkflowPreviewPanelProps) {
  return (
    <div className="space-y-6">
      {/* Workflow Overview */}
      <div className="border border-gray-700 bg-gray-800 p-4">
        <h4 className="text-teal-400 font-bold mb-2">{workflow.name}</h4>
        <p className="text-sm text-gray-300 mb-3">{workflow.description}</p>
        
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-gray-400">Duration:</span>
            <div className="text-white">{Math.round(workflow.estimatedDuration * 60)} minutes</div>
          </div>
          <div>
            <span className="text-gray-400">Confidence:</span>
            <div className="text-white">{Math.round(workflow.confidence * 100)}%</div>
          </div>
        </div>
      </div>

      {/* Treatment Plan */}
      {treatmentPlan && (
        <div className="border border-yellow-600 bg-yellow-900/20 p-4">
          <h5 className="text-yellow-400 font-bold mb-2">⚠ Treatment Required</h5>
          <div className="text-sm text-yellow-200 mb-2">
            Detected conditions: {treatmentPlan.detectedConditions.join(', ')}
          </div>
          <div className="text-xs text-yellow-300">
            {treatmentPlan.totalEstimatedTime}min treatment • +{treatmentPlan.expectedQualityGain}% quality
          </div>
        </div>
      )}

      {/* Operation Sequence */}
      <div className="border border-gray-700 bg-gray-800 p-4">
        <h5 className="text-gray-400 font-bold mb-3">Operations:</h5>
        <div className="space-y-2">
          {workflow.operations.map((op, idx) => (
            <div key={op.id} className="flex items-start space-x-3 text-xs">
              <div className="text-teal-400 font-mono w-6">{idx + 1}.</div>
              <div className="flex-1">
                <div className="text-white font-medium">{op.name}</div>
                <div className="text-gray-400">{op.description}</div>
                <div className="text-gray-500 mt-1">
                  {op.baseDurationMinutes}min • {op.labor_skill}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Expected Outputs */}
      <div className="border border-gray-700 bg-gray-800 p-4">
        <h5 className="text-gray-400 font-bold mb-3">Expected Results:</h5>
        <div className="space-y-2">
          {workflow.expectedOutputs.map((output, idx) => (
            <div key={idx} className="text-xs flex justify-between">
              <span className="text-gray-300">
                {output.quantity}x {output.itemId.replace(/_/g, ' ')}
                {output.tags.length > 0 && <span className="text-blue-300"> [{output.tags.join(', ')}]</span>}
              </span>
              <span className="text-teal-400">{output.quality}% quality</span>
            </div>
          ))}
        </div>
      </div>

      {/* Risk Assessment */}
      {workflow.riskFactors.length > 0 && (
        <div className="border border-red-600 bg-red-900/20 p-4">
          <h5 className="text-red-400 font-bold mb-2">⚠ Risk Factors:</h5>
          <ul className="text-xs text-red-200 space-y-1">
            {workflow.riskFactors.map((risk, idx) => (
              <li key={idx}>• {risk}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Start Job Button */}
      <button
        onClick={onJobStart}
        className="w-full bg-teal-600 hover:bg-teal-500 text-white py-3 px-4 font-mono text-sm transition-colors"
      >
        START WORKFLOW
      </button>
    </div>
  );
}

// Helper functions
function getActionIcon(actionType: ActionType): string {
  switch (actionType) {
    case ActionType.REPAIR: return '🔧';
    case ActionType.DISASSEMBLE: return '🔬';
    case ActionType.CLEAN: return '🧽';
    case ActionType.REFURBISH: return '✨';
    case ActionType.PREPARE_STOCK: return '🏭';
    case ActionType.USE_IN_ASSEMBLY: return '📦';
    case ActionType.ANALYZE: return '🔍';
    case ActionType.SCRAP: return '🗑️';
    default: return '⚙';
  }
}