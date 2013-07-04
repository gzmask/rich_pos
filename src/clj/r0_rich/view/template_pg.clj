(ns r0_rich.view.template_pg
    (:use hiccup.page
          hiccup.core)
    (:require [clojure.string :as s]))


(defn def_nav [names ids icons]
  (list [:div.span1 ""] 
        (map (fn [name id icon] 
               (list [:div.span2 [:a {:href (str (s/lower-case (s/replace id #"_|-|\s" "")))}[(keyword (str "i." icon)) name]]]))
             names ids icons)))

(def nav_bar (def_nav ["開始" "商品" "登錄"] 
                       ["/home" "/items" "/login"]
                       ["icon-home" "icon-home" "icon-home"]))

(defn pages [page]
  "get page by pagename"
  (html5
   [:head 
    [:title "長亨POS系統"]
    (include-css "/vendor/bootstrap/css/bootstrap.min.css")
    (include-css "/vendor/bootstrap/css/bootstrap-responsive.css")
    (include-css "/vendor/font-awesome/css/font-awesome.min.css")
    (include-css "/style.css")]
   [:body
    [:div.row-fluid.navigation_bar nav_bar]
    [:div.row-fluid.content [:h1.offset1 "長亨POS系統"]
      [:div.row-fluid page]]]))

