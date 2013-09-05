(ns r0_rich.item.crud
    (:use hiccup.core
          r0_rich.env
          r0_rich.pages.template_pg
          hiccup.page)
    (:require [clojure.java.jdbc :as j]
              [clojure.java.jdbc.sql :as sql]
              [clojure.java.io :as io]
              [clojure.string :as str]))

(defn new [session]
  (let [types (j/with-connection SQLDB
               (j/with-query-results rs [(str "select * from Item_type")] (doall rs)))]
  (if (:login session)
    (pages (let [div   :div.row-fluid
                 lable :lable.span2.offset1
                 input :input.span3]
             [:form.span10 {:action "/items/create" :method "post" :enctype "multipart/form-data"}
              [div
               [lable "商品名称:"]
               [input {:name "item_name" :type "text"}]]
              [div
               [lable "商品类型:"]
               [:select.span3 {:name "item_type"}
                (for [type types]
                  [:option {:value (:id type)} (:type_name type)])]]
              [div
               [lable "PLU代码:"]
               [input {:name "plucode" :type "text"}]]
              [div
               [lable "价格:"]
               [input {:name "price" :type "text"}]]
              [div
               [lable "成本:"]
               [input {:name "cost" :type "text"}]]
              [div
               [lable "库存:"]
               [input {:name "quantity" :type "text"}]] 
              [div 
               [lable "税收:"]
               [:input.span1 {:name "taxable" :type "radio" :value 1 :checked "checked"} "有税"]
               [:input.span1 {:name "taxable" :type "radio" :value 0} "无税"]]
              [div
               [lable "图片:"]
               [input {:name "picture" :type "file" :size "20"}]]
              [:input {:value (:user_id session)  :name "user_id" :type "hidden"}]
              [div
               [:input.span1.offset1 {:type "submit" :value "添加"}]]])
           "/vendor/qr/jquery.min.js"
           "/vendor/trim_form_text/trim-form-text.js")
    (pages [:a {:href "/login"} "請登錄>>"]))))

(defn create [params session]
  (if (:login session)
    (let [pic-name (:filename (:picture params))
          pic-path (if (empty? pic-name) nil
                       (str PRO_PIC_FOLDER "/" (:plucode params) "/" pic-name))]
      (do (doseq [x (range (Integer. (:quantity params)))]
            (j/insert! SQLDB :Item
                       {:item_name (:item_name params)
                        :item_type (:item_type params)
                        :plucode (:plucode params)
                        :price (:price params)
                        :cost (:cost params)
                        :user_id (:user_id params)
                        :taxable (:taxable params)
                        :picture (if (empty? pic-path) 
                                   nil 
                                   pic-path)}))
          (if pic-path
            (do (io/make-parents pic-path)
                (io/copy (io/file (:tempfile (:picture params))) (io/file pic-path))))
          (pages [:div "添加成功."])))
    (pages [:a {:href "/login"} "請登錄>>"])))

(defn def_item [title body]
  "compose page, convert title as id"
  (list [:h2.offset1 title]
        [:div.row-fluid {:id (str "pg_" (str/lower-case (str/replace title #"_|-|\s" "")))}
          [:div.span12 body]]))

(defn admin_item_pg [item items]
  (let [profit (- (:price item) (:cost item))
        item_type (first (j/with-connection SQLDB
                           (j/with-query-results rs [(str "select * from Item_type where id = '" (:item_type item) "';")] (doall rs))))]
    (def_item "商品发票"
      (list [:div.row-fluid 
             [:form.span6 {:method "post" :action "/updateinvoice" :novalidate "novalidate"}
              [:input {:name "item_id" :value (:id item) :type "hidden"}]
              [:input {:name "item_name" :value (:item_name item) :type "hidden"}]
              [:input {:name "plucode" :value (:plucode item) :type "hidden"}]
              [:input {:name "taxable" :value (:taxable item) :type "hidden"}]
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
              [:div.row-fluid [:div.span2 "taxable: "]
               [:div.span5 (:taxable item)]]
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

(defn item_pg [item items]
  (let [item_type (first (j/with-connection SQLDB
                           (j/with-query-results rs [(str "select * from Item_type where id = '" (:item_type item) "';")] (doall rs))))]
    (def_item "商品信息"
      (list [:div.row-fluid [:div.span2 "Item name: "]
             [:div.span5 (:item_name item)]]
            [:div.row-fluid [:div.span2 "Item type: "]
             [:div.span5 (:type_name item_type)]]
            [:div.row-fluid [:div.span2 "PLU code: "]
             [:div.span5 (:plucode item)]]
            [:div.row-fluid [:div.span2 "Price: "]
             [:div.span5 "$" (:price item)]]
            [:div.row-fluid [:div.span2 "Quantity: "]
             [:div.span5 (count items)]]))))

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
               [:lable.span2.offset1 "税收:"]
               [:input.span1 {:name "taxable" :type "radio" :value 1 :checked (if (== 1 (:taxable item)) "checked" "")} "有税"]
               [:input.span1 {:name "taxable" :type "radio" :value 0 :checked (if (== 0 (:taxable item)) "checked")} "无税"]]
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
               [:lable.span2.offset1 "税收:"]
               [:input.span1 {:name "taxable" :type "radio" :value 1 :checked (if (== 1 (:taxable item)) "checked")} "有税"]
               [:input.span1 {:name "taxable" :type "radio" :value 0 :checked (if (== 0 (:taxable item)) "checked")} "无税"]]
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
                (j/with-query-results rs ["select * from Item GROUP BY plucode ORDER BY plucode"] (doall rs)))]
    (if (:login session)
      (pages (list [:a {:href "/items/new"} "添加商品"]
                   [:h2 "items"]
                   (for [item items]
                     [:div.row-fluid
                      [:div.span1 (:plucode item)]
                      [:a.span3 {:href (str "/items/"(:id item))} (:item_name item)]
                      [:div.span1 "$" (:price item)]
                      [:div.span1 (:quantity item)]
                      [:a.span2 {:href (str "/items/"(:id item)"/update")} "修改所有"]
                      [:a.span2 {:href (str "/items/"(:plucode item)"/remove")} "删除所有"]])))
      (pages (list [:h2 "items"]
                   (for [item items]
                     [:div.row-fluid
                      [:div.span1 (:plucode item)]
                      [:a.span3 {:href (str "/items/"(:id item))} (:item_name item)]
                      [:div.span1 "$" (:price item)]
                      [:div.span1 (:quantity item)]]))))))
