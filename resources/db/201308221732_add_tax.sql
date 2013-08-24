CREATE TABLE Tax (
id INTEGER PRIMARY KEY AUTOINCREMENT,
name varchar(255),
rate float,
timestamp INTEGER
);

ALTER TABLE Invoice
ADD tax INTEGER;

update Version set timestamp="201308221732";
