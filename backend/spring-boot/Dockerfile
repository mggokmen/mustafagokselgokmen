# syntax=docker/dockerfile:1

# Build context is the repository root, because the build reads contract/openapi.yaml:
#   docker build -f backend/spring-boot/Dockerfile .

FROM eclipse-temurin:25-jdk AS build
WORKDIR /workspace/backend/spring-boot

# Resolve dependencies in their own layer, so it's cached until pom.xml changes.
COPY backend/spring-boot/mvnw backend/spring-boot/pom.xml ./
COPY backend/spring-boot/.mvn .mvn
RUN chmod +x mvnw
RUN --mount=type=cache,target=/root/.m2 ./mvnw -B -q dependency:go-offline

COPY contract/openapi.yaml /workspace/contract/openapi.yaml
COPY backend/spring-boot/src src

# Formatting and tests already run in CI before the image is built (docs/devops.md).
RUN --mount=type=cache,target=/root/.m2 \
    ./mvnw -B -q -DskipTests -Dspotless.check.skip=true package \
    && cp target/api-*.jar application.jar \
    && java -Djarmode=tools -jar application.jar extract --layers --destination extracted


FROM eclipse-temurin:25-jre

# curl is only used by the health check.
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system app \
    && useradd --system --gid app --no-create-home app

WORKDIR /app

# Copy the least frequently changing layers first.
COPY --from=build /workspace/backend/spring-boot/extracted/dependencies/ ./
COPY --from=build /workspace/backend/spring-boot/extracted/spring-boot-loader/ ./
COPY --from=build /workspace/backend/spring-boot/extracted/snapshot-dependencies/ ./
COPY --from=build /workspace/backend/spring-boot/extracted/application/ ./

USER app
EXPOSE 8080

# Containers log JSON (Elastic Common Schema); local runs keep plain text (docs/observability.md).
ENV LOGGING_STRUCTURED_FORMAT_CONSOLE=ecs

HEALTHCHECK --interval=10s --timeout=3s --start-period=60s --retries=5 \
    CMD curl -fsS http://localhost:8080/actuator/health || exit 1

ENTRYPOINT ["java", "-jar", "application.jar"]
