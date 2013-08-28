BEGIN TRANSACTION;
ALTER TABLE Invoice RENAME TO tmp_Invoice;

CREATE TABLE Invoice (
id INTEGER PRIMARY KEY AUTOINCREMENT,
total INTEGER,
timestamp INTEGER,
refund Boolean
, tax float);

INSERT INTO Invoice (id, total, timestamp, refund, tax)
SELECT id, total, timestamp, refund, tax
FROM tmp_Invoice;

DROP TABLE tmp_Invoice;
COMMIT;

update Version set timestamp="201308281100";
