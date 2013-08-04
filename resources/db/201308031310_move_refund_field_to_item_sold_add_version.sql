CREATE TABLE Version (
id INTEGER PRIMARY KEY AUTOINCREMENT,
timestamp varchar(255)
);

ALTER TABLE Item_sold
ADD refund Boolean;

insert into Version (timestamp) values ("201308031310");
