(ns r0_rich.model
  (:require [korma.db :as db]
            [korma.core :as db.core]))

(def sql (db/sqlite3 {:db "resources/db/data.db"}))
(db/defdb korma-db sql)
(declare User User_role Item Item_type)
(db.core/defentity User
  (db.core/pk :id) 
  (db.core/table :User)
  (db.core/database korma-db)
  (db.core/entity-fields :account_name :password :user_role)
  (db.core/belongs-to User_role)
  (db.core/has-many Item))
(db.core/defentity User_role
  (db.core/pk :id)
  (db.core/table :User_role)
  (db.core/has-many User)
  (db.core/entity-fields :role_name))
(db.core/defentity Item
  (db.core/belongs-to Item_type)
  (db.core/belongs-to User))
(db.core/defentity Item_type
  (db.core/has-many Item))

