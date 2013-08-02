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
                       [:div.span3 "时间戳:" (:timestamp invoice)]
                       [:div.span1 "$" (:total invoice)]
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
                                :refund false})
            invoice_id ((keyword "last_insert_rowid()") (first invoice))] 
        (doseq [item (:items params)] 
          (let [origin_item (first (j/with-connection SQLDB 
                                     (j/with-query-results rs [(str "select * from Item where id = '" (:item_id (second item)) "';")] (doall rs)))) 
                sold_items (j/insert! SQLDB :Item_sold {:item_name (:item_name origin_item)
                                           :item_type (:item_type origin_item)
                                           :plucode (:plucode origin_item)
                                           :price (:price (second item))
                                           :cost (:cost origin_item)
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
         [:div.span2 "invoice timestamp: "] 
         [:div.span3 (:timestamp invoice)]
         [:div.span2 [:a {:href (str "/invoices/" (:id invoice) "/update")} "修改"]]
         [:div.span2 [:a {:href (str "/invoices/" (:id invoice) "/remove")} "删除"]]]
        [:h2 "sold items"]
        (for [item sold_items]
          [:div.row-fluid 
           [:a.span3 {:href (str "/items/" (:id item))} (:item_name item)] 
           [:a.span2 {:href (str "/items/" (:id item) "/update")} "同型号修改"] 
           [:a.span2 {:href (str "/items/"(:plucode item)"/remove")} "删除所有同型商品"]
           [:div.span2 "$" (:price item)]]))))

(defn invoice_pg [invoice]
  (let [sold_items (j/with-connection SQLDB
               (j/with-query-results rs [(str "select * from Item_sold where invoice_id = '" (:id invoice) "';")] (doall rs)))]
  (list [:h2.offset1 "invoice"] 
        [:div.row-fluid 
         [:div.span2 "invoice timestamp: "] 
         [:div.span3 (:timestamp invoice)]
         [:div.span2 [:a {:href (str "/invoices/" (:id invoice) "/update")} "修改"]]
         [:div.span2 [:a {:href (str "/invoices/" (:id invoice) "/remove")} "删除"]]]
        [:h2 "sold items"]
        (for [item sold_items]
          [:div.row-fluid 
           [:a.span3 {:href (str "/items/" (:id item))} (:item_name item)] 
           [:a.span2 {:href (str "/items/" (:id item) "/update")} "同型号修改"] 
           [:a.span2 {:href (str "/items/"(:plucode item)"/remove")} "删除所有同型商品"]
           [:div.span2 "$" (:price item)]]))))

(defn show [id session]
  (let [invoice (first (j/with-connection SQLDB
               (j/with-query-results rs [(str "select * from Invoice where id = '" id "';")] (doall rs))))]
    (if (:login session) 
      (pages (admin_invoice_pg invoice))
      (pages (invoice_pg invoice)))))

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
