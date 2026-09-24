# syntax=docker/dockerfile:1

# Build context is the repository root, so one .dockerignore covers every image:
#   docker build -f backend/notification-service/Dockerfile .

FROM eclipse-temurin:21-jdk AS build
WORKDIR /workspace/backend/notification-service

# Resolve dependencies in their own layer, so it's cached until pom.xml changes.
COPY backend/notification-service/mvnw backend/notification-service/pom.xml ./
COPY backend/notification-service/.mvn .mvn
RUN chmod +x mvnw
RUN --mount=type=cache,target=/root/.m2 ./mvnw -B -q dependency:go-offline

COPY backend/notification-service/src src

# Formatting and tests already run in CI before the image is built (docs/devops.md).
RUN --mount=type=cache,target=/root/.m2 \
    ./mvnw -B -q -DskipTests -Dspotless.check.skip=true package \
    && cp target/notification-*.jar application.jar \
    && java -Djarmode=tools -jar application.jar extract --layers --destination extracted


FROM eclipse-temurin:21-jre

# curl is only used by the health check.
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system app \
    && useradd --system --gid app --no-create-home app

WORKDIR /app

# Copy the least frequently changing layers first.
COPY --from=build /workspace/backend/notification-service/extracted/dependencies/ ./
COPY --from=build /workspace/backend/notification-service/extracted/spring-boot-loader/ ./
COPY --from=build /workspace/backend/notification-service/extracted/snapshot-dependencies/ ./
COPY --from=build /workspace/backend/notification-service/extracted/application/ ./

USER app
EXPOSE 8081

# Containers log JSON (Elastic Common Schema); local runs keep plain text (docs/observability.md).
ENV LOGGING_STRUCTURED_FORMAT_CONSOLE=ecs

HEALTHCHECK --interval=10s --timeout=3s --start-period=60s --retries=5 \
    CMD curl -fsS http://localhost:8081/actuator/health || exit 1

ENTRYPOINT ["java", "-jar", "application.jar"]
