CREATE TABLE contact_messages (
    id         uuid          NOT NULL,
    user_id    uuid          NOT NULL,
    subject    varchar(150)  NOT NULL,
    message    varchar(5000) NOT NULL,
    status     varchar(20)   NOT NULL DEFAULT 'NEW',
    version    bigint        NOT NULL DEFAULT 0,
    created_at timestamptz   NOT NULL,
    updated_at timestamptz   NOT NULL,
    CONSTRAINT pk_contact_messages PRIMARY KEY (id),
    CONSTRAINT fk_contact_messages_user_id
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT ck_contact_messages_status CHECK (status IN ('NEW', 'IN_PROGRESS', 'RESOLVED'))
);

-- A user's own messages, newest first. Also covers the foreign key.
CREATE INDEX ix_contact_messages_user_id_created_at ON contact_messages (user_id, created_at DESC);

-- Admin list filtered by status, newest first.
CREATE INDEX ix_contact_messages_status_created_at ON contact_messages (status, created_at DESC);
