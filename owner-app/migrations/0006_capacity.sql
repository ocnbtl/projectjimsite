-- Keep initial enrollment bounded; disable departed crew before adding replacements.
CREATE TRIGGER member_capacity_insert BEFORE INSERT ON members WHEN NEW.active=1 BEGIN SELECT RAISE(ABORT,'member_capacity') WHERE (SELECT COUNT(*) FROM members WHERE active=1)>=10; END;
CREATE TRIGGER member_capacity_restore BEFORE UPDATE OF active ON members WHEN OLD.active=0 AND NEW.active=1 BEGIN SELECT RAISE(ABORT,'member_capacity') WHERE (SELECT COUNT(*) FROM members WHERE active=1)>=10; END;
CREATE INDEX receipt_upload_expiry ON receipt_uploads(expires_at);
