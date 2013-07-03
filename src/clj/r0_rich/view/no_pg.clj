(ns r0_rich.view.no_pg
    (:use hiccup.core
          hiccup.page
          r0_rich.view.template_pg)
    (:require [clojure.string :as s]))

(defn def_no [title body]
  "compose page, convert title as id"
  (list [:h2.offset1 title] 
        [:div.row-fluid {:id (str "pg_" (s/lower-case (s/replace title #"_|-|\s" "")))} 
          [:div.span10.offset1 body]]))

(def no_pg (pages (def_no "找不到页面" 
                "页面不存在")))
