import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useAuth } from '../context/AuthContext';
import { useBakery } from '../context/BakeryContext';
import { deleteIngredient, subscribeToIngredientLibrary, upsertIngredientPrice } from '../services/ingredientService';
import { formatCurrency } from '../utils/money';
import { sanitizeDecimalInput } from '../utils/numberInput';
import { UNIT_OPTIONS } from '../utils/units';

export default function IngredientsPage() {
  const { user } = useAuth();
  const { bakeryId } = useBakery();
  const [ingredients, setIngredients] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(
    () => subscribeToIngredientLibrary({ bakeryId, userId: user?.uid }, setIngredients),
    [bakeryId, user?.uid]
  );

  return (
    <div className="page">
      <section className="glass-card hero-card">
        <div className="hero-kicker">
          <span className="hero-emoji" aria-hidden="true">🫙</span>
          <span className="tiny">Ingredient memory</span>
        </div>
        <h1 className="page-title">Ingredient Pricing</h1>
        <p className="page-subtitle">Keep your prices fresh here and costing updates stay smooth everywhere else.</p>
      </section>

      <div className="stack-sm">
        {ingredients.map((ingredient) => (
          <div key={ingredient.id} className="glass-card ingredient-card">
            <div className="ingredient-main">
              <div>
                <strong>{ingredient.name}</strong>
                <div className="tiny">
                  Last updated {ingredient.updatedAt?.toDate ? ingredient.updatedAt.toDate().toLocaleDateString() : 'recently'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <strong>{formatCurrency(ingredient.purchasePrice)}</strong>
                <button type="button" className="icon-button" onClick={() => setDeleteTarget(ingredient)}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <div className="tiny ingredient-memory-note" style={{ marginTop: 10 }}>
              🌷 Price per {ingredient.purchaseQuantity} {ingredient.purchaseUnit}
            </div>
            <div className="ingredient-editor">
              <input
                className="field"
                type="text"
                inputMode="decimal"
                defaultValue={ingredient.purchasePrice}
                onBlur={(event) =>
                  upsertIngredientPrice({
                    bakeryId,
                    userId: user.uid,
                    name: ingredient.name,
                    purchaseUnit: ingredient.purchaseUnit,
                    purchaseQuantity: ingredient.purchaseQuantity,
                    purchasePrice: sanitizeDecimalInput(event.target.value),
                    sourcePrice: ingredient.purchasePrice,
                    previousPrice: ingredient.purchasePrice
                  })
                }
              />
              <input
                className="field"
                type="text"
                inputMode="decimal"
                defaultValue={ingredient.purchaseQuantity}
                onBlur={(event) =>
                  upsertIngredientPrice({
                    bakeryId,
                    userId: user.uid,
                    name: ingredient.name,
                    purchaseUnit: ingredient.purchaseUnit,
                    purchaseQuantity: sanitizeDecimalInput(event.target.value),
                    purchasePrice: ingredient.purchasePrice,
                    sourcePrice: ingredient.purchasePrice,
                    previousPrice: ingredient.purchasePrice
                  })
                }
              />
              <select
                className="field"
                defaultValue={ingredient.purchaseUnit}
                onBlur={(event) =>
                  upsertIngredientPrice({
                    bakeryId,
                    userId: user.uid,
                    name: ingredient.name,
                    purchaseUnit: event.target.value,
                    purchaseQuantity: ingredient.purchaseQuantity,
                    purchasePrice: ingredient.purchasePrice,
                    sourcePrice: ingredient.purchasePrice,
                    previousPrice: ingredient.purchasePrice
                  })
                }
              >
                {UNIT_OPTIONS.map((unit) => (
                  <option key={unit.value} value={unit.value}>
                    {unit.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete ingredient?"
        body="This will remove the saved price memory for this ingredient."
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteIngredient(deleteTarget.id);
          }
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
