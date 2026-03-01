
import { calculatePrice } from "../../services/pricingService";

/**
 * Simulação de suíte de testes (Vitest-like)
 */
export async function testPricingService() {
  const results = [];
  
  // Teste 1: Preço por KM (Base 5.00 + 1.50/km, min 7.00)
  const priceKm = await calculatePrice({ 
    empresaId: "test_co", 
    distanceKm: 10 
  });
  results.push({
    name: "Cálculo por KM (10km)",
    pass: priceKm === 20.00, // 5 + (1.5 * 10)
    received: priceKm
  });

  // Teste 2: Preço Mínimo
  const priceMin = await calculatePrice({ 
    empresaId: "test_co", 
    distanceKm: 0.5 
  });
  results.push({
    name: "Preço Mínimo (0.5km)",
    pass: priceMin === 7.00,
    received: priceMin
  });

  return results;
}
