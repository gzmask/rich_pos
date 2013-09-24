(ns r0_rich.tax.crud
    (:use hiccup.core
          r0_rich.env
          r0_rich.pages.template_pg
          hiccup.page)
    (:require [clojure.java.jdbc :as j]
              [clojure.java.jdbc.sql :as sql]
              [clojure.string :as str]))

(defn new [session]
  (if (:login session)
    (pages [:form.span10 {:action "/taxs/create" :method "post"}
             [:div.row-fluid
              [:lable.span2.offset1 "名称:"]
              [:input.span3 {:name "name" :type "text"}]]
             [:div.row-fluid
              [:lable.span2.offset1 "税率:"]
              [:input.span3 {:name "rate" :type "number" :value 0.1
                             :min 0 :max 0.3 :step 0.01}]]
             [:div.row-fluid
              [:input.span1.offset1 {:type "submit" :value "添加"}]]])
    (pages [:a {:href "/login"} "請登錄>>"])))

(defn create [params session]
  (if (:login session)
    (do (j/insert! SQLDB :Tax
            {:name (:name params)
             :rate (:rate params)})
        (pages [:div "添加成功."]))
    (pages [:a {:href "/login"} "請登錄>>"])))

(defn show [id session]
  (let [tax (first (j/with-connection SQLDB
               (j/with-query-results rs [(str "select * from Tax where id = '" id "';")] (doall rs))))]
    (if (:login session) 
      (pages (list 
               [:div.span2 "name: " (:name tax)]
               [:div.span2 "rate: " (:rate tax)])) 
      (pages [:a {:href "/login"} "請登錄>>"]))))

(defn change [params session]
  (if (:login session)
    (do 
      (j/update! SQLDB :Tax params (sql/where {:id (:id params)}))
      (pages [:h2 "修改成功."]))
    (pages [:a {:href "/login"} "請登錄>>"])))

(defn update [id session]
  (let [tax (first (j/with-connection SQLDB
               (j/with-query-results rs [(str "select * from Tax where id = '" id "';")] (doall rs))))]
  (if (:login session)
    (pages [:form.span10 {:action (str "/taxs/" id "/change") :method "post"}
           [:div.row-fluid
            [:lable.span2.offset1 "名称:"]
            [:input.span3 {:name "name" :type "text" :value (:name tax)}]]
           [:div.row-fluid
            [:lable.span2.offset1 "税率:"]
            [:input.span3 {:name "rate" :type "text" :value (:rate tax) :readonly "readonly"}]]
           [:div.row-fluid
            [:input.span1.offset1 {:type "submit" :value "修改"}]]])
    (pages [:a {:href "/login"} "請登錄>>"]))))

(defn aremove [id session]
  (if (:login session)
    (do (j/delete! SQLDB :Tax (sql/where {:id id}))
        (pages [:div (str id "号删除成功.")]))
    (pages [:a {:href "/login"} "請登錄>>"])))

(defn index [session]
  (let [taxs (j/with-connection SQLDB
                (j/with-query-results rs ["select * from Tax"] (doall rs)))]
    (if (:login session) 
      (pages (list [:a {:href "/taxs/new"} "添加商品"]
                    [:h2 "taxs"]
                    (for [tax taxs]
                      [:div.row-fluid
                       [:div.span1 (:name tax)]
                       [:a.span3 {:href (str "/taxs/"(:id tax))} (:name tax)]
                       [:div.span1 (:rate tax)]
                       [:a.span2 {:href (str "/taxs/"(:id tax)"/update")} "修改"]
                       [:a.span2 {:href (str "/taxs/"(:id tax)"/remove")} "删除"]]))) 
      (pages [:a {:href "/login"} "請登錄>>"]))))

