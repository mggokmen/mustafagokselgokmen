package com.mustafagokselgokmen.api.common.outbox;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/** How the publisher drains the outbox and where events go (ADR-008, ADR-009). */
@Validated
@ConfigurationProperties("app.outbox")
public record OutboxProperties(
    boolean enabled,
    @Min(1) int batchSize,
    @Pattern(regexp = "log|kafka", message = "OUTBOX_TARGET must be 'log' or 'kafka'")
        String target,
    @NotBlank String topicPrefix) {}
