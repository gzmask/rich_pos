(ns r0_rich.handle
  (:use compojure.core
        hiccup.core
        hiccup.page
        ring.adapter.jetty)
  (:require [compojure.handler :as handler]
            [clojure.string :as s]
            [compojure.route :as route]))

(defn css [] 
  {:headers {"Content-Type" "text/css"}
   :body "body {
            background-color: #000;
            background-repeat: no-repeat;
            background-position: 10px 50px;
            background-size: 1280px 800px;
            color: #E0771B;
            font-family: advent-Bd1;}
          .trans_bg {
            padding: 10px;
            background-color: rgba(0,0,0,0.8);
          }
          div.content {
            font-size: 20px;}
          div.navigation_bar {
            background-color: #ccc;
            font-family: advent-Re;
            font-size: 20px;
            color: #fff;}
          @font-face {
            font-family: advent-Re;
            src: url('fonts/advent-Re.otf');}
          @font-face {
            font-family: advent-Lt1;
            src: url('fonts/advent-Lt1.otf');}
          @font-face {
            font-family: advent-Bd1;
            src: url('fonts/advent-Bd1.otf');}
          i.icon-camera-retro {
            color: #000;} "})

(defn def_page [title body]
  "compose page, convert title as id"
  (list [:h2.offset1 title] 
        [:div.row-fluid {:id (str "pg_" (s/lower-case (s/replace title #"_|-|\s" "")))} 
          [:div.span10.offset1 body]]))

(defn def_nav [navs icons]
  (list [:div.span1 ""] 
        (map (fn [nav icon] 
               (list [:div.span2 [:a {:href (str (s/lower-case (s/replace nav #"_|-|\s" "")))}[(keyword (str "i." icon)) nav]]]))
             navs icons)))

(def home_pg (def_page "Home" 
               "This is Home"))
(def start_pg (def_page "Getting Start" 
                "This is Getting Start"))
(def port_pg (def_page "Portfolio" 
               "This is Portfolio"))
(def about_pg (def_page "About" 
                "This is About"))
(def no_pg (def_page "404" 
             "404 not found"))
(def nav_bar (def_nav ["Home" "Getting-Start" "Portfolio" "About"] 
                      ["icon-home" "icon-fighter-jet" "icon-folder-open" "icon-lightbulb"]))

(defn pages [page]
  "get page by pagename"
  (html5
   [:head 
    [:title "ctl testing page"]
    (include-css "/vendor/bootstrap/css/bootstrap.min.css")
    (include-css "/vendor/bootstrap/css/bootstrap-responsive.css")
    (include-css "/vendor/font-awesome/css/font-awesome.min.css")
    (include-css "/style.css")]
   [:body
    [:div.row-fluid.navigation_bar nav_bar]
    [:div.row-fluid.content [:h1.offset1 "Simple stuff"]
    (cond
      (= page "home") [:div.row-fluid.home home_pg]
      (= page "gettingstart") [:div.row-fluid.start  start_pg]
      (= page "portfolio") [:div.row-fluid.port  port_pg]
      (= page "about") [:div.row-fluid.about  about_pg]
      :else [:div.row-fluid.home no_pg])]
    (include-js "/app.js")]))

(defroutes app-routes
  (GET "/style.css" [] (css))
  (route/resources "/")
  (GET "/" [] (pages "home"))
  (GET "/:page" [page] (pages page))
  (route/not-found (pages "404")))

(def app
  (handler/site app-routes))

(defn -main []
    (run-jetty #'app {:port 3000 :join? false}))


(comment "repl: cpr - load all cpp - eval at point"
(defonce server (run-jetty #'app {:port 3000 :join? false}))
(.start server)
(.stop server)
)
