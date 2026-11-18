package com.senviet.domain.repository;

import com.senviet.domain.entity.UniformItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UniformItemRepository extends JpaRepository<UniformItem, Long> {
}
