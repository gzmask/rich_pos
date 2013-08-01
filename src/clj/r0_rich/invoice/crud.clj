(ns r0_rich.invoice.crud
    (:use hiccup.core
          r0_rich.env
          r0_rich.pages.template_pg
          hiccup.page)
    (:require [clojure.java.jdbc.sql :as s] 
              [clojure.java.jdbc :as j]))

(defn index [session]
  (let [invoices (j/with-connection SQLDB 
                   (j/with-query-results rs ["select * from Invoice"] (doall rs)))]
    (if (:login session)
       (pages (list [:h2 "invoices"]
                    (for [invoice invoices]
                      [:div.row-fluid 
                       [:a.span1 {:href (str "/invoices/"(:id invoice))} (:id invoice)]
                       [:div.span2 (:timestamp invoice)]
                       [:div.span2 "$" (:total invoice)]
                       ])))
       (pages [:a {:href "/login"} "請登錄>>"]))))

(defn new [session]
  (if (and (:login session) (:invoice session))
    (pages [:form {:method "post" :action "/invoices/create" :novalidate "novalidate"}
            [:div.row-fluid 
             [:input.span1 {:value "item id" :type "text" :readonly "readonly"}]
             [:input.span2 {:value "item name" :type "text" :readonly "readonly"}]
             [:input.span1 {:value "quantity" :type "text" :readonly "readonly"}]
             [:input.span1 {:value "price" :type "text" :readonly "readonly"}]]
           (for [invoice (:invoice session)] 
             [:div.row-fluid 
               [:input.span1 {:name (str "items["(name (first invoice))"][item_id]") :type "text" :readonly "readonly" :value (first invoice)}]
               [:input.span2 {:name (str "items["(name (first invoice))"][item_name]") :type "text" :readonly "readonly" :value (:item_name (second invoice))}]
               [:input.span1 {:name (str "items["(name (first invoice))"][quantity]") :type "number" :min 1 :max 10 :value (:quantity (second invoice))}]
               [:input.span1 {:name (str "items["(name (first invoice))"][price]") 
                              :type "number" :min 0 
                              :step (/ (:price (second invoice)) 10) 
                              :max (+ (:price (second invoice)) 0.001) 
                              :value (:price (second invoice))}]])
           [:div.row-fluid 
             [:input.span1.offset2 {:value "总数:" :type "text" :readonly "readonly"}] 
             [:input.span1 {:type "number" :readonly "readonly" :name "total"
                            :value 
                            (format "%.2f" (reduce + (for [invoice (:invoice session)] 
                                     (* (:price (second invoice))
                                        (:quantity (second invoice))))))}]]
           [:div.row-fluid 
             [:input.span2.offset1 {:type "submit" :value "结帐"}]
             [:input.span2 {:type "reset" :value "重置"}]]])
    (pages [:a {:href "/items"} "請先登錄并选择商品"])))


(defn create [params session]
  (if (:login session)
    (do (j/insert! SQLDB :Invoice
            {:timestamp (System/currentTimeMillis)
             :total (:total params)
             :refund false})
        (pages [:div (seq (:items params))]))
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
