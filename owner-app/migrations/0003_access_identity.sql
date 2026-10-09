ALTER TABLE members ADD COLUMN access_subject TEXT;
ALTER TABLE members ADD COLUMN token_valid_after INTEGER NOT NULL DEFAULT 0;
CREATE UNIQUE INDEX member_access_subject ON members(access_subject) WHERE access_subject IS NOT NULL;
CREATE TABLE access_revocations (digest TEXT PRIMARY KEY, expires_at INTEGER NOT NULL);
CREATE INDEX access_revocations_expiry ON access_revocations(expires_at);
