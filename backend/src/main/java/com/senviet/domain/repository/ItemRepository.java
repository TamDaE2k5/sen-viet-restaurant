package com.senviet.domain.repository;

import com.senviet.domain.entity.Item;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ItemRepository extends JpaRepository<Item, Long> {

    Optional<Item> findByBarcode(String barcode);

    Optional<Item> findByItemCode(String itemCode);

    @Query("SELECT i FROM Item i WHERE " +
           "LOWER(i.itemName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(i.itemCode) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "i.barcode = :query")
    List<Item> searchItems(@Param("query") String query);

    List<Item> findByIsBuffetLineTrue();
}
