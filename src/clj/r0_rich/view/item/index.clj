;; list all items
(ns r0_rich.view.item.index
    (:use hiccup.core
          r0_rich.model
          hiccup.page)
    (:require [clojure.java.jdbc :as j]
              [clojure.string :as s]))

(def Index_Items
  (j/with-connection sqlite-db
    (j/with-query-results rs ["select * from Item"] (doall rs))))

(keys (last Index_Items))
(type (first Index_Items))
(:item_name (first Index_Items))
(seq Index_Items)

(defn show [id]
)
