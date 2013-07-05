(ns r0_rich.session.log
    (:use hiccup.core
          hiccup.page
          r0_rich.env
          r0_rich.pages.template_pg)
    (:require [clojure.java.jdbc :as j]
              [clojure.java.jdbc.sql :as s]))

;(def users (j/query SQLDB (s/select * :User (s/where {:account_name "gzmask"})) :row_fn :password))

(defn check [username password session]
  (let [user (first (j/query SQLDB (s/select * :User (s/where {:account_name username}))))]
  {:body (pages (list [:div "登錄中..."]))
   :headers {"Content-Type" "text/html; charset=utf-8"}
   :session (if (= password (:password user))
              {assoc session :login true :user_id (:id user) :user_role (:user_role user)}
              nil)}))

(defn login [session]
  (if (:login session)
    (pages [:div "User-" (:user_id session) [:a {:href "/logout"} "登出"]])
    (pages [:form.span10 {:action "/check" :method "post"}
     [:div.row-fluid
      [:label.span1.offset1 "User name:"]
      [:input#username.span3 {:value "yourname" :name "username" :type "text"}]]
     [:div.row-fluid
      [:label.span1.offset1 "Password:"]
      [:input#password.span3 {:name "password" :type "password"}]]
     [:div.row-fluid
      [:input.span1.offset1 {:type "submit" :value "Login"}]]])))

(defn logout [session]
  (if (:login session)
    {:body (pages [:div (str "用戶" (:user_id session) "登出中...")])
     :headers {"Content-Type" "text/html; charset=utf-8"}
     :session nil}
    (pages [:div "你還沒登錄"])))
