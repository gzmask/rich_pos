sqlite3 data.db < 201306021100_add_user_user_role_item_item_type.sql
sqlite3 data.db < 201307311148_add_invoice_and_sold_items.sql
sqlite3 data.db < 201308031310_move_refund_field_to_item_sold_add_version.sql
sqlite3 data.db < 201308221732_add_tax.sql
sqlite3 data.db < 201308281100_alter_invoice.sql
sqlite3 data.db < 201308281517_add_taxable.sql
sqlite3 data.db < 201309011009_add_picture_to_item.sql
sqlite3 data.db < 201311151257_two_tax_for_invoice.sql 
sqlite3 data.db .sch > schema.sql
