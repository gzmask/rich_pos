BEGIN TRANSACTION;
ALTER TABLE Invoice RENAME TO tmp_Invoice;

CREATE TABLE Invoice (
id INTEGER PRIMARY KEY AUTOINCREMENT,
name varchar(255),
tel varchar(255),
address varchar(255),
subtotal float,
total float,
timestamp INTEGER,
refund Boolean
, tax float, tax2 float);

INSERT INTO Invoice (id, total, timestamp, refund, tax)
SELECT id, total, timestamp, refund, tax
FROM tmp_Invoice;

DROP TABLE tmp_Invoice;
COMMIT;


update Version set timestamp="201311151257";
