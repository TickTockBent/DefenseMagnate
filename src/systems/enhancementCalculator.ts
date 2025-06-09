// Enhancement Calculator - Manufacturing v2 Phase 2
// Calculates costs, benefits, and market values for enhanced products

import { 
  Enhancement, 
  EnhancementSelection, 
  ItemInstance, 
  BaseItem 
} from '../types';
import { getBaseItem } from '../data/baseItems';

export class EnhancementCalculator {
  
  /**
   * Calculate the market value multiplier for enhanced products
   */
  static calculateMarketValueMultiplier(enhancements: Enhancement[]): number {
    let baseMultiplier = 1.0;
    
    for (const enhancement of enhancements) {
      // Each enhancement adds value based on its category and effects
      let enhancementValue = 0;
      
      switch (enhancement.category) {
        case 'performance':
          // Performance enhancements add significant value
          enhancementValue = 0.3 + (enhancement.qualityModifier * 0.01); // Base 30% + quality bonus
          break;
          
        case 'aesthetic':
          // Aesthetic enhancements add moderate value
          enhancementValue = 0.15 + (enhancement.qualityModifier * 0.005); // Base 15% + small quality bonus
          break;
          
        case 'functional':
          // Functional enhancements add utility-based value
          enhancementValue = 0.2 + (enhancement.qualityModifier * 0.008); // Base 20% + moderate quality bonus
          break;
      }
      
      // Factor in complexity - more complex enhancements are worth more
      const complexityBonus = (enhancement.complexityModifier - 1.0) * 0.5;
      enhancementValue += complexityBonus;
      
      // Factor in time investment - longer production time = more valuable
      const timeBonus = (enhancement.timeModifier - 1.0) * 0.3;
      enhancementValue += timeBonus;
      
      baseMultiplier += enhancementValue;
    }
    
    return baseMultiplier;
  }
  
  /**
   * Calculate the total additional cost of applying enhancements
   */
  static calculateEnhancementCosts(
    enhancements: Enhancement[],
    baseProductValue: number,
    quantity: number = 1
  ): {
    materialCosts: Array<{itemId: string; quantity: number; estimatedValue: number}>;
    timeCosts: {additionalHours: number; laborCostMultiplier: number};
    totalEstimatedCost: number;
  } {
    const materialCosts: Array<{itemId: string; quantity: number; estimatedValue: number}> = [];
    let totalAdditionalTime = 0;
    let laborCostMultiplier = 1.0;
    let totalEstimatedCost = 0;
    
    for (const enhancement of enhancements) {
      for (const cost of enhancement.costs) {
        switch (cost.type) {
          case 'material':
            if (cost.itemId) {
              const baseItem = getBaseItem(cost.itemId);
              const itemValue = baseItem ? baseItem.baseValue : 10; // Fallback value
              const totalQuantity = cost.quantity * quantity;
              const estimatedValue = itemValue * totalQuantity;
              
              materialCosts.push({
                itemId: cost.itemId,
                quantity: totalQuantity,
                estimatedValue
              });
              
              totalEstimatedCost += estimatedValue;
            }
            break;
            
          case 'time':
            // Time costs are represented as multipliers
            totalAdditionalTime += (cost.quantity - 1.0) * 60; // Convert to minutes
            laborCostMultiplier *= cost.quantity;
            break;
            
          case 'credits':
            totalEstimatedCost += cost.quantity * quantity;
            break;
        }
      }
    }
    
    // Add labor cost based on time multiplier and base product value
    const laborCost = baseProductValue * (laborCostMultiplier - 1.0) * 0.3; // 30% of value increase per time multiplier
    totalEstimatedCost += laborCost;
    
    return {
      materialCosts,
      timeCosts: {
        additionalHours: totalAdditionalTime / 60,
        laborCostMultiplier
      },
      totalEstimatedCost
    };
  }
  
