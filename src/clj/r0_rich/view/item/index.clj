(ns r0_rich.view.item.index
    (:use hiccup.core
          r0_rich.env
          r0_rich.view.template_pg
          hiccup.page)
    (:require [clojure.java.jdbc :as j]))

(defn index [] 
  (let [items (j/with-connection SQLDB
                (j/with-query-results rs ["select * from Item"] (doall rs)))]
       (pages (list [:a {:href "/items/new"} "添加商品"]
                    [:h2 "items"]
                    [:ul (for [item items]
                              [:li [:a {:href (str "/items/"(:id item))} (:item_name item)]])]))))
