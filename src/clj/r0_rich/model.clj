(ns r0_rich.model
  (:require [clojure.java.jdbc :as j]))

(def sqlite-db {:classname "org.sqlite.JDBC"
                :subprotocol "sqlite"
                :subname "resources/db/data.db"})

;(defn create-db []
;  (try (j/with-connection sqlite-db
;         (j/create-table :users
;                         [:id :int]
;                         [:name :text]
;                         [:password :text]))
;       (catch Exception e (println e))))
;(create-db)
