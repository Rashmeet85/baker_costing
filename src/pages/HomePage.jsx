import { useEffect, useMemo, useState } from 'react';
import { ChevronRight, Search } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBakery } from '../context/BakeryContext';
import { subscribeToRecipeOptions } from '../services/recipeService';

export default function HomePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { bakery, bakeryId } = useBakery();
  const [recipes, setRecipes] = useState([]);
  const [searchValue, setSearchValue] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!user?.uid) {
      return;
    }

    return subscribeToRecipeOptions({ bakeryId, userId: user.uid }, setRecipes);
  }, [bakeryId, user?.uid]);

  useEffect(() => {
    const deepLinkedRecipeId = searchParams.get('recipeId');
    if (deepLinkedRecipeId) {
      navigate(`/recipe/${deepLinkedRecipeId}?source=recipe-app`, { replace: true });
    }
  }, [navigate, searchParams]);

  const filteredRecipes = useMemo(() => {
    const normalized = searchValue.trim().toLowerCase();

    return recipes.filter((recipe) => {
      const matchesSearch =
        !normalized ||
        recipe.name.toLowerCase().includes(normalized) ||
        recipe.id.toLowerCase().includes(normalized);

      const matchesFilter =
        filter === 'all' ||
        (filter === 'menu' && recipe.source !== 'costing-app') ||
        (filter === 'custom' && recipe.source === 'costing-app');

      return matchesSearch && matchesFilter;
    });
  }, [filter, recipes, searchValue]);

  return (
    <div className="page">
      <section className="glass-card hero-card home-hero">
        <div className="hero-kicker">
          <span className="hero-emoji" aria-hidden="true">{'\uD83C\uDF70'}</span>
          <span className="tiny">Bakery</span>
        </div>
        <h1 className="page-title" style={{ marginTop: 16 }}>{bakery?.name || "Kaur's Cakery"}</h1>
        <p className="page-subtitle">All your recipes, pricing, and business flow in one sweet little place.</p>

        <div className="search-shell glass-card home-search">
          <Search size={18} color="#8a7f8e" />
          <input
            className="search-input"
            placeholder="Search recipes..."
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
          />
        </div>

        <div className="filter-row">
          {[
            { id: 'all', label: 'All', emoji: '✨' },
            { id: 'menu', label: 'Menu', emoji: '🍞' },
            { id: 'custom', label: 'Custom', emoji: '🧁' }
          ].map((option) => (
            <button
              key={option.id}
              type="button"
              className={`filter-pill ${filter === option.id ? 'active' : ''}`}
              onClick={() => setFilter(option.id)}
            >
              <span aria-hidden="true">{option.emoji}</span>
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <div className="recipe-grid">
        {filteredRecipes.map((recipe) => (
          <button
            key={recipe.id}
            type="button"
            className="recipe-card glass-card"
            onClick={() => navigate(`/recipe/${recipe.id}?source=${recipe.source || 'recipe-app'}`)}
          >
            <div className="recipe-card-shell">
              <div className="recipe-card-icon" aria-hidden="true">
                {recipe.source === 'costing-app' ? '\uD83E\uDDC1' : '\uD83C\uDF70'}
              </div>
              <div className="recipe-card-copy">
                <div className="recipe-card-top">
                  <span className={`source-badge ${recipe.source === 'costing-app' ? 'custom' : ''}`}>
                    {recipe.source === 'costing-app' ? 'Custom' : 'Menu'}
                  </span>
                  <ChevronRight size={18} className="recipe-chevron" />
                </div>
                <strong className="recipe-card-title">{recipe.name}</strong>
                <div className="recipe-card-meta">
                  <span className="tiny">
                    Yield {recipe.yieldQuantity} {recipe.yieldUnit}
                  </span>
                  <span className="tiny">
                    {recipe.source === 'costing-app' ? 'Made here' : 'From recipe book'}
                  </span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
