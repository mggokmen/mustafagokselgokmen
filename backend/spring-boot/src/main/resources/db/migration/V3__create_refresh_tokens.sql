CREATE TABLE refresh_tokens (
    id         uuid        NOT NULL,
    user_id    uuid        NOT NULL,
    token_hash char(64)    NOT NULL,
    family_id  uuid        NOT NULL,
    expires_at timestamptz NOT NULL,
    revoked_at timestamptz,
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL,
    CONSTRAINT pk_refresh_tokens PRIMARY KEY (id),
    CONSTRAINT uq_refresh_tokens_token_hash UNIQUE (token_hash),
    -- Refresh tokens cannot exist without their user.
    CONSTRAINT fk_refresh_tokens_user_id
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX ix_refresh_tokens_user_id ON refresh_tokens (user_id);

-- Revoking a whole token family on logout or on reuse of a rotated token.
CREATE INDEX ix_refresh_tokens_family_id ON refresh_tokens (family_id);
