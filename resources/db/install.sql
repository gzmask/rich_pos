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

CREATE TABLE Item (
id INTEGER PRIMARY KEY AUTOINCREMENT,
item_name varchar(255),
item_type int,
plucode varchar(255),
price float,
cost float,
user_id int
);


CREATE TABLE Item_type (
id INTEGER PRIMARY KEY AUTOINCREMENT,
type_name varchar(255)
);

insert into User_role (id, role_name) values (1, "developer");
insert into User_role (id, role_name) values (2, "manager");
insert into User_role (id, role_name) values (3, "customer");

insert into User (id, account_name, password, user_role) values (1, "gzmask", "121212", 1);
insert into User (id, account_name, password, user_role) values (2, "daisy", "123456", 2);
insert into User (id, account_name, password, user_role) values (3, "tim", "123456", 2);

insert into Item_type (type_name) values ("iphone case");

insert into Item (item_name, price, cost) values ("iphone case 1", 15.00, 1.00);
insert into Item (item_name, price, cost) values ("iphone case 2", 25.00, 1.00);

