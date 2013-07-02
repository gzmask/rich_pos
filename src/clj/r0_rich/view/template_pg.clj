(ns r0_rich.view.template_pg
    (:use r0_rich.view.home_pg
        r0_rich.view.qr_pg
        r0_rich.view.no_pg
        hiccup.page
        hiccup.core)
    (:require [clojure.string :as s]))


(defn def_nav [navs ids icons]
  (list [:div.span1 ""] 
        (map (fn [nav id icon] 
               (list [:div.span2 [:a {:href (str (s/lower-case (s/replace id #"_|-|\s" "")))}[(keyword (str "i." icon)) nav]]]))
             navs ids icons)))

(def nav_bar (def_nav ["開始" "生成"] 
                       ["home" "qr"]
                       ["icon-home" "icon-home"]))

(defn pages [page]
  "get page by pagename"
  (html5
   [:head 
    [:title "長亨科技收納系統"]
    (include-css "/vendor/bootstrap/css/bootstrap.min.css")
    (include-css "/vendor/bootstrap/css/bootstrap-responsive.css")
    (include-css "/vendor/font-awesome/css/font-awesome.min.css")
    (include-css "/style.css")]
   [:body
    [:div.row-fluid.navigation_bar nav_bar]
    [:div.row-fluid.content [:h1.offset1 "長亨科技收納系統"]
    (cond
      (= page "home") [:div.row-fluid home_pg]
      (= page "qr") [:div.row-fluid qr_pg]
      :else [:div.row-fluid no_pg])]]))

