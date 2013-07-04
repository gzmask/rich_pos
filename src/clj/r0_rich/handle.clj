(ns r0_rich.handle
    (:use r0_rich.view.css
          r0_rich.view.home_pg
          r0_rich.view.no_pg
          compojure.core
          ring.adapter.jetty)
    (:require [compojure.handler :as handler]
              [ring.middleware.session :as session]
              [ring.middleware.params :as params]
              [r0_rich.view.item.index :as item.index]
              [r0_rich.view.item.show :as item.show]
              [r0_rich.view.item.create :as item.create]
              [r0_rich.view.session.log :as log]
              [compojure.route :as route]))



(defroutes app-routes
  (route/resources "/")
  (GET "/style.css" [] (css))
  (GET "/" [] home_pg)
  (GET "/home" [] home_pg)
  (GET "/items" [] (item.index/index))
  (GET "/items/new" {session :session} (item.create/new session))
  (POST "/items/create" {params :params session :session} (item.create/create params session))
  (GET "/items/:id" {{id :id} :params} (item.show/show id))
  (GET "/login" {session :session} (log/login session))
  (GET "/logout" {session :session} (log/logout session))
  (POST "/check" {params :params session :session} (log/check (:username params) (:password params) session))
  (route/not-found no_pg))

(def app
  (params/wrap-params (session/wrap-session (handler/site app-routes))))

(defn -main []
    (run-jetty #'app {:port 3000 :join? false}))

(comment "repl: cpr - load all cpp - eval at point"
(defonce server (run-jetty #'app {:port 3000 :join? false}))
(.start server)
(.stop server))

