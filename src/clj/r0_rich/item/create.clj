(ns r0_rich.item.create
    (:use hiccup.core
          hiccup.page
          r0_rich.env
          r0_rich.pages.template_pg)
    (:require [clojure.java.jdbc :as j]))

(defn new [session]
  (if (:login session)
    (pages [:form.span10 {:action "/items/create" :method "post"}
           [:div.row-fluid
            [:lable.span2.offset1 "item_name:"]
            [:input.span3 {:name "item_name" :type "text"}]]
           [:div.row-fluid
            [:lable.span2.offset1 "item_type:"]
            [:input.span3 {:name "item_type" :type "text"}]]
           [:div.row-fluid
            [:lable.span2.offset1 "plucode:"]
            [:input.span3 {:name "plucode" :type "text"}]]
           [:div.row-fluid
            [:lable.span2.offset1 "price:"]
            [:input.span3 {:name "price" :type "text"}]]
            [:input {:value (:user_id session)  :name "user_id" :type "hidden"}]
           [:div.row-fluid
            [:input.span1.offset1 {:type "submit" :value "添加"}]]])
    (pages [:a {:href "/login"} "請登錄>>"])))


(defn create [params session]
  (if (:login session)
    (do (j/insert! SQLDB :Item
            {:item_name (:item_name params)
             :item_type (:item_type params)
             :plucode (:plucode params)
             :price (:price params)
             :user_id (:user_id params)})
        (pages [:div "添加成功."]))
    (pages [:a {:href "/login"} "請登錄>>"])))
