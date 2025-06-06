// Product helper functions that don't import the Product interface directly
// This avoids the runtime import issue

// Define a minimal product interface for runtime use
export interface ProductData {
  id: string;
  name: string;
  materials_required: Array<{
    material_id: string;
    quantity_per_unit: number;
  }>;
  base_labor_hours: number;
  complexity_rating: number;
}

// Runtime product definitions (without importing the full Product interface)
export const productData: Record<string, ProductData> = {
  basic_sidearm: {
    id: 'basic_sidearm',
    name: 'Basic Sidearm',
    materials_required: [
      {
        material_id: 'steel',
        quantity_per_unit: 1.0,
      },
      {
        material_id: 'plastic',
        quantity_per_unit: 0.3,
      }
    ],
    base_labor_hours: 2,
    complexity_rating: 2,
  }
};

// Helper functions that can be safely imported by gameStore
export function getProductData(productId: string): ProductData | undefined {
  return productData[productId];
}

export function getAllProductIds(): string[] {
  return Object.keys(productData);
}

export function canAffordMaterials(
  productId: string, 
  quantity: number, 
  availableMaterials: Record<string, number>
): boolean {
  const product = getProductData(productId);
  if (!product) return false;
  
  return product.materials_required.every(req => 
    (availableMaterials[req.material_id] || 0) >= req.quantity_per_unit * quantity
  );
}