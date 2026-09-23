package com.mustafagokselgokmen.api.common.outbox;

import jakarta.validation.constraints.Min;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/** How the publisher drains the outbox (docs/architecture.md#events). */
@Validated
@ConfigurationProperties("app.outbox")
public record OutboxProperties(boolean enabled, @Min(1) int batchSize) {}
