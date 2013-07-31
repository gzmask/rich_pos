(ns r0_rich.handle
    (:use r0_rich.pages.css
          r0_rich.pages.home_pg
          r0_rich.pages.no_pg
          compojure.core
          ring.adapter.jetty)
    (:require [compojure.handler :as handler]
              [ring.middleware.session :as session]
              [ring.middleware.params :as params]
              [r0_rich.item.crud :as item]
              [r0_rich.item_type.crud :as item_type]
              [r0_rich.session.log :as log]
              [compojure.route :as route]))

(defroutes app-routes
  (route/resources "/")
  (GET "/style.css" [] (css))
  (GET "/" [] home_pg)
  (GET "/home" [] home_pg)
  (GET "/items" {session :session} (item/index session))
  (GET "/items/new" {session :session} (item/new session))
  (POST "/items/create" {params :params session :session} (item/create params session))
  (GET "/items/:id" {params :params session :session} (item/show (:id params) session))
  (GET "/items/:id/single_update" {{id :id} :params session :session} (item/single_update id session))
  (POST "/items/:id/single_change" {params :params session :session} (item/single_change params session))
  (GET "/items/:id/update" {{id :id} :params session :session} (item/update id session))
  (POST "/items/:id/change" {params :params session :session} (item/change params session))
  (GET "/items/:id/single_remove" {{id :id} :params session :session} (item/single_remove id session))
  (GET "/items/:plucode/remove" {{plucode :plucode} :params session :session} (item/plu_remove plucode session))
  (GET "/item_types" {session :session} (item_type/index session))
  (GET "/item_types/new" {session :session} (item_type/new session))
  (POST "/item_types/create" {params :params session :session} (item_type/create params session))
  (GET "/item_types/:id" {params :params session :session} (item_type/show (:id params) session))
  (GET "/item_types/:id/update" {{id :id} :params session :session} (item_type/update id session))
  (POST "/item_types/:id/change" {params :params session :session} (item_type/change params session))
  (GET "/item_types/:id/remove" {{id :id} :params session :session} (item_type/aremove id session))
  (GET "/login" {session :session} (log/login session))
  (GET "/logout" {session :session} (log/logout session))
  (POST "/check" {params :params session :session} (log/check (:username params) (:password params) session))
  (POST "/updateinvoice" {params :params session :session} (log/updateinvoice params session))
  (route/not-found no_pg))

(def app
  (params/wrap-params (session/wrap-session (handler/site app-routes))))

(defn -main []
    (run-jetty #'app {:port 3000 :join? false}))

(comment "repl: cpr - load all cpp - eval at point"
(defonce server (run-jetty #'app {:port 3000 :join? false}))
(.start server)
(.stop server))
