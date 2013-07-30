(ns r0_rich.item.index
    (:use hiccup.core
          r0_rich.env
          r0_rich.pages.template_pg
          hiccup.page)
    (:require [clojure.java.jdbc :as j]
              [clojure.java.jdbc.sql :as s]))

(defn index [session]
  (let [items (j/with-connection SQLDB
                (j/with-query-results rs ["select * from Item GROUP BY plucode"] (doall rs)))]
    (if (:login session)
       (pages (list [:a {:href "/items/new"} "添加商品"]
                    [:h2 "items"]
                    (for [item items]
                      [:div.row-fluid
                       [:a.span3 {:href (str "/items/"(:id item))} (:item_name item)]
                       [:div.span1 (:price item)]
                       [:div.span1 (:quantity item)]
                       [:a.span2 {:href (str "/items/"(:id item)"/update")} "修改所有"]
                       [:a.span2 {:href (str "/items/"(:plucode item)"/remove")} "删除所有"]])))
       (pages (list [:h2 "items"]
                    (for [item items]
                      [:div.row-fluid
                       [:a.span3 {:href (str "/items/"(:id item))} (:item_name item)]
                       [:div.span1 (:price item)]
                       [:div.span1 (:quantity item)]]))))))

