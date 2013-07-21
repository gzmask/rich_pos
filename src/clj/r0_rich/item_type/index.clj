(ns r0_rich.item_type.index
    (:use hiccup.core
          r0_rich.env
          r0_rich.pages.template_pg
          hiccup.page)
    (:require [clojure.java.jdbc :as j]))

(defn index []
  (let [items (j/with-connection SQLDB
                (j/with-query-results rs ["select * from Item_type"] (doall rs)))]
       (pages (list [:a {:href "/items/new"} "添加商品类型"]
                    [:h2 "items"]
                    (for [item items]
                      [:div.row-fluid [:a.span12 {:href (str "/items/"(:id item))}
                                       (list [:div.span2 (:item_name item)]
                                             [:div.span1 (:price item)]
                                             [:div.span2 (:quantity item)])]])))))
