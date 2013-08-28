ALTER TABLE Item
ADD taxable Boolean;

ALTER TABLE Item_sold
ADD taxable Boolean;

update Item set taxable=1;
update Item_sold set taxable=1;

update Version set timestamp="201308281517";
