import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronLeft, Trash2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Toast } from '../components/ui/Toast';
import { useAuth } from '../context/AuthContext';
import { useBakery } from '../context/BakeryContext';
import { saveCosting } from '../services/costingService';
import { subscribeToIngredientLibrary, upsertIngredientPrice } from '../services/ingredientService';
import { deleteCustomRecipe, subscribeToRecipe } from '../services/recipeService';
import { calculateCosting } from '../utils/costing';
import { formatCurrency } from '../utils/money';
import { canEdit } from '../utils/permissions';
import { UNIT_OPTIONS } from '../utils/units';
import { sanitizeDecimalInput, toNumber } from '../utils/numberInput';

export default function RecipeDetailPage() {
  const navigate = useNavigate();
  const { recipeId } = useParams();
  const { user } = useAuth();
  const { bakeryId, role } = useBakery();
  const [recipe, setRecipe] = useState(null);
  const [ingredientLibrary, setIngredientLibrary] = useState([]);
  const [ingredientDrafts, setIngredientDrafts] = useState({});
  const [marginInput, setMarginInput] = useState('35');
  const [extraCostsOpen, setExtraCostsOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [extraCosts, setExtraCosts] = useState({
    packaging: '0',
    electricity: '0',
    labor: '0'
  });

  useEffect(() => subscribeToRecipe(recipeId, setRecipe), [recipeId]);
  useEffect(
    () => subscribeToIngredientLibrary({ bakeryId, userId: user?.uid }, setIngredientLibrary),
    [bakeryId, user?.uid]
  );

  useEffect(() => {
    if (!recipe) {
      setIngredientDrafts({});
      return;
    }

    setIngredientDrafts((current) => {
      const next = {};
      recipe.ingredients.forEach((ingredient) => {
        next[ingredient.id] = current[ingredient.id] || {
          purchaseUnit: ingredient.unit,
          purchaseQuantity: ingredient.quantity || 1,
          purchasePrice: ''
        };
      });
      return next;
    });
  }, [recipe]);

  const costing = useMemo(
    () =>
      calculateCosting({
        recipe,
        ingredientLibrary,
        extraCosts: {
          packaging: toNumber(extraCosts.packaging),
          electricity: toNumber(extraCosts.electricity),
          labor: toNumber(extraCosts.labor)
        },
        sellingPrice: 0,
        desiredMargin: toNumber(marginInput)
      }),
    [extraCosts, ingredientLibrary, marginInput, recipe]
  );

  async function handleSave() {
    if (!canEdit(role) || !recipe || !bakeryId || !user?.uid) {
      return;
    }

    await saveCosting({
      bakeryId,
      recipeId: recipe.id,
      recipeName: recipe.name,
      recipeSource: recipe.source || 'recipe-app',
      totals: costing.totals,
      extraCosts: {
        packaging: toNumber(extraCosts.packaging),
        electricity: toNumber(extraCosts.electricity),
        labor: toNumber(extraCosts.labor)
      },
      sellingPrice: costing.totals.sellingPrice,
      desiredMargin: toNumber(marginInput),
      userId: user.uid
    });
    setToastOpen(true);
    window.setTimeout(() => setToastOpen(false), 1800);
  }

  if (!recipe) {
    return <div className="page"><div className="glass-card hero-card skeleton" style={{ height: 220 }} /></div>;
  }

  return (
    <div className="page">
      <section className="detail-top">
        <button type="button" className="back-link" onClick={() => navigate(-1)}>
          <ChevronLeft size={18} />
          Recipes
        </button>
        <div className="glass-card detail-hero">
          <div className="hero-kicker">
            <span className="hero-emoji" aria-hidden="true">{recipe.source === 'costing-app' ? '🧁' : '🍰'}</span>
            <span className="tiny">{recipe.source === 'costing-app' ? 'Custom recipe' : 'Recipe book import'}</span>
          </div>
          <div className="recipe-card-top">
            <span className={`source-badge ${recipe.source === 'costing-app' ? 'custom' : ''}`}>
              {recipe.source === 'costing-app' ? 'Custom' : 'Menu'}
            </span>
            {recipe.source === 'costing-app' ? (
              <button type="button" className="icon-button" onClick={() => setDeleteOpen(true)}>
                <Trash2 size={16} />
              </button>
            ) : null}
          </div>
          <h1 className="page-title" style={{ marginTop: 12 }}>{recipe.name}</h1>
          <div className="tiny">Yield {recipe.yieldQuantity} {recipe.yieldUnit}</div>
          {canEdit(role) ? (
            <button type="button" className="button" style={{ marginTop: 16 }} onClick={handleSave}>
              Save
            </button>
          ) : null}

          <div className="pricing-panel">
            <div className="pricing-item">
              <span className="tiny">Total Cost</span>
              <strong>{formatCurrency(costing.totals.totalCost)}</strong>
            </div>
            <label className="pricing-item">
              <span className="tiny">Profit Margin</span>
              <input
                className="pricing-input"
                type="text"
                inputMode="decimal"
                value={marginInput}
                disabled={!canEdit(role)}
                onChange={(event) => setMarginInput(sanitizeDecimalInput(event.target.value))}
              />
            </label>
            <div className="pricing-item">
              <span className="tiny">Selling Price</span>
              <strong>{formatCurrency(costing.totals.sellingPrice)}</strong>
            </div>
            <div className="pricing-item">
              <span className="tiny">Profit</span>
              <strong>{formatCurrency(costing.totals.profit)}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="glass-card surface-card">
        <button
          type="button"
          className="list-item"
          style={{ width: '100%', border: 0, background: 'transparent', padding: 0 }}
          onClick={() => setExtraCostsOpen((value) => !value)}
        >
          <div>
            <strong>Extra costs</strong>
            <div className="tiny">Packaging, electricity, and labor</div>
          </div>
          <ChevronDown size={18} style={{ transform: extraCostsOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
        </button>
        {extraCostsOpen ? (
          <div className="stack-sm" style={{ marginTop: 14 }}>
            {Object.entries(extraCosts).map(([key, value]) => (
              <label key={key} className="stack-sm">
                <span className="tiny" style={{ textTransform: 'capitalize' }}>{key}</span>
                <input
                  className="field"
                  type="text"
                  inputMode="decimal"
                  value={value}
                  disabled={!canEdit(role)}
                  onChange={(event) =>
                    setExtraCosts((current) => ({ ...current, [key]: sanitizeDecimalInput(event.target.value) }))
                  }
                />
              </label>
            ))}
          </div>
        ) : null}
      </section>

      <section className="glass-card surface-card">
        <div className="page-header">
          <div>
            <div className="section-kicker">Ingredients</div>
            <strong className="section-title">Ingredient costing</strong>
          </div>
          <div className="tiny">Cost per ingredient</div>
        </div>

        <div className="stack-sm" style={{ marginTop: 14 }}>
          {costing.ingredients.map((ingredient) => {
            const draft = ingredientDrafts[ingredient.id] || {
              purchaseUnit: ingredient.unit,
              purchaseQuantity: ingredient.quantity || 1,
              purchasePrice: ''
            };
            const showInlinePricing = !ingredient.matchedPrice || canEdit(role);

            return (
              <div key={ingredient.id} className="ingredient-row">
                <div className="ingredient-main">
                  <div>
                    <strong>{ingredient.name}</strong>
                    <div className="tiny">
                      {ingredient.quantity} {ingredient.unit}
                    </div>
                  </div>
                  <strong>{formatCurrency(ingredient.cost)}</strong>
                </div>
                {showInlinePricing ? (
                  <div className="ingredient-editor">
                    <input
                      className="field"
                      type="text"
                      inputMode="decimal"
                      placeholder="Price"
                      value={draft.purchasePrice}
                      disabled={!canEdit(role)}
                      onChange={(event) =>
                        setIngredientDrafts((current) => ({
                          ...current,
                          [ingredient.id]: { ...draft, purchasePrice: sanitizeDecimalInput(event.target.value) }
                        }))
                      }
                      onBlur={async () => {
                        if (!canEdit(role) || !draft.purchasePrice) {
                          return;
                        }

                        await upsertIngredientPrice({
                          bakeryId,
                          userId: user.uid,
                          name: ingredient.name,
                          purchaseUnit: draft.purchaseUnit,
                          purchaseQuantity: draft.purchaseQuantity,
                          purchasePrice: draft.purchasePrice,
                          sourcePrice: ingredient.matchedPrice?.purchasePrice
                        });
                      }}
                    />
                    <input
                      className="field"
                      type="text"
                      inputMode="decimal"
                      placeholder="Qty"
                      value={draft.purchaseQuantity}
                      disabled={!canEdit(role)}
                      onChange={(event) =>
                        setIngredientDrafts((current) => ({
                          ...current,
                          [ingredient.id]: { ...draft, purchaseQuantity: sanitizeDecimalInput(event.target.value) }
                        }))
                      }
                    />
                    <select
                      className="field"
                      value={draft.purchaseUnit}
                      disabled={!canEdit(role)}
                      onChange={(event) =>
                        setIngredientDrafts((current) => ({
                          ...current,
                          [ingredient.id]: { ...draft, purchaseUnit: event.target.value }
                        }))
                      }
                    >
                      {UNIT_OPTIONS.map((unit) => (
                        <option key={unit.value} value={unit.value}>
                          {unit.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}
                {ingredient.matchedPrice ? (
                  <div className="tiny ingredient-memory-note">
                    ✨ Using saved price memory
                  </div>
                ) : (
                  <div className="tiny ingredient-memory-note">
                    💸 Add a price once and we’ll remember it
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
      <ConfirmDialog
        open={deleteOpen}
        title="Delete recipe?"
        body="This will remove the custom recipe from your costing app."
        onCancel={() => setDeleteOpen(false)}
        onConfirm={async () => {
          await deleteCustomRecipe(recipe.id);
          setDeleteOpen(false);
          navigate('/');
        }}
      />
      <Toast open={toastOpen} message="Saved successfully" />
    </div>
  );
}
