# ==============================================================================
# Multi-stage Dockerfile cho Backend Spring Boot 3.x (Java 17 LTS)
# ==============================================================================

# Stage 1: Build file JAR
FROM maven:3.9-eclipse-temurin-17-alpine AS builder
WORKDIR /workspace

COPY pom.xml .
COPY src ./src
COPY target ./target
RUN if [ ! -f target/restaurant-backend-1.0.0-SNAPSHOT.jar ]; then mvn clean package -DskipTests -B; fi

# Stage 2: Runtime image siêu nhẹ bằng JRE 17
FROM eclipse-temurin:17-jre-alpine AS runner
WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=builder /workspace/target/restaurant-backend-1.0.0-SNAPSHOT.jar app.jar
RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 8080

ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
