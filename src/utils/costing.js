import { roundMoney } from './money';
import { convertUnit, normalizeUnit } from './units';
import { makeIngredientKey } from './recipe';

function getPriceMemoryMap(ingredients = []) {
  return ingredients.reduce((accumulator, item) => {
    accumulator[item.key || makeIngredientKey(item.name)] = item;
    return accumulator;
  }, {});
}

export function calculateCosting({
  recipe,
  ingredientLibrary,
  extraCosts,
  sellingPrice,
  desiredMargin
}) {
  const priceMap = getPriceMemoryMap(ingredientLibrary);
  const normalizedIngredients = (recipe?.ingredients || []).map((ingredient) => {
    const memory = priceMap[makeIngredientKey(ingredient.name)];
    const memoryQuantity = Number(memory?.purchaseQuantity || 1);
    const memoryUnit = normalizeUnit(memory?.purchaseUnit || ingredient.unit || 'unit');
    const recipeQuantityInPurchaseUnit = convertUnit(ingredient.quantity, ingredient.unit, memoryUnit);
    const cost =
      memory && memoryQuantity > 0
        ? roundMoney((Number(memory.purchasePrice || 0) / memoryQuantity) * recipeQuantityInPurchaseUnit)
        : 0;

    return {
      ...ingredient,
      matchedPrice: memory || null,
      convertedQuantity: roundMoney(recipeQuantityInPurchaseUnit),
      convertedUnit: memoryUnit,
      cost
    };
  });

  const ingredientsCost = normalizedIngredients.reduce((total, item) => total + item.cost, 0);
  const extraCostTotal = Object.values(extraCosts || {}).reduce(
    (total, item) => total + Number(item || 0),
    0
  );
  const totalCost = roundMoney(ingredientsCost + extraCostTotal);
  const yieldQuantity = Number(recipe?.yieldQuantity || 1);
  const costPerUnit = yieldQuantity > 0 ? roundMoney(totalCost / yieldQuantity) : totalCost;
  const parsedMargin = Number(String(desiredMargin ?? 0).replace('%', '')) || 0;
  const parsedSellingPrice = Number(sellingPrice || 0);

  const safeSellingPrice =
    parsedSellingPrice > 0 ? parsedSellingPrice : roundMoney(totalCost * (1 + parsedMargin / 100));
  const profit = roundMoney(safeSellingPrice - totalCost);
  const margin = totalCost > 0 ? roundMoney((profit / totalCost) * 100) : parsedMargin;

  return {
    ingredients: normalizedIngredients,
    totals: {
      ingredientsCost: roundMoney(ingredientsCost),
      extraCostTotal: roundMoney(extraCostTotal),
      totalCost,
      costPerUnit,
      sellingPrice: roundMoney(safeSellingPrice),
      profit,
      margin
    }
  };
}
