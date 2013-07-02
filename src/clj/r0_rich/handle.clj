(ns r0_rich.handle
    (:use r0_rich.model
        r0_rich.view.css
        r0_rich.view.template_pg
        compojure.core
        ring.adapter.jetty)
    (:require [compojure.handler :as handler]
        [r0_rich.view.item.index :as item.index]
        [compojure.route :as route]))

(defroutes app-routes
  (GET "/style.css" [] (css))
  (route/resources "/")
  (GET "/" [] (pages "home"))
  (GET "/item/:id" [item_id] (item.index/show item_id))
  (GET "/:page" [page] (pages page))
  (route/not-found (pages "404")))

(def app
  (handler/site app-routes))

(defn -main []
    (run-jetty #'app {:port 3000 :join? false}))

(comment "repl: cpr - load all cpp - eval at point"
(defonce server (run-jetty #'app {:port 3000 :join? false}))
(.start server)
(.stop server))

