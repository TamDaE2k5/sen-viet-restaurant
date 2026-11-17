package com.senviet.domain.repository;

import com.senviet.domain.entity.Recipe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RecipeRepository extends JpaRepository<Recipe, Long> {
    List<Recipe> findByItemId(Long itemId);
    Optional<Recipe> findFirstByItemId(Long itemId);
}
