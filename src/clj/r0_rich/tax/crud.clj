(ns r0_rich.tax.crud
    (:use hiccup.core
          r0_rich.env
          r0_rich.pages.template_pg
          hiccup.page)
    (:require [clojure.java.jdbc :as j]
              [clojure.java.jdbc.sql :as sql]
              [clojure.string :as str]))

(defn new [session]
  (if (:login session)
    (pages [:form.span10 {:action "/taxs/create" :method "post"}
             [:div.row-fluid
              [:lable.span2.offset1 "名称:"]
              [:input.span3 {:name "name" :type "text"}]]
             [:div.row-fluid
              [:lable.span2.offset1 "税率:"]
              [:input.span3 {:name "rate" :type "number" :value 0.1
                             :min 0 :max 0.3 :step 0.01}]]
             [:div.row-fluid
              [:input.span1.offset1 {:type "submit" :value "添加"}]]])
    (pages [:a {:href "/login"} "請登錄>>"])))

(defn create [params session]
  (if (:login session)
    (do (j/insert! SQLDB :Tax
            {:name (:name params)
             :rate (:rate params)})
        (pages [:div "添加成功."]))
    (pages [:a {:href "/login"} "請登錄>>"])))

(defn def_item [title body]
  "compose page, convert title as id"
  (list [:h2.offset1 title]
        [:div.row-fluid {:id (str "pg_" (str/lower-case (str/replace title #"_|-|\s" "")))}
          [:div.span12 body]]))

(defn admin_tax_pg [tax]
  (let 
  (def_item "商品发票"
    (list [:div.row-fluid 
           [:form.span6 {:method "post" :action "/updateinvoice" :novalidate "novalidate"}
            [:input {:name "item_id" :value (:id item) :type "hidden"}]
            [:input {:name "item_name" :value (:item_name item) :type "hidden"}]
            [:input {:name "plucode" :value (:plucode item) :type "hidden"}]
            [:div.row-fluid 
             [:label.span2.offset1 "数目(同型随选):"] 
             [:input.span3 {:name "quantity" :type "number" :min 1 :max (count items) :value 1}]]
            [:div.row-fluid 
             [:label.span2.offset1 "单价:"]
             [:input.span3 {:name "price" :type "number" 
                            :min 0
                            :max (+ (:price item) 0.001)
                            :value (:price item)
                            :step (/ (:price item) 10)}]]
            [:div.row-fluid
             [:input.span3.offset1 {:type "submit" :value "添加至帐单"}]
             [:input.span3 {:type "reset" :value "重置"}]]]
           [:div.span6
            [:div.row-fluid [:div.span2 "Item name: "] 
             [:div.span5 (:item_name item)]]
            [:div.row-fluid [:div.span2 "Item type: "]
             [:div.span5 (:type_name item_type)]]
            [:div.row-fluid [:div.span2 "PLU code: "]
             [:div.span5 (:plucode item)]]
            [:div.row-fluid [:div.span2 "Price: "]
             [:div.span5 "$" (:price item)]]
            [:div.row-fluid [:div.span2 "Cost: "]
             [:div.span5.hidenum "$" (:cost item)]]
            [:div.row-fluid [:div.span2 "Profit: "]
             [:div.span5.hidenum "$" (format "%.2f" profit)]]
            [:div.row-fluid [:div.span2 "Quantity: "]
             [:div.span5 (count items)]]
            [:div.row-fluid [:div#qrcode.span5 (:item_name item)]
             [:input#qr_str {:type "hidden" :value (str SERVER_URL "/items/" (:id item))}]]]] 
          [:br]
          [:div.row-fluid 
           [:a.span2 {:href (str "/items/"(:id item)"/update")} "修改所有同型商品"] 
           [:a.span2 {:href (str "/items/"(:id item)"/single_update")} "修改此商品"]
           [:a.span2 {:href (str "/items/"(:plucode item)"/remove")} "删除所有同型商品"]
           [:a.span2 {:href (str "/items/"(:id item)"/single_remove")} "删除此商品"]]
          (include-js "/vendor/qr/jquery.min.js")
          (include-js "/vendor/qr/qrcode.js")
          (include-js "/qr.js")
          [:br] [:br] [:br]
          [:div.row-fluid [:div.span2 "同型号商品:"]]
          (for [item items]
            [:div.row-fluid
                       [:a.span3 {:href (str "/items/"(:id item))} (:item_name item)]
                       [:div.span1 "$" (:price item)]
                       [:div.span1 (:quantity item)]
                       [:a.span2 {:href (str "/items/"(:id item)"/single_update")} "单个修改"]
                       [:a.span2 {:href (str "/items/"(:id item)"/single_remove")} "单个删除"]])))))

(defn show [id session]
  (let [tax (first (j/with-connection SQLDB
               (j/with-query-results rs [(str "select * from Tax where id = '" id "';")] (doall rs))))]
    (if (:login session) 
      (pages (admin_tax_pg tax)) 
      (pages [:a {:href "/login"} "請登錄>>"]))))

(defn change [params session]
  (if (:login session)
    (do 
      (j/update! SQLDB :Tax params (sql/where {:id (:id params)}))
      (pages [:h2 "修改成功."]))
    (pages [:a {:href "/login"} "請登錄>>"])))

(defn update [id session]
  (let [tax (first (j/with-connection SQLDB
               (j/with-query-results rs [(str "select * from Tax where id = '" id "';")] (doall rs))))]
  (if (:login session)
    (pages [:form.span10 {:action (str "/taxs/" id "/change") :method "post"}
           [:div.row-fluid
            [:lable.span2.offset1 "名称:"]
            [:input.span3 {:name "name" :type "text" :value (:name tax)}]]
           [:div.row-fluid
            [:lable.span2.offset1 "税率:"]
            [:input.span3 {:name "rate" :type "text" :value (:rate tax) :readonly "readonly"}]]
           [:div.row-fluid
            [:input.span1.offset1 {:type "submit" :value "修改"}]]])
    (pages [:a {:href "/login"} "請登錄>>"]))))

(defn remove [id session]
  (if (:login session)
    (do (j/delete! SQLDB :Item (sql/where {:id id}))
        (pages [:div (str id "号商品删除成功.")]))
    (pages [:a {:href "/login"} "請登錄>>"])))

(defn index [session]
  (let [taxs (j/with-connection SQLDB
                (j/with-query-results rs ["select * from Tax"] (doall rs)))]
    (if (:login session) 
      (pages (list [:a {:href "/taxs/new"} "添加商品"]
                    [:h2 "taxs"]
                    (for [tax taxs]
                      [:div.row-fluid
                       [:div.span1 (:name tax)]
                       [:a.span3 {:href (str "/taxs/"(:id tax))} (:name tax)]
                       [:div.span1 (:rate tax)]
                       [:a.span2 {:href (str "/taxs/"(:id tax)"/update")} "修改"]
                       [:a.span2 {:href (str "/taxs/"(:id tax)"/remove")} "删除"]]))) 
      (pages [:a {:href "/login"} "請登錄>>"]))))

