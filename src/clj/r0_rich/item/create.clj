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
            [:lable.span2.offset1 "商品名称:"]
            [:input.span3 {:name "item_name" :type "text"}]]
           [:div.row-fluid
            [:lable.span2.offset1 "商品类型:"]
            [:input.span3 {:name "item_type" :type "text"}]]
           [:div.row-fluid
            [:lable.span2.offset1 "PLU代码:"]
            [:input.span3 {:name "plucode" :type "text"}]]
           [:div.row-fluid
            [:lable.span2.offset1 "价格:"]
            [:input.span3 {:name "price" :type "text"}]]
           [:div.row-fluid
            [:lable.span2.offset1 "成本:"]
            [:input.span3 {:name "cost" :type "text"}]]
           [:div.row-fluid
            [:lable.span2.offset1 "库存:"]
            [:input.span3 {:name "quantity" :type "text"}]]
            [:input {:value (:user_id session)  :name "user_id" :type "hidden"}]
           [:div.row-fluid
            [:input.span1.offset1 {:type "submit" :value "添加"}]]])
    (pages [:a {:href "/login"} "請登錄>>"])))


(defn create [params session]
  (if (:login session)
    (do (doseq [x (range (Integer. (:quantity params)))]
          (j/insert! SQLDB :Item
            {:item_name (:item_name params)
             :item_type (:item_type params)
             :plucode (:plucode params)
             :price (if-not (:price params) (:price params) 0)
             :cost (if-not (:cost params) (:cost params) 0)
             :user_id (:user_id params)}))
        (pages [:div "添加成功."]))
    (pages [:a {:href "/login"} "請登錄>>"])))
