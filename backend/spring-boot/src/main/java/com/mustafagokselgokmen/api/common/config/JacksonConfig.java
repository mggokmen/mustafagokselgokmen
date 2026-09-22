package com.mustafagokselgokmen.api.common.config;

import org.springframework.boot.jackson.autoconfigure.JsonMapperBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import tools.jackson.databind.MapperFeature;
import tools.jackson.databind.cfg.CoercionAction;
import tools.jackson.databind.cfg.CoercionInputShape;
import tools.jackson.databind.type.LogicalType;

@Configuration(proxyBeanMethods = false)
class JacksonConfig {

  /**
   * A JSON value of the wrong type is rejected with 400 instead of being converted, so the API
   * accepts exactly what the contract describes. {@code ALLOW_COERCION_OF_SCALARS} covers numbers
   * and booleans; strings need their own rule ({@code false} would otherwise become {@code
   * "false"}).
   */
  @Bean
  JsonMapperBuilderCustomizer strictTypes() {
    return builder ->
        builder
            .disable(MapperFeature.ALLOW_COERCION_OF_SCALARS)
            .withCoercionConfig(
                LogicalType.Textual,
                config ->
                    config
                        .setCoercion(CoercionInputShape.Boolean, CoercionAction.Fail)
                        .setCoercion(CoercionInputShape.Integer, CoercionAction.Fail)
                        .setCoercion(CoercionInputShape.Float, CoercionAction.Fail));
  }
}
