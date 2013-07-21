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

(defn item_pg [item]
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
           [:div.span5 (:quantity item)]]
          [:div.row-fluid [:div#qrcode.span5 "QR code"]
           [:input#qr_str {:type "hidden" :value (str SERVER_URL "/items/" (:id item))}]]
          (include-js "/vendor/qr/jquery.min.js")
          (include-js "/vendor/qr/qrcode.js")
          (include-js "/qr.js")))))

(defn show [id]
  (let [item (first (j/with-connection SQLDB
               (j/with-query-results rs [(str "select * from Item where id = '" id "';")] (doall rs))))]
    (pages (item_pg item))))
