(ns r0_rich.handle
    (:use r0_rich.view.css
          r0_rich.view.home_pg
          r0_rich.view.no_pg
          compojure.core
          ring.adapter.jetty)
    (:require [compojure.handler :as handler]
        [r0_rich.view.item.index :as item.index]
        [r0_rich.view.item.show :as item.show]
        [compojure.route :as route]))

(defroutes app-routes
  (GET "/style.css" [] (css))
  (route/resources "/")
  (GET "/" [] home_pg)
  (GET "/home" [] home_pg)
  (GET "/items" [] (item.index/show))
  (GET "/items/:id" [id] (item.show/show id))
  (route/not-found no_pg))

(def app
  (handler/site app-routes))

(defn -main []
    (run-jetty #'app {:port 3000 :join? false}))

(comment "repl: cpr - load all cpp - eval at point"
(defonce server (run-jetty #'app {:port 3000 :join? false}))
(.start server)
(.stop server))

