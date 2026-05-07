'use client';

import { useEffect, useState } from 'react';
import { RECIPES, type Recipe } from '@/lib/recipes';
import { useRecipeFavorites } from '@/lib/recipeFavorites';
import RecipeDetailModal from './RecipeDetailModal';

/**
 * 어디서든 'nemoa:open-recipe' 이벤트로 레시피 상세를 띄우는 전역 모달.
 * detail에는 { recipeId: string }를 담아 dispatch.
 * CommandPalette 외에도 dailyMessage·알림 등에서 활용 가능.
 */
export default function GlobalRecipeModal() {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const { isFavorite, toggle } = useRecipeFavorites();

  useEffect(() => {
    function onOpen(e: Event) {
      const detail = (e as CustomEvent<{ recipeId: string }>).detail;
      const r = RECIPES.find((x) => x.id === detail?.recipeId);
      if (r) setRecipe(r);
    }
    window.addEventListener('nemoa:open-recipe', onOpen);
    return () => window.removeEventListener('nemoa:open-recipe', onOpen);
  }, []);

  if (!recipe) return null;
  return (
    <RecipeDetailModal
      recipe={recipe}
      matchedItems={[]}
      isFavorite={isFavorite(recipe.id)}
      onToggleFavorite={() => toggle(recipe.id)}
      onClose={() => setRecipe(null)}
    />
  );
}
