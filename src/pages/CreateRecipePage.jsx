import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Toast } from '../components/ui/Toast';
import { useAuth } from '../context/AuthContext';
import { useBakery } from '../context/BakeryContext';
import { saveCustomRecipe } from '../services/recipeService';
import { getIngredientMemoryByName, subscribeToIngredientLibrary, upsertIngredientPrice } from '../services/ingredientService';
import { calculateCosting } from '../utils/costing';
import { formatCurrency } from '../utils/money';
import { sanitizeDecimalInput } from '../utils/numberInput';
import { UNIT_OPTIONS } from '../utils/units';

function createIngredient() {
  return { name: '', quantity: '', unit: 'g', purchasePrice: '', purchaseQuantity: '1', purchaseUnit: 'g' };
}

export default function CreateRecipePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { bakeryId } = useBakery();
  const [recipeName, setRecipeName] = useState('');
  const [yieldQuantity, setYieldQuantity] = useState('1');
  const [yieldUnit, setYieldUnit] = useState('piece');
  const [ingredients, setIngredients] = useState([createIngredient()]);
  const [ingredientLibrary, setIngredientLibrary] = useState([]);
  const [toastOpen, setToastOpen] = useState(false);

  useEffect(() => {
    if (!bakeryId || !user?.uid) {
      return;
    }

    return subscribeToIngredientLibrary({ bakeryId, userId: user.uid }, setIngredientLibrary);
  }, [bakeryId, user?.uid]);

  const ingredientMatches = useMemo(
    () => ingredients.map((ingredient) => getIngredientMemoryByName(ingredientLibrary, ingredient.name)),
    [ingredientLibrary, ingredients]
  );

  const summary = useMemo(() => {
    const inlineLibrary = [
      ...ingredientLibrary,
      ...ingredients
        .filter((ingredient, index) => ingredient.name.trim() && !ingredientMatches[index] && ingredient.purchasePrice)
        .map((ingredient) => ({
          key: ingredient.name.trim().toLowerCase(),
          name: ingredient.name,
          purchaseUnit: ingredient.purchaseUnit || ingredient.unit,
          purchaseQuantity: ingredient.purchaseQuantity || 1,
          purchasePrice: ingredient.purchasePrice
        }))
    ];

    const costing = calculateCosting({
      recipe: {
        name: recipeName,
        yieldQuantity,
        yieldUnit,
        ingredients: ingredients.filter((ingredient) => ingredient.name.trim())
      },
      ingredientLibrary: inlineLibrary,
      extraCosts: {},
      sellingPrice: 0,
      desiredMargin: 0
    });

    return {
      totalCost: costing.totals.totalCost,
      costPerUnit: costing.totals.costPerUnit
    };
  }, [ingredientLibrary, ingredientMatches, ingredients, recipeName, yieldQuantity, yieldUnit]);

  async function handleSave() {
    const filteredIngredients = ingredients.filter((ingredient) => ingredient.name.trim());
    if (!recipeName.trim() || !filteredIngredients.length) {
      return;
    }

    for (const ingredient of filteredIngredients) {
      const existingIngredient = getIngredientMemoryByName(ingredientLibrary, ingredient.name);
      if (!existingIngredient) {
        if (!ingredient.purchasePrice || Number(ingredient.purchasePrice) <= 0) {
          return;
        }

        await upsertIngredientPrice({
          bakeryId,
          userId: user.uid,
          name: ingredient.name,
          purchaseUnit: ingredient.purchaseUnit || ingredient.unit,
          purchaseQuantity: ingredient.purchaseQuantity || 1,
          purchasePrice: ingredient.purchasePrice
        });
      }
    }

    const id = await saveCustomRecipe({
      bakeryId,
      userId: user.uid,
      recipe: {
        name: recipeName,
        yieldQuantity,
        yieldUnit,
        ingredients: filteredIngredients
      }
    });

    setToastOpen(true);
    window.setTimeout(() => setToastOpen(false), 1800);
    navigate(`/recipe/${id}?source=costing-app`, { replace: true });
  }

  return (
    <div className="page">
      <section className="detail-top">
        <button type="button" className="back-link" onClick={() => navigate(-1)}>
          <ChevronLeft size={18} />
          Back
        </button>
        <div className="glass-card detail-hero">
          <div className="hero-kicker">
            <span className="hero-emoji" aria-hidden="true">🧁</span>
            <span className="tiny">Custom recipe builder</span>
          </div>
          <h1 className="page-title">Create Custom Recipe</h1>
          <p className="page-subtitle">Add ingredients once, save prices as you go, and keep everything easy to reuse.</p>
        </div>
      </section>

      <section className="glass-card surface-card stack-sm">
        <div>
          <div className="section-kicker">Recipe info</div>
          <strong className="section-title">Name and yield</strong>
        </div>
        <input className="field" placeholder="Recipe name" value={recipeName} onChange={(event) => setRecipeName(event.target.value)} />
        <div className="triple-grid">
          <input
            className="field"
            type="text"
            inputMode="decimal"
            placeholder="Yield"
            value={yieldQuantity}
            onChange={(event) => setYieldQuantity(sanitizeDecimalInput(event.target.value))}
          />
          <select className="field" value={yieldUnit} onChange={(event) => setYieldUnit(event.target.value)}>
            {UNIT_OPTIONS.filter((unit) => ['piece', 'dozen', 'g', 'kg', 'ml', 'l'].includes(unit.value)).map((unit) => (
              <option key={unit.value} value={unit.value}>
                {unit.label}
              </option>
            ))}
          </select>
          <button type="button" className="button secondary" onClick={() => setIngredients((current) => [...current, createIngredient()])}>
            <Plus size={16} style={{ verticalAlign: 'text-bottom', marginRight: 6 }} />
            Ingredient
          </button>
        </div>
      </section>

      <section className="glass-card surface-card stack-sm">
        <div className="page-header">
          <div>
            <div className="section-kicker">Ingredients</div>
            <strong className="section-title">What goes into it</strong>
          </div>
          <span className="pill">🌸 {ingredients.length} rows</span>
        </div>
        {ingredients.map((ingredient, index) => {
          const existingIngredient = ingredientMatches[index];

          return (
            <div key={`ingredient_${index}`} className="ingredient-block">
              <div className="ingredient-block-head">
                <span className="pill">#{index + 1}</span>
              </div>
              <div className="triple-grid">
                <input
                  className="field"
                  placeholder="Ingredient"
                  value={ingredient.name}
                  onChange={(event) =>
                    setIngredients((current) =>
                      current.map((item, itemIndex) => (itemIndex === index ? { ...item, name: event.target.value } : item))
                    )
                  }
                />
                <input
                  className="field"
                  type="text"
                  inputMode="decimal"
                  placeholder="Quantity"
                  value={ingredient.quantity}
                  onChange={(event) =>
                    setIngredients((current) =>
                      current.map((item, itemIndex) => (itemIndex === index ? { ...item, quantity: sanitizeDecimalInput(event.target.value) } : item))
                    )
                  }
                />
                <select
                  className="field"
                  value={ingredient.unit}
                  onChange={(event) =>
                    setIngredients((current) =>
                      current.map((item, itemIndex) => (itemIndex === index ? { ...item, unit: event.target.value } : item))
                    )
                  }
                >
                  {UNIT_OPTIONS.map((unit) => (
                    <option key={unit.value} value={unit.value}>
                      {unit.label}
                    </option>
                  ))}
                </select>
              </div>

              {existingIngredient ? (
                <div className="tiny ingredient-memory-note">
                  Using saved ingredient price: {existingIngredient.purchasePrice} / {existingIngredient.purchaseQuantity}{' '}
                  {existingIngredient.purchaseUnit}
                </div>
              ) : ingredient.name.trim() ? (
                <>
                  <div className="tiny ingredient-memory-note">💸 Add a price once and we’ll save it for next time</div>
                  <div className="triple-grid">
                    <input
                      className="field"
                      type="text"
                      inputMode="decimal"
                      placeholder="Price"
                      value={ingredient.purchasePrice}
                      onChange={(event) =>
                        setIngredients((current) =>
                          current.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, purchasePrice: sanitizeDecimalInput(event.target.value) } : item
                          )
                        )
                      }
                    />
                    <input
                      className="field"
                      type="text"
                      inputMode="decimal"
                      placeholder="Pack qty"
                      value={ingredient.purchaseQuantity}
                      onChange={(event) =>
                        setIngredients((current) =>
                          current.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, purchaseQuantity: sanitizeDecimalInput(event.target.value) } : item
                          )
                        )
                      }
                    />
                    <select
                      className="field"
                      value={ingredient.purchaseUnit}
                      onChange={(event) =>
                        setIngredients((current) =>
                          current.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, purchaseUnit: event.target.value } : item
                          )
                        )
                      }
                    >
                      {UNIT_OPTIONS.map((unit) => (
                        <option key={unit.value} value={unit.value}>
                          {unit.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              ) : null}
            </div>
          );
        })}
      </section>

      <section className="glass-card surface-card">
        <div className="page-header">
          <div>
            <div className="section-kicker">Cost summary</div>
            <strong className="section-title">Live recipe cost</strong>
          </div>
          <span className="pill">📈 updates live</span>
        </div>
        <div className="metrics" style={{ marginTop: 14 }}>
          <div className="glass-card metric">
            <div className="metric-label">Total cost</div>
            <div className="metric-value">{formatCurrency(summary.totalCost)}</div>
          </div>
          <div className="glass-card metric">
            <div className="metric-label">Cost per unit</div>
            <div className="metric-value">{formatCurrency(summary.costPerUnit)}</div>
          </div>
        </div>
      </section>

      <div className="sticky-save">
        <button type="button" className="button" onClick={handleSave}>
          Save recipe
        </button>
      </div>
      <Toast open={toastOpen} message="Saved successfully" />
    </div>
  );
}
