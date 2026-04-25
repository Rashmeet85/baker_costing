const MASS_FACTORS = {
  mg: 0.001,
  g: 1,
  kg: 1000,
  oz: 28.3495,
  lb: 453.592
};

const VOLUME_FACTORS = {
  ml: 1,
  l: 1000,
  tsp: 5,
  tbsp: 15,
  cup: 240,
  '1/2 cup': 120,
  '1/4 cup': 60,
  'fl oz': 29.57
};

const UNIT_FACTORS = {
  unit: 1,
  piece: 1,
  pcs: 1,
  dozen: 12
};

export const UNIT_OPTIONS = [
  { label: 'mg', value: 'mg' },
  { label: 'g', value: 'g' },
  { label: 'kg', value: 'kg' },
  { label: 'oz', value: 'oz' },
  { label: 'lb', value: 'lb' },
  { label: 'ml', value: 'ml' },
  { label: 'L', value: 'l' },
  { label: 'tsp', value: 'tsp' },
  { label: 'tbsp', value: 'tbsp' },
  { label: 'cup', value: 'cup' },
  { label: '1/2 cup', value: '1/2 cup' },
  { label: '1/4 cup', value: '1/4 cup' },
  { label: 'fl oz', value: 'fl oz' },
  { label: 'piece', value: 'piece' },
  { label: 'dozen', value: 'dozen' }
];

function getTable(unit) {
  if (MASS_FACTORS[unit]) {
    return MASS_FACTORS;
  }

  if (VOLUME_FACTORS[unit]) {
    return VOLUME_FACTORS;
  }

  return UNIT_FACTORS;
}

export function normalizeUnit(unit) {
  const value = String(unit || 'unit').trim().toLowerCase();
  if (['gram', 'grams'].includes(value)) return 'g';
  if (['kilogram', 'kilograms'].includes(value)) return 'kg';
  if (['milliliter', 'milliliters'].includes(value)) return 'ml';
  if (['liter', 'liters'].includes(value)) return 'l';
  if (['pieces', 'piece', 'pcs'].includes(value)) return 'piece';
  if (['tablespoon', 'tablespoons'].includes(value)) return 'tbsp';
  if (['teaspoon', 'teaspoons'].includes(value)) return 'tsp';
  if (['cups'].includes(value)) return 'cup';
  return value || 'unit';
}

export function convertUnit(quantity, fromUnit, toUnit) {
  const from = normalizeUnit(fromUnit);
  const to = normalizeUnit(toUnit);

  if (from === to) {
    return Number(quantity || 0);
  }

  const fromTable = getTable(from);
  const toTable = getTable(to);

  if (fromTable !== toTable || !fromTable[from] || !toTable[to]) {
    return Number(quantity || 0);
  }

  const baseQuantity = Number(quantity || 0) * fromTable[from];
  return baseQuantity / toTable[to];
}
