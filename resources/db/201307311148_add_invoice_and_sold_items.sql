CREATE TABLE Invoice (
id INTEGER PRIMARY KEY AUTOINCREMENT,
total INTEGER,
timestamp INTEGER,
refund Boolean
);

CREATE TABLE Item_sold (
id INTEGER PRIMARY KEY AUTOINCREMENT,
item_name varchar(255),
item_type int,
plucode varchar(255),
price float,
cost float,
user_id int,
invoice_id int
);
