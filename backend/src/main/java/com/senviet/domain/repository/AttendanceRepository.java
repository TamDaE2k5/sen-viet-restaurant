package com.senviet.domain.repository;

import com.senviet.domain.entity.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    List<Attendance> findByBranchIdAndAttendanceDateOrderByCheckInTimeDesc(Long branchId, LocalDate attendanceDate);
    List<Attendance> findByUserIdOrderByAttendanceDateDesc(Long userId);
    Optional<Attendance> findFirstByUserIdAndAttendanceDateOrderByCheckInTimeDesc(Long userId, LocalDate attendanceDate);
    List<Attendance> findByUserIdAndAttendanceDateGreaterThanEqual(Long userId, LocalDate fromDate);
}
