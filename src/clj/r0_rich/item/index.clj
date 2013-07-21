(ns r0_rich.item.index
    (:use hiccup.core
          r0_rich.env
          r0_rich.pages.template_pg
          hiccup.page)
    (:require [clojure.java.jdbc :as j]))

(defn index []
  (let [items (j/with-connection SQLDB
                (j/with-query-results rs ["select * from Item"] (doall rs)))]
       (pages (list [:a {:href "/items/new"} "添加商品"]
                    [:h2 "items"]
                    (for [item items]
                      [:div.row-fluid
                       [:a.span2 {:href (str "/items/"(:id item))} (:item_name item)]
                       [:div.span1 (:price item)]
                       [:div.span1 (:quantity item)]
                       [:a.span2 {:href (str "/items/"(:id item)"/update")} "修改"]
                       [:a.span2 {:href (str "/items/"(:id item)"/remove")} "删除"]])))))
