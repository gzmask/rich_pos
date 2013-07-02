(ns r0_rich.view.qr_pg
    (:use hiccup.core
        hiccup.page)
    (:require [clojure.string :as s]))

(defn def_qr [title body]
  "compose page, convert title as id"
  (list [:h2.offset1 title] 
        [:div.row-fluid {:id (str "pg_" (s/lower-case (s/replace title #"_|-|\s" "")))} 
          [:div.span10.offset1 body]]))

(def qr_pg (def_qr "生成标签" 
               (list [:div#qrcode.span5 ""]
                     [:input#qr_str {:type "hidden" :value "richever.ca"}]
               (include-js "/vendor/qr/jquery.min.js")
               (include-js "/vendor/qr/qrcode.js")
               (include-js "/qr.js")
               )))

