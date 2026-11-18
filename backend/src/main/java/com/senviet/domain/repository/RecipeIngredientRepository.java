package com.senviet.domain.repository;

import com.senviet.domain.entity.RecipeIngredient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Kho dữ liệu Nguyên Liệu Cấu Thành Món Hoàn Chỉnh (Recipe Ingredients / BOM).
 */
@Repository
public interface RecipeIngredientRepository extends JpaRepository<RecipeIngredient, Long> {

    List<RecipeIngredient> findByRecipeId(Long recipeId);

    Optional<RecipeIngredient> findByRecipeIdAndIngredientItemId(Long recipeId, Long ingredientItemId);
}
