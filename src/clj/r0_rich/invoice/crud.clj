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
                       [:a.span3 {:href (str "/invoices/"(:id invoice))} "时间戳:" (:timestamp invoice)]
                       [:a.span1 {:href (str "/invoices/"(:id invoice))} "$" (:total invoice)]
                       [:a.span1 {:href (str "/invoices/"(:id invoice))} (if (== 1 (:refund invoice)) "refunded" "sold")]
                       ])))
       (pages [:a {:href "/login"} "請登錄>>"]))))

(defn new [session]
  (if (and (:login session) (:invoice session))
    (pages [:form {:method "post" :action "/invoices/create" :novalidate "novalidate"}
            [:div.row-fluid 
             [:input.span1 {:value "item id" :type "text" :readonly "readonly"}]
             [:input.span1 {:value "plucode" :type "text" :readonly "readonly"}]
             [:input.span2 {:value "item name" :type "text" :readonly "readonly"}]
             [:input.span1 {:value "price" :type "text" :readonly "readonly"}]]
           (for [invoice (:invoice session)] 
             [:div.row-fluid 
               [:input.span1 {:name (str "items["(name (first invoice))"][item_id]") :type "text" :readonly "readonly" :value (first invoice)}]
               [:input.span1 {:name (str "items["(name (first invoice))"][plucode]") :type "text" :readonly "readonly" :value (:plucode (second invoice))}]
               [:input.span2 {:name (str "items["(name (first invoice))"][item_name]") :type "text" :readonly "readonly" :value (:item_name (second invoice))}]
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
                                                       (double (:price (second invoice))))))}]]
           [:div.row-fluid 
             [:input.span2.offset1 {:type "submit" :value "结帐"}]
             [:input.span2 {:type "reset" :value "重置"}]]])
    (pages [:a {:href "/items"} "請先登錄或选择商品"])))


(defn create [params session]
  (if (:login session)
    (do 
      (let [invoice (j/insert! SQLDB :Invoice 
                               {:timestamp (System/currentTimeMillis) 
                                :total (:total params) 
                                :refund 0})
            invoice_id ((keyword "last_insert_rowid()") (first invoice))] 
        (doseq [item (:items params)] 
          (let [origin_item (first (j/with-connection SQLDB 
                                     (j/with-query-results rs [(str "select * from Item where id = '" (:item_id (second item)) "';")] (doall rs)))) 
                insert_item (j/insert! SQLDB :Item_sold {:item_name (:item_name origin_item)
                                             :item_type (:item_type origin_item)
                                             :plucode (:plucode origin_item)
                                             :price (:price (second item))
                                             :cost (:cost origin_item)
                                             :refund 0
                                             :user_id (:user_id origin_item)
                                             :invoice_id invoice_id}) 
                removed_items (j/delete! SQLDB :Item (s/where {:id (:id origin_item)}))])) 
        (let [sold_items (j/with-connection SQLDB 
                           (j/with-query-results rs [(str "select * from Item_sold where invoice_id = '" invoice_id "';")] (doall rs)))]
          {:body (pages 
                   (list 
                     [:h2 "以下商品成功结帐:"] 
                     (for [sold_item sold_items]
                       [:div.row-fluid
                        [:div.span1 "ID:" (:id sold_item)]
                        [:div.span1 "PLUcode:" (:plucode sold_item)]
                        [:div.span3 (:item_name sold_item)]
                        [:div.span1 "$" (:price sold_item)]]) 
                     [:a {:href (str "/invoices/" invoice_id)} "打印小票"]))
         :headers {"Content-Type" "text/html; charset=utf-8"}
         :session (dissoc session :invoice)})))
    (pages [:a {:href "/login"} "請登錄>>"])))

(defn admin_invoice_pg [invoice]
  (let [sold_items (j/with-connection SQLDB
               (j/with-query-results rs [(str "select * from Item_sold where invoice_id = '" (:id invoice) "';")] (doall rs)))]
  (list [:h2.offset1 "invoice"] 
        [:div.row-fluid 
         [:div.span2 "invoice total price: "] 
         [:div.span1 (:total invoice)]]
        [:div.row-fluid 
         [:div.span2 "invoice timestamp: "] 
         [:div.span3 (:timestamp invoice)]]
        [:div.row-fluid 
         [:div.span2 [:a {:href (str "/invoices/" (:id invoice) "/update")} "修改或退款"]]
         [:div.span2 [:a {:href (str "/invoices/" (:id invoice) "/remove")} "删除"]]]
        [:h2 "sold items"]
        (for [item sold_items]
          [:div.row-fluid 
           [:div.span3 (:item_name item)] 
           [:div.span2 (:plucode item)] 
           [:div.span2 (:cost item)]
           [:div.span2 "$" (:price item)] 
           [:div.span2 (if (== 1 (:refund item)) "refunded" "sold")]
           ]))))

