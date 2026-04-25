export function makeIngredientKey(name) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function getRecipeIngredients(recipe = {}) {
  const list = recipe.ingredients || recipe.items || recipe.recipeIngredients || [];
  return list.map((ingredient, index) => ({
    id: ingredient.id || `${index}_${makeIngredientKey(ingredient.name || ingredient.ingredientName)}`,
    name: ingredient.name || ingredient.ingredientName || 'Ingredient',
    quantity: Number(ingredient.quantity || ingredient.amount || ingredient.value || 0),
    unit: ingredient.unit || ingredient.measurementUnit || 'g'
  }));
}

export function normalizeRecipe(id, recipe = {}) {
  return {
    id,
    name: recipe.name || recipe.title || 'Untitled recipe',
    yieldQuantity: Number(recipe.yieldQuantity || recipe.servings || recipe.outputQuantity || 1),
    yieldUnit: recipe.yieldUnit || recipe.servingUnit || recipe.outputUnit || 'unit',
    ingredients: getRecipeIngredients(recipe),
    source: recipe.source || 'recipe-app'
  };
}
