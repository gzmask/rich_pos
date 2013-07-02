(ns r0_rich.view.home_pg
    (:use hiccup.core
        hiccup.page)
    (:require [clojure.string :as s]))

(defn def_home [title body]
  "compose page, convert title as id"
  (list [:h2.offset1 title] 
        [:div.row-fluid {:id (str "pg_" (s/lower-case (s/replace title #"_|-|\s" "")))} 
          [:div.span10.offset1 body]]))

(def home_pg (def_home "開始" 
               [:div.span2 "开始"]
               ))