  /**
   * Calculate the net profitability of applying enhancements
   */
  static calculateEnhancementProfitability(
    enhancements: Enhancement[],
    baseProductValue: number,
    quantity: number = 1
  ): {
    baseValue: number;
    enhancedValue: number;
    totalCosts: number;
    netProfit: number;
    profitMargin: number;
    recommendedSalePrice: number;
  } {
    const baseValue = baseProductValue * quantity;
    const valueMultiplier = this.calculateMarketValueMultiplier(enhancements);
    const enhancedValue = baseValue * valueMultiplier;
    
    const costs = this.calculateEnhancementCosts(enhancements, baseProductValue, quantity);
    const totalCosts = costs.totalEstimatedCost;
    
    const netProfit = enhancedValue - baseValue - totalCosts;
    const profitMargin = (netProfit / (baseValue + totalCosts)) * 100;
    
    // Recommended sale price includes a reasonable profit margin
    const recommendedSalePrice = enhancedValue * 1.2; // 20% markup over enhanced value
    
    return {
      baseValue,
      enhancedValue,
      totalCosts,
      netProfit,
      profitMargin,
      recommendedSalePrice
    };
  }
  
  /**
   * Get enhancement recommendations based on cost-benefit analysis
   */
  static getEnhancementRecommendations(
    availableEnhancements: Enhancement[],
    baseProductValue: number,
    quantity: number = 1
  ): Array<{
    enhancement: Enhancement;
    profitability: ReturnType<typeof EnhancementCalculator.calculateEnhancementProfitability>;
    recommendation: 'highly_recommended' | 'recommended' | 'marginal' | 'not_recommended';
    reasoning: string;
  }> {
    const recommendations = availableEnhancements.map(enhancement => {
      const profitability = this.calculateEnhancementProfitability([enhancement], baseProductValue, quantity);
      
      let recommendation: 'highly_recommended' | 'recommended' | 'marginal' | 'not_recommended';
      let reasoning: string;
      
      if (profitability.profitMargin > 30) {
        recommendation = 'highly_recommended';
        reasoning = `High profit margin (${profitability.profitMargin.toFixed(1)}%) with strong market value increase`;
      } else if (profitability.profitMargin > 15) {
        recommendation = 'recommended';
        reasoning = `Good profit margin (${profitability.profitMargin.toFixed(1)}%) justifies enhancement costs`;
      } else if (profitability.profitMargin > 5) {
        recommendation = 'marginal';
        reasoning = `Low profit margin (${profitability.profitMargin.toFixed(1)}%) - consider for premium markets only`;
      } else {
        recommendation = 'not_recommended';
        reasoning = `Poor profit margin (${profitability.profitMargin.toFixed(1)}%) - costs exceed benefits`;
      }
      
      return {
        enhancement,
        profitability,
        recommendation,
        reasoning
      };
    });
    
    // Sort by profitability (highest margin first)
    return recommendations.sort((a, b) => b.profitability.profitMargin - a.profitability.profitMargin);
  }
  
  /**
   * Calculate the quality impact of enhancements on a specific item
   */
  static calculateQualityImpact(
    baseItem: BaseItem,
    baseQuality: number,
    enhancements: Enhancement[]
  ): {
    baseQuality: number;
    enhancedQuality: number;
    qualityIncrease: number;
    appliedTags: string[];
    estimatedPerformanceGain: string;
  } {
    let enhancedQuality = baseQuality;
    const appliedTags: string[] = [];
    
    // Apply quality modifiers from enhancements
    for (const enhancement of enhancements) {
      enhancedQuality += enhancement.qualityModifier;
      
      // Respect quality caps
      if (enhancement.qualityCap) {
        enhancedQuality = Math.min(enhancedQuality, enhancement.qualityCap);
      }
      
      // Collect tags
      enhancement.outputTags.forEach(tag => {
        if (!appliedTags.includes(tag)) {
          appliedTags.push(tag);
        }
      });
    }
    
    // Cap at 100%
    enhancedQuality = Math.min(100, enhancedQuality);
    
    const qualityIncrease = enhancedQuality - baseQuality;
    
    // Generate performance estimation
    let estimatedPerformanceGain = '';
    if (qualityIncrease > 20) {
      estimatedPerformanceGain = 'Significant performance improvement expected';
    } else if (qualityIncrease > 10) {
      estimatedPerformanceGain = 'Noticeable performance improvement expected';
    } else if (qualityIncrease > 5) {
      estimatedPerformanceGain = 'Minor performance improvement expected';
    } else {
      estimatedPerformanceGain = 'Minimal performance change expected';
    }
    
    return {
      baseQuality,
      enhancedQuality,
      qualityIncrease,
      appliedTags,
      estimatedPerformanceGain
    };
  }
}