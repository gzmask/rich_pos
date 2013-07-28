(ns r0_rich.item.show
    (:use hiccup.core
          r0_rich.env
          r0_rich.pages.template_pg
          hiccup.page)
    (:require [clojure.java.jdbc :as j]
              [clojure.string :as s]))

(defn def_item [title body]
  "compose page, convert title as id"
  (list [:h2.offset1 title]
        [:div.row-fluid {:id (str "pg_" (s/lower-case (s/replace title #"_|-|\s" "")))}
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
