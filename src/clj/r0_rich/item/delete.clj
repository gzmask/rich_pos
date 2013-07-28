(ns r0_rich.item.delete
    (:use hiccup.core
          hiccup.page
          r0_rich.env
          r0_rich.pages.template_pg)
    (:require [clojure.java.jdbc :as j]
              [clojure.java.jdbc.sql :as s]))

(defn plu_remove [plucode session]
  (if (:login session)
    (do (j/delete! SQLDB :Item (s/where {:plucode plucode}))
        (pages [:div (str "所有Plu:" plucode "的商品删除成功.")]))
    (pages [:a {:href "/login"} "請登錄>>"])))

(defn single_remove [id session]
  (if (:login session)
    (do (j/delete! SQLDB :Item (s/where {:id id}))
        (pages [:div (str id "号商品删除成功.")]))
    (pages [:a {:href "/login"} "請登錄>>"])))
