(ns r0_rich.session.log
    (:use hiccup.core
          hiccup.page
          r0_rich.env
          r0_rich.pages.template_pg)
    (:require [clojure.java.jdbc :as j]
              [clojure.java.jdbc.sql :as s]))

(defn check [username password session]
  (let [user (first (j/query SQLDB (s/select * :User (s/where {:account_name username}))))]
    (if (= password (:password user))
        {:body (pages (list [:div "登錄成功!"]))
         :headers {"Content-Type" "text/html; charset=utf-8"}
         :session (assoc session :login true :user_id (:id user) :user_name (:account_name user) :user_role (:user_role user))}
        {:body (pages (list [:div "登錄失敗!"]))
         :headers {"Content-Type" "text/html; charset=utf-8"}
         :session (assoc session :login false)})))

(defn login [session]
  (if (:login session)
    (pages [:div "用户" (:user_name session) [:a {:href "/logout"} "登出"]])
    (pages [:form.span10 {:action "/check#login" :method "post"}
     [:div.row-fluid
      [:label.span1.offset1 "User name:"]
      [:input#username.span3 {:name "username" :type "text"}]]
     [:div.row-fluid
      [:label.span1.offset1 "Password:"]
      [:input#password.span3 {:name "password" :type "password"}]]
     [:div.row-fluid
      [:input.span1.offset1 {:type "submit" :value "Login"}]]])))

(defn logout [session]
  (if (:login session)
    {:body (pages [:div (str "用戶" (:user_name session) "已经登出")])
     :headers {"Content-Type" "text/html; charset=utf-8"}
     :session nil}
    (pages [:div "你還沒登錄"])))

(defn updateinvoice [params session]
  (if (:login session)
      {:body (pages (list [:div "添加成功!"] [:script {:type "text/javascript"} "window.location.replace('/invoices/new#invoicesnew')"]))
       :headers {"Content-Type" "text/html; charset=utf-8"}
       :session (assoc session :invoice (merge (:invoice session) 
                                          (let [allitems (j/query SQLDB (s/select * :Item (s/where {:plucode (:plucode params)})))
                                                items (take (dec (read-string (:quantity params))) allitems)]
                                            (reduce  
                                              (fn [first second] (merge first second)) 
                                              {(keyword (str (:item_id params)))
                                               {:price (read-string (:price params))
                                                :item_name (:item_name params)
                                                :plucode (:plucode params)}}
                                              (for [item items]
                                                {(keyword (str (:id item)))
                                                 {:price (:price item)
                                                  :item_name (:item_name item)
                                                  :plucode (:plucode item)}})))))}
      (pages [:div "你還沒登錄"])))
