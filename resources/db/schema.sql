CREATE TABLE Invoice (
id INTEGER PRIMARY KEY AUTOINCREMENT,
total INTEGER,
timestamp INTEGER,
refund Boolean
);
CREATE TABLE Item (
id INTEGER PRIMARY KEY AUTOINCREMENT,
item_name varchar(255),
item_type int,
plucode varchar(255),
price float,
cost float,
quantity int,
user_id int
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
, refund Boolean);
CREATE TABLE Item_type (
id INTEGER PRIMARY KEY AUTOINCREMENT,
type_name varchar(255)
);
CREATE TABLE User (
id INTEGER PRIMARY KEY AUTOINCREMENT,
account_name varchar(255),
password varchar(255),
user_role int
);
CREATE TABLE User_role (
id INTEGER PRIMARY KEY AUTOINCREMENT,
role_name varchar(255)
);
CREATE TABLE Version (
id INTEGER PRIMARY KEY AUTOINCREMENT,
timestamp varchar(255)
);
