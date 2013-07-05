(ns r0_rich.item.show
    (:use hiccup.core
          r0_rich.env
          r0_rich.pages.template_pg
          hiccup.page)
    (:require [clojure.java.jdbc :as j]
              [clojure.string :as s]))

(defn def_qr [title body]
  "compose page, convert title as id"
  (list [:h2.offset1 title] 
        [:div.row-fluid {:id (str "pg_" (s/lower-case (s/replace title #"_|-|\s" "")))} 
          [:div.span10.offset1 body]]))

(defn qr_pg [id]
  (def_qr "生成标签"
    (list [:div#qrcode.span5 ""]
          [:input#qr_str {:type "hidden" :value (str SERVER_URL "/items/" id)}]
          (include-js "/vendor/qr/jquery.min.js")
          (include-js "/vendor/qr/qrcode.js")
          (include-js "/qr.js"))))

(defn show [id]
  (let [item (first (j/with-connection SQLDB
               (j/with-query-results rs [(str "select * from Item where id = '" id "';")] (doall rs))))]
    (pages (qr_pg id))))
