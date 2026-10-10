package com.mustafagokselgokmen.api.identity;

/** The claims of a verified Google ID token that the application uses. */
public record GoogleIdentity(String subject, String email, String name, String pictureUrl) {}
