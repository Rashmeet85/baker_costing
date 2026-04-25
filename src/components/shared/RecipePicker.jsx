export function RecipePicker({
  recipeId,
  recipes,
  onChange,
  onManualChange,
  manualRecipeId,
  disabled,
  searchValue,
  onSearchChange,
  recentRecipes = [],
  showManualInput = true
}) {
  const filteredRecipes = recipes.filter((recipe) =>
    !searchValue
      ? true
      : recipe.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        recipe.id.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <div className="stack-sm">
      {onSearchChange ? (
        <input
          className="field"
          placeholder="Search recipe"
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          disabled={disabled}
        />
      ) : null}
      {recentRecipes.length ? (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {recentRecipes.map((recipe) => (
            <button
              key={recipe.id}
              type="button"
              className="pill"
              style={{ border: 0 }}
              onClick={() => onChange(recipe.id)}
              disabled={disabled}
            >
              {recipe.name}
            </button>
          ))}
        </div>
      ) : null}
      <select className="field" value={recipeId || ''} onChange={(event) => onChange(event.target.value)} disabled={disabled}>
        <option value="">Choose a recipe</option>
        {filteredRecipes.map((recipe) => (
          <option key={recipe.id} value={recipe.id}>
            [{recipe.source === 'costing-app' ? 'Custom' : 'Menu'}] {recipe.name}
          </option>
        ))}
      </select>
      {showManualInput ? (
        <input
          className="field"
          placeholder="Or paste recipe ID from your recipe app"
          value={manualRecipeId}
          onChange={(event) => onManualChange(event.target.value)}
          disabled={disabled}
        />
      ) : null}
    </div>
  );
}
