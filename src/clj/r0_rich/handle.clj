(ns r0_rich.handle
    (:use r0_rich.pages.css
          r0_rich.pages.home_pg
          r0_rich.pages.no_pg
          compojure.core
          ring.adapter.jetty)
    (:require [compojure.handler :as handler]
              [ring.middleware.session :as session]
              [ring.middleware.params :as params]
              [r0_rich.item.index :as item.index]
              [r0_rich.item.show :as item.show]
              [r0_rich.item.create :as item.create]
              [r0_rich.item.update :as item.update]
              [r0_rich.item.delete :as item.delete]
              [r0_rich.session.log :as log]
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
  (GET "/items/:id/update" {{id :id} :params session :session} (item.update/update id session))
  (POST "/items/:id/change" {params :params session :session} (item.update/change params session))
  (GET "/items/:id/remove" {{id :id} :params session :session} (item.delete/remove id session))
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
