import { useEffect, useMemo, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { SectionCard } from '../components/ui/SectionCard';
import { EmptyState } from '../components/ui/EmptyState';
import { RecipePicker } from '../components/shared/RecipePicker';
import { Toast } from '../components/ui/Toast';
import { useAuth } from '../context/AuthContext';
import { useBakery } from '../context/BakeryContext';
import { subscribeToRecipeOptions } from '../services/recipeService';
import { saveSale, subscribeToSalesByDay } from '../services/salesService';
import { subscribeToRecentCostings } from '../services/costingService';
import { formatDateKey, formatFriendlyDate } from '../utils/date';
import { formatCurrency } from '../utils/money';
import { canEdit } from '../utils/permissions';
import { sanitizeDecimalInput, toNumber } from '../utils/numberInput';

export default function SalesPage() {
  const { user } = useAuth();
  const { bakeryId, role } = useBakery();
  const [recipes, setRecipes] = useState([]);
  const [recipeSearch, setRecipeSearch] = useState('');
  const [costings, setCostings] = useState([]);
  const [sales, setSales] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [draft, setDraft] = useState({
    id: '',
    recipeId: '',
    recipeName: '',
    recipeSource: 'recipe-app',
    quantity: '1',
    customer: '',
    paymentMethod: 'Cash',
    notes: ''
  });
  const [showOptional, setShowOptional] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);

  useEffect(() => {
    if (!bakeryId || !user?.uid) {
      return;
    }
    return subscribeToRecipeOptions({ bakeryId, userId: user.uid }, setRecipes);
  }, [bakeryId, user?.uid]);

  useEffect(() => subscribeToRecentCostings(bakeryId, setCostings), [bakeryId]);
  useEffect(() => subscribeToSalesByDay(bakeryId, selectedDate, setSales), [bakeryId, selectedDate]);

  const costingLookup = useMemo(
    () =>
      costings.reduce(
        (accumulator, item) => ({ ...accumulator, [`${item.recipeSource || 'recipe-app'}:${item.recipeId}`]: item }),
        {}
      ),
    [costings]
  );

  const recentRecipeOptions = useMemo(() => {
    const map = new Map(recipes.map((item) => [item.id, item]));
    return costings.map((item) => map.get(item.recipeId)).filter(Boolean).slice(0, 4);
  }, [costings, recipes]);

  const activeRecipe = recipes.find((item) => item.id === draft.recipeId);
  const activeCosting = draft.recipeId
    ? costingLookup[`${draft.recipeSource}:${draft.recipeId}`] || costingLookup[`recipe-app:${draft.recipeId}`]
    : null;
  const canModify = canEdit(role);
  const quantity = toNumber(draft.quantity);
  const revenue = Number(activeCosting?.totals?.sellingPrice || 0) * quantity;
  const cost = Number(activeCosting?.totals?.totalCost || 0) * quantity;
  const profit = revenue - cost;
  const dayTotals = sales.reduce(
    (accumulator, item) => ({
      revenue: accumulator.revenue + Number(item.revenue || 0),
      profit: accumulator.profit + Number(item.profit || 0)
    }),
    { revenue: 0, profit: 0 }
  );

  async function handleSave() {
    if (!canModify || !draft.recipeId || !activeRecipe || !activeCosting || !bakeryId || !user?.uid) {
      return;
    }

    const savedId = await saveSale({
      ...draft,
      bakeryId,
      createdBy: user.uid,
      dateKey: formatDateKey(selectedDate),
      cost,
      revenue,
      profit
    });

    if (!draft.id && savedId) {
      setDraft((current) => ({
        ...current,
        id: savedId
      }));
    }

    setToastOpen(true);
    window.setTimeout(() => setToastOpen(false), 1800);
  }

  return (
    <div className="page">
      <section className="glass-card hero-card">
        <div className="hero-kicker">
          <span className="hero-emoji" aria-hidden="true">{'\uD83D\uDCB8'}</span>
          <span className="tiny">Daily sales</span>
        </div>
        <div className="pill" style={{ width: 'fit-content', marginTop: 12 }}>
          <CalendarDays size={16} />
          {formatFriendlyDate(selectedDate)}
        </div>
        <h1 className="page-title" style={{ marginTop: 14 }}>Sales</h1>
        <p className="page-subtitle">Pick a recipe, add the quantity, and save the sale once the details look right.</p>
        <input
          className="field"
          type="date"
          value={formatDateKey(selectedDate)}
          style={{ marginTop: 16 }}
          onChange={(event) => setSelectedDate(new Date(`${event.target.value}T12:00:00`))}
        />
      </section>

      <SectionCard>
        <div className="stack-sm">
          <RecipePicker
            recipeId={draft.recipeId}
            recipes={recipes}
            manualRecipeId={draft.recipeId}
            searchValue={recipeSearch}
            onSearchChange={setRecipeSearch}
            recentRecipes={recentRecipeOptions}
            showManualInput={false}
            onChange={(recipeId) => {
              const recipe = recipes.find((item) => item.id === recipeId);
              setDraft((current) => ({
                ...current,
                recipeId,
                recipeName: recipe?.name || current.recipeName,
                recipeSource: recipe?.source || 'recipe-app'
              }));
            }}
            onManualChange={(recipeId) => setDraft((current) => ({ ...current, recipeId, recipeSource: 'recipe-app' }))}
            disabled={!canModify}
          />
          <label className="stack-sm">
            <span className="tiny">Quantity</span>
            <input
              className="field"
              type="text"
              inputMode="decimal"
              value={draft.quantity}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  quantity: sanitizeDecimalInput(event.target.value)
                }))
              }
              disabled={!canModify}
            />
          </label>
          <button type="button" className="button secondary" onClick={() => setShowOptional((value) => !value)}>
            {showOptional ? 'Hide optional details' : 'Add customer details'}
          </button>
          {showOptional ? (
            <div className="stack-sm">
              <input
                className="field"
                placeholder="Customer"
                value={draft.customer}
                onChange={(event) => setDraft((current) => ({ ...current, customer: event.target.value }))}
                disabled={!canModify}
              />
              <select
                className="field"
                value={draft.paymentMethod}
                onChange={(event) => setDraft((current) => ({ ...current, paymentMethod: event.target.value }))}
                disabled={!canModify}
              >
                <option>Cash</option>
                <option>UPI</option>
                <option>Bank transfer</option>
              </select>
              <textarea
                className="field"
                rows="3"
                placeholder="Notes"
                value={draft.notes}
                onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
                disabled={!canModify}
              />
            </div>
          ) : null}
          {canModify && draft.recipeId && activeRecipe ? (
            <button type="button" className="button sales-save-button" onClick={handleSave}>
              Save sale
            </button>
          ) : null}
        </div>
      </SectionCard>

      <div className="metrics">
        <div className="glass-card metric">
          <div className="metric-label">Revenue</div>
          <div className="metric-value">{formatCurrency(revenue)}</div>
        </div>
        <div className="glass-card metric">
          <div className="metric-label">Profit</div>
          <div className="metric-value">{formatCurrency(profit)}</div>
        </div>
      </div>

      <SectionCard>
        <div className="page-header">
          <div>
            <div className="section-kicker">Daily view</div>
            <strong className="section-title">Today&apos;s sales</strong>
            <p className="page-subtitle">Everything saved for {formatFriendlyDate(selectedDate)}.</p>
          </div>
        </div>
        <div className="metrics" style={{ marginTop: 14 }}>
          <div className="glass-card metric">
            <div className="metric-label">Total revenue</div>
            <div className="metric-value">{formatCurrency(dayTotals.revenue)}</div>
          </div>
          <div className="glass-card metric">
            <div className="metric-label">Total profit</div>
            <div className="metric-value">{formatCurrency(dayTotals.profit)}</div>
          </div>
        </div>
        <div className="stack-sm" style={{ marginTop: 14 }}>
          {sales.length ? (
            sales.map((sale) => (
              <div key={sale.id} className="glass-card surface-card">
                <div className="list-item" style={{ padding: 0 }}>
                  <div>
                    <strong>{sale.recipeName || sale.recipeId}</strong>
                    <div className="tiny">
                      {sale.recipeSource === 'costing-app' ? 'Custom' : 'Menu'} · Qty {sale.quantity}
                      {sale.customer ? ` · ${sale.customer}` : ''}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <strong>{formatCurrency(sale.revenue)}</strong>
                    <div className="tiny">{formatCurrency(sale.profit)} profit</div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <span className="muted">Sales added today will appear here automatically.</span>
          )}
        </div>
      </SectionCard>

      {!costings.length ? (
        <EmptyState
          title="Save a costing first"
          body="Sales entries use your saved recipe pricing, so start from Home and price the recipe once."
        />
      ) : null}
      <Toast open={toastOpen} message="Saved successfully" />
    </div>
  );
}
