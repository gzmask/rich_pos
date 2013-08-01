(ns r0_rich.invoice.crud
    (:use hiccup.core
          r0_rich.env
          r0_rich.pages.template_pg
          hiccup.page)
    (:require [clojure.java.jdbc.sql :as s] 
              [clojure.java.jdbc :as j]))

(defn index [session]
  (let [item_types (j/with-connection SQLDB
                (j/with-query-results rs ["select * from Item_type"] (doall rs)))]
    (if (:login session)
       (pages (list [:a {:href "/item_types/new"} "添加商品类型"]
                    [:h2 "item_types"]
                    (for [item_type item_types]
                      [:div.row-fluid [:a.span6 {:href (str "/item_types/"(:id item_type))} (:type_name item_type)]])))
       (pages (list [:h2 "item_types"]
                    (for [item_type item_types]
                      [:div.row-fluid [:a.span6 {:href (str "/item_types/"(:id item_type))} (:type_name item_type)]]))))))

(defn new [session]
  (if (:login session)
    (pages (for [invoice (:invoice session)]
             [:div.row-fluid
              [:div.span2 (first invoice)]
              [:div.span2 (:item_name (second invoice))]
              [:div.span2 (:quantity (second invoice))]
              [:div.span2 (:price (second invoice))]]))
    (pages [:a {:href "/login"} "請登錄>>"])))


(defn create [params session]
  (if (:login session)
    (do (j/insert! SQLDB :Item_type
            {:type_name (:type_name params)})
        (pages [:div "添加成功."]))
    (pages [:a {:href "/login"} "請登錄>>"])))

(defn admin_item_type_pg [item_type]
  (let [items (j/with-connection SQLDB
               (j/with-query-results rs [(str "select * from Item where item_type = '" (:id item_type) "' GROUP BY plucode;")] (doall rs)))]
  (list [:h2.offset1 "商品种类"] 
        [:div.row-fluid [:div.span2 "Type name: "] 
         [:div.span3 (:type_name item_type)]
         [:div.span2 [:a {:href (str "/item_types/" (:id item_type) "/update")} "修改"]]
         [:div.span2 [:a {:href (str "/item_types/" (:id item_type) "/remove")} "删除"]]]
        [:h2 "该类商品列表"]
        (for [item items]
          [:div.row-fluid 
           [:a.span3 {:href (str "/items/" (:id item))} (:item_name item)] 
           [:a.span2 {:href (str "/items/" (:id item) "/update")} "同型号修改"] 
           [:a.span2 {:href (str "/items/"(:plucode item)"/remove")} "删除所有同型商品"]
           [:div.span2 "$" (:price item)]]))))

(defn item_type_pg [item_type]
  (let [items (j/with-connection SQLDB
               (j/with-query-results rs [(str "select * from Item where item_type = '" (:id item_type) "' GROUP BY plucode;")] (doall rs)))]
  (list [:h2.offset1 "商品种类"] 
        [:div.row-fluid [:div.span2 "Type name: "] 
         [:div.span3 (:type_name item_type)]]
        [:h2 "该类商品列表"]
        (for [item items]
          [:div.row-fluid 
           [:a.span3 {:href (str "/items/" (:id item))} (:item_name item)] 
           [:div.span2 "$" (:price item)]]))))

(defn show [id session]
  (let [item_type (first (j/with-connection SQLDB
               (j/with-query-results rs [(str "select * from Item_type where id = '" id "';")] (doall rs))))]
    (if (:login session) 
      (pages (admin_item_type_pg item_type))
      (pages (item_type_pg item_type)))))

(defn update [id session]
  (let [item_type (first (j/with-connection SQLDB 
                           (j/with-query-results rs [(str "select * from Item_type where id = '" id "';")] (doall rs))))]
  (if (:login session)
    (pages [:form.span10 {:action (str "/item_types/" id "/change") :method "post"}
           [:div.row-fluid
            [:lable.span2.offset1 "名称:"]
            [:input.span3 {:name "type_name" :type "text" :value (:type_name item_type)}]]
           [:div.row-fluid
            [:input.span1.offset1 {:type "submit" :value "修改"}]]])
    (pages [:a {:href "/login"} "請登錄>>"]))))

(defn change [params session]
  (if (:login session)
    (do 
      (j/update! SQLDB :Item_type params (s/where {:id (:id params)}))
      (pages [:h2 "修改成功."]))
    (pages [:a {:href "/login"} "請登錄>>"])))

(defn aremove [id session]
  (if (:login session)
    (do (j/delete! SQLDB :Item_type (s/where {:id id}))
        (pages [:div (str id "号商品类别删除成功.")]))
    (pages [:a {:href "/login"} "請登錄>>"])))
