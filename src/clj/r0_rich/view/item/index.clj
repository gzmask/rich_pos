;; list all items
(ns r0_rich.view.item.index
    (:use hiccup.core
          r0_rich.env
          r0_rich.view.template_pg
          hiccup.page)
    (:require [clojure.java.jdbc :as j]))

;(seq (first (j/with-connection SQLDB (j/with-query-results rs [(str "select * from Item")] (doall rs)))))
;(keys (last Index_Items))
;(type (first Index_Items))
;(:item_name (first Index_Items))
;(seq Index_Items)

(defn show [] 
  (let [items (j/with-connection SQLDB
                (j/with-query-results rs ["select * from Item"] (doall rs)))]
       (pages (list [:h2 "items"]
                    [:ul (for [item items]
                              [:li [:a {:href (str "/items/"(:id item))} (:item_name item)]])]))))
