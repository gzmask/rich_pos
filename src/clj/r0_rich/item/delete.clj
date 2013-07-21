(ns r0_rich.item.delete
    (:use hiccup.core
          hiccup.page
          r0_rich.env
          r0_rich.pages.template_pg)
    (:require [clojure.java.jdbc :as j]
              [clojure.java.jdbc.sql :as s]))

(defn remove [id session]
  (if (:login session)
    (do (j/delete! SQLDB :Item (s/where {:id id}))
        (pages [:div (str id "号商品删除成功.")]))
    (pages [:a {:href "/login"} "請登錄>>"])))
