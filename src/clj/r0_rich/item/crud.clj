(ns r0_rich.item.crud
    (:use hiccup.core
          r0_rich.env
          r0_rich.pages.template_pg
          hiccup.page)
    (:require [clojure.java.jdbc :as j]
              [clojure.java.jdbc.sql :as sql]
              [clojure.string :as str]))

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
             :price (:price params)
             :cost (:cost params)
             :user_id (:user_id params)}))
        (pages [:div "添加成功."]))
    (pages [:a {:href "/login"} "請登錄>>"])))

(defn def_item [title body]
  "compose page, convert title as id"
  (list [:h2.offset1 title]
        [:div.row-fluid {:id (str "pg_" (str/lower-case (str/replace title #"_|-|\s" "")))}
          [:div.span10.offset2 body]]))

(defn admin_item_pg [item items]
  (let [profit (- (:price item) (:cost item))]
  (def_item "商品信息"
    (list [:div.row-fluid [:div.span2 "Item name: "]
           [:div.span5 (:item_name item)]]
          [:div.row-fluid [:div.span2 "Item type: "]
           [:div.span5 (:item_type item)]]
          [:div.row-fluid [:div.span2 "PLU code: "]
           [:div.span5 (:plucode item)]]
          [:div.row-fluid [:div.span2 "Price: "]
           [:div.span5 (:price item)]]
          [:div.row-fluid [:div.span2 "Cost: "]
           [:div.span5 (:cost item)]]
          [:div.row-fluid [:div.span2 "Profit: "]
           [:div.span5 profit]]
          [:div.row-fluid [:div.span2 "Quantity: "]
           [:div.span5 (count items)]]
          [:div.row-fluid [:div#qrcode.span5 (:item_name item)]
           [:input#qr_str {:type "hidden" :value (str SERVER_URL "/items/" (:id item))}]]
          (include-js "/vendor/qr/jquery.min.js")
          (include-js "/vendor/qr/qrcode.js")
          (include-js "/qr.js")
          [:br] [:br] [:br]
          [:div.row-fluid [:div.span2 "同型号商品:"]]
          (for [item items]
            [:div.row-fluid
                       [:a.span3 {:href (str "/items/"(:id item))} (:item_name item)]
                       [:div.span1 (:price item)]
                       [:div.span1 (:quantity item)]
                       [:a.span2 {:href (str "/items/"(:id item)"/single_update")} "单个修改"]
                       [:a.span2 {:href (str "/items/"(:id item)"/single_remove")} "单个删除"]])
          ))))

(defn item_pg [item items]
  (def_item "商品信息"
    (list [:div.row-fluid [:div.span2 "Item name: "]
           [:div.span5 (:item_name item)]]
          [:div.row-fluid [:div.span2 "Item type: "]
           [:div.span5 (:item_type item)]]
          [:div.row-fluid [:div.span2 "PLU code: "]
           [:div.span5 (:plucode item)]]
          [:div.row-fluid [:div.span2 "Price: "]
           [:div.span5 (:price item)]]
          [:div.row-fluid [:div.span2 "Quantity: "]
           [:div.span5 (count items)]])))

(defn show [id session]
  (let [item (first (j/with-connection SQLDB
               (j/with-query-results rs [(str "select * from Item where id = '" id "';")] (doall rs))))
        items (j/with-connection SQLDB 
                (j/with-query-results rs [(str "select * from Item where plucode = '" (:plucode item) "';")] (doall rs)))]
    (if (:login session) 
      (pages (admin_item_pg item items))
      (pages (item_pg item items)))))

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
      (j/update! SQLDB :Item params (sql/where {:id (:id params)}))
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
        (j/update! SQLDB :Item (assoc params :id (:id item)) (sql/where {:id (:id item)}))) 
      (pages [:h2 "修改成功."]))
    (pages [:a {:href "/login"} "請登錄>>"]))))

(defn plu_remove [plucode session]
  (if (:login session)
    (do (j/delete! SQLDB :Item (sql/where {:plucode plucode}))
        (pages [:div (str "所有Plu:" plucode "的商品删除成功.")]))
    (pages [:a {:href "/login"} "請登錄>>"])))

(defn single_remove [id session]
  (if (:login session)
    (do (j/delete! SQLDB :Item (sql/where {:id id}))
        (pages [:div (str id "号商品删除成功.")]))
    (pages [:a {:href "/login"} "請登錄>>"])))

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