(defn invoice_pg [invoice]
  (let [sold_items (j/with-connection SQLDB
               (j/with-query-results rs [(str "select * from Item_sold where invoice_id = '" (:id invoice) "';")] (doall rs)))]
  (list [:h2.offset1 "invoice"] 
        [:div.row-fluid 
         [:div.span2 "invoice total price: "] 
         [:div.span1 (:total invoice)]]
        [:div.row-fluid 
         [:div.span2 "invoice timestamp: "] 
         [:div.span3 (:timestamp invoice)]]
        [:h2 "sold items"]
        (for [item sold_items]
          [:div.row-fluid 
           [:div.span3 (:item_name item)] 
           [:div.span2 (:plucode item)] 
           [:div.span2 "$" (:price item)]]))))

(defn show [id session]
  (let [invoice (first (j/with-connection SQLDB
               (j/with-query-results rs [(str "select * from Invoice where id = '" id "';")] (doall rs))))]
    (if (:login session) 
      (pages (admin_invoice_pg invoice))
      (pages (invoice_pg invoice)))))

(defn update [id session]
  (let [invoice (first (j/with-connection SQLDB 
                           (j/with-query-results rs [(str "select * from Invoice where id = '" id "';")] (doall rs)))) 
        sold_items (j/with-connection SQLDB 
                     (j/with-query-results rs [(str "select * from Item_sold where invoice_id = '" (:id invoice) "';")] (doall rs)))]
  (if (:login session)
    (pages [:form.span10 {:action (str "/invoices/" id "/change") :method "post"}
           [:div.row-fluid
            [:lable.span2.offset1 "总价:"]
            [:input.span3 {:name "total" :type "text" :value (:total invoice)}]]
           [:div.row-fluid
            [:lable.span2.offset1 "时间戳:"]
            [:input.span3 {:name "timestamp" :type "text" :value (:timestamp invoice)}]]
           [:div.row-fluid
            [:h3 "已售商品:"]
            (for [item sold_items]
              [:div.row-fluid
                [:input.span1 {:name (str "items["(:id item)"][id]") :readonly "readonly" :type "text" :value (:id item)}]
                [:input.span1 {:name (str "items["(:id item)"][plucode]") :readonly "readonly" :type "text" :value (:plucode item)}]
                [:input.span1 {:name (str "items["(:id item)"][item_name]") :readonly "readonly" :type "text" :value (:item_name item)}]
                [:input.span1 {:name (str "items["(:id item)"][price]") :readonly "readonly" :type "text" :value (:price item)}]
                [:input.span1 {:name (str "items["(:id item)"][cost]") :readonly "readonly" :type "text" :value (:cost item)}]
                [:input {:name (str "items["(:id item)"][user_id]") :readonly "readonly" :type "hidden" :value (:user_id item)}]
                [:input {:name (str "items["(:id item)"][invoice_id]") :readonly "readonly" :type "hidden" :value (:id invoice)}]
                [:input.span1 {:name (str "items["(:id item)"][refund]") :type "radio" :value 1 :checked (if (== 1 (:refund item)) "checked")} "退货"]
                [:input.span1 {:name (str "items["(:id item)"][refund]") :type "radio" :value 0 :checked (if (== 0 (:refund item)) "checked")} "保留"]
               ])]
           [:div.row-fluid
            [:input.span1.offset1 {:type "submit" :value "修改"}]]])
    (pages [:a {:href "/login"} "請登錄>>"]))))

(defn change [params session]
  (if (:login session)
    (do 
      (j/update! SQLDB :Invoice (dissoc params :items) (s/where {:id (:id params)}))
      (doseq [aitem (:items params)]
        (let [item (second aitem)
              update_item (j/update! SQLDB :Item_sold item (s/where {:id (:id item)}))]))
      (pages [:h2 "修改成功."]))
    (pages [:a {:href "/login"} "請登錄>>"])))

(defn aremove [id session]
  (if (:login session)
    (do (j/delete! SQLDB :Invoice (s/where {:id id}))
        (pages [:div (str id "号invoice删除成功.")]))
    (pages [:a {:href "/login"} "請登錄>>"])))
