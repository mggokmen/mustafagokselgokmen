CREATE TABLE users (
    id             uuid          NOT NULL,
    google_subject varchar(255)  NOT NULL,
    email          varchar(254)  NOT NULL,
    name           varchar(200)  NOT NULL,
    avatar_url     varchar(2048),
    role           varchar(20)   NOT NULL DEFAULT 'USER',
    created_at     timestamptz   NOT NULL,
    updated_at     timestamptz   NOT NULL,
    CONSTRAINT pk_users PRIMARY KEY (id),
    CONSTRAINT uq_users_google_subject UNIQUE (google_subject),
    CONSTRAINT ck_users_role CHECK (role IN ('USER', 'ADMIN'))
);

-- email is intentionally not unique: identity is the Google subject (ADR-006).
