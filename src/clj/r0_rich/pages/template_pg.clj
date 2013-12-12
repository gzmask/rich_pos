(ns r0_rich.pages.template_pg
    (:use hiccup.page
          hiccup.core
          hiccup.util)
    (:require [clojure.string :as s]))


(defn def_nav [names ids icons]
  (list [:div.span1 ""] 
        (map (fn [name id icon] 
               (list [:div.span1 {:id (s/replace id #"_|-|\/|\s" "")}[:a {:href (str (s/lower-case id) "#" (s/replace id #"_|-|\/|\s" ""))}[:i {:class icon} name]]]))
             names ids icons)))

(def nav_bar (def_nav ["開始" "商品" "种类" "税种" "历史" "结帐" "会员"] 
                       ["/home" "/items" "/item_types" "/taxs"  "/invoices" "/invoices/new" "/login"]
                       ["icon-home" "icon-home" "icon-home" "icon-home" "icon-home" "icon-home" "icon-home"]))

(defn include
  "Include js or css file"
  [& files]
  (for [f files]
    (if (.endsWith f "js")
      [:script {:type "text/javascript" :src (to-uri f)}]
      [:link {:type "text/css" :href (to-uri f) :rel "stylesheet"}])))

(defn pages [page & include-files]
  "get page by pagename"
  (html5
   [:head 
    [:title "長亨POS系統"]
    (if include-files
      (apply include include-files))]
    (include-css "/vendor/bootstrap/css/bootstrap.min.css")
    (include-css "/vendor/bootstrap/css/bootstrap-responsive.css")
    (include-css "/vendor/font-awesome/css/font-awesome.min.css")
    (include-css "/pos_style.css")
   [:body
    [:div.row-fluid.navigation_bar nav_bar]
    [:div.row-fluid.content [:h1.offset1 "長亨POS系統"]
      [:div.row-fluid page]]]))

