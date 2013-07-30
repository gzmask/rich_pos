(ns r0_rich.item.update
    (:use hiccup.core
          hiccup.page
          r0_rich.env
          r0_rich.pages.template_pg)
    (:require [clojure.java.jdbc.sql :as s]
              [clojure.java.jdbc :as j]))

(defn single_update [id session]
  (let [item (first (j/with-connection SQLDB
               (j/with-query-results rs [(str "select * from Item where id = '" id "';")] (doall rs))))
        types (j/with-connection SQLDB
               (j/with-query-results rs [(str "select * from Item_type")] (doall rs)))]
  (if (:login session)
    (pages [:form.span10 {:action (str "/items/" id "/single_change") :method "post"}
           [:div.row-fluid
            [:lable.span2.offset1 "商品名称:"]
            [:input.span3 {:name "item_name" :type "text" :value (:item_name item)}]]
           [:div.row-fluid
            [:lable.span2.offset1 "商品类型:"]
            [:select.span3 {:name "item_type"}
             (for [type types]
               [:option {:value (:id type)} (:type_name type)])]]
           [:div.row-fluid
            [:lable.span2.offset1 "PLU代码:"]
            [:input.span3 {:name "plucode" :type "text" :value (:plucode item)}]]
           [:div.row-fluid
            [:lable.span2.offset1 "价格:"]
            [:input.span3 {:name "price" :type "text" :value (:price item)}]]
           [:div.row-fluid
            [:lable.span2.offset1 "成本:"]
            [:input.span3 {:name "cost" :type "text" :value (:cost item)}]]
            [:input {:value (:user_id session)  :name "user_id" :type "hidden"}]
           [:div.row-fluid
            [:input.span1.offset1 {:type "submit" :value "修改"}]]])
    (pages [:a {:href "/login"} "請登錄>>"]))))

(defn single_change [params session]
  (if (:login session)
    (do 
      (j/update! SQLDB :Item params (s/where {:id (:id params)}))
      (pages [:h2 "修改成功."]))
    (pages [:a {:href "/login"} "請登錄>>"])))

(defn update [id session]
  (let [item (first (j/with-connection SQLDB
               (j/with-query-results rs [(str "select * from Item where id = '" id "';")] (doall rs))))
        types (j/with-connection SQLDB
               (j/with-query-results rs [(str "select * from Item_type")] (doall rs)))]
  (if (:login session)
    (pages [:form.span10 {:action (str "/items/" id "/change") :method "post"}
           [:div.row-fluid
            [:lable.span2.offset1 "商品名称:"]
            [:input.span3 {:name "item_name" :type "text" :value (:item_name item)}]]
           [:div.row-fluid
            [:lable.span2.offset1 "商品类型:"]
            [:select.span3 {:name "item_type"}
             (for [type types]
               [:option {:value (:id type)} (:type_name type)])]]
           [:div.row-fluid
            [:lable.span2.offset1 "PLU代码:"]
            [:input.span3 {:name "plucode" :type "text" :value (:plucode item) :readonly "readonly"}]]
           [:div.row-fluid
            [:lable.span2.offset1 "价格:"]
            [:input.span3 {:name "price" :type "text" :value (:price item)}]]
           [:div.row-fluid
            [:lable.span2.offset1 "成本:"]
            [:input.span3 {:name "cost" :type "text" :value (:cost item)}]]
            [:input {:value (:user_id session)  :name "user_id" :type "hidden"}]
           [:div.row-fluid
            [:input.span1.offset1 {:type "submit" :value "修改"}]]])
    (pages [:a {:href "/login"} "請登錄>>"]))))


(defn change [params session]
  (let [items (j/with-connection SQLDB 
                (j/with-query-results rs [(str "select * from Item where plucode = '" (:plucode params) "';")] (doall rs)))]
  (if (:login session)
    (do 
      (doseq [item items] 
        (j/update! SQLDB :Item (assoc params :id (:id item)) (s/where {:id (:id item)}))) 
      (pages [:h2 "修改成功."]))
    (pages [:a {:href "/login"} "請登錄>>"]))))
