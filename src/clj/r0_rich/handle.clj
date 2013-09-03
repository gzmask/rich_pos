(ns r0_rich.handle 
  (:gen-class)
  (:use r0_rich.pages.css
        r0_rich.pages.home_pg
        r0_rich.pages.no_pg
        compojure.core
        ring.adapter.jetty
        r0_rich.wrap)
  (:require [compojure.handler :as handler]
            [ring.middleware.session :as session]
            [ring.middleware.params :as params]
            [ring.middleware.multipart-params :as mulparams]
            [r0_rich.item.crud :as item]
            [r0_rich.item_type.crud :as item_type]
            [r0_rich.invoice.crud :as invoice]
            [r0_rich.tax.crud :as tax]
            [r0_rich.session.log :as log]
            [compojure.route :as route]))

(defroutes app-routes
  (route/resources "/")
  (GET "/pos_bg_style.css" [] (css))
  (GET "/" [] home_pg)
  (GET "/home" [] home_pg)
  (GET "/items" {session :session} (item/index session))
  (GET "/items/new" {session :session} (item/new session))
  (mulparams/wrap-multipart-params
   (POST "/items/create" {params :params session :session}
         (wrap-error-handler
          (item/create params session))))
  (GET "/items/:id" {params :params session :session} (item/show (:id params) session))
  (GET "/items/:id/single_update" {{id :id} :params session :session} (item/single_update id session))
  (POST "/items/:id/single_change" {params :params session :session} (item/single_change params session))
  (GET "/items/:id/update" {{id :id} :params session :session} (item/update id session))
  (POST "/items/:id/change" {params :params session :session} (item/change params session))
  (GET "/items/:id/single_remove" {{id :id} :params session :session} (item/single_remove id session))
  (GET "/items/:plucode/remove" {{plucode :plucode} :params session :session} (item/plu_remove plucode session))
  (GET "/invoices" {session :session} (invoice/index session))
  (GET "/invoices/new" {session :session} (invoice/new session))
  (POST "/invoices/create" {params :params session :session} (invoice/create params session))
  (GET "/invoices/:id" {params :params session :session} (invoice/show (:id params) session))
  (GET "/invoices/:id/update" {{id :id} :params session :session} (invoice/update id session))
  (POST "/invoices/:id/change" {params :params session :session} (invoice/change params session))
  (GET "/invoices/:id/remove" {{id :id} :params session :session} (invoice/aremove id session))
  (GET "/item_types" {session :session} (item_type/index session))
  (GET "/item_types/new" {session :session} (item_type/new session))
  (POST "/item_types/create" {params :params session :session} (item_type/create params session))
  (GET "/item_types/:id" {params :params session :session} (item_type/show (:id params) session))
  (GET "/item_types/:id/update" {{id :id} :params session :session} (item_type/update id session))
  (POST "/item_types/:id/change" {params :params session :session} (item_type/change params session))
  (GET "/item_types/:id/remove" {{id :id} :params session :session} (item_type/aremove id session))
  (GET "/taxs" {session :session} (tax/index session))
  (GET "/taxs/new" {session :session} (tax/new session))
  (POST "/taxs/create" {params :params session :session} (tax/create params session))
  (GET "/taxs/:id/remove" {{id :id} :params session :session} (tax/remove id session))
  (GET "/taxs/:id" {params :params session :session} (tax/show (:id params) session))
  (GET "/taxs/:id/update" {{id :id} :params session :session} (tax/update id session))
  (POST "/taxs/:id/change" {params :params session :session} (tax/change params session))

  (GET "/login" {session :session} (log/login session))
  (GET "/logout" {session :session} (log/logout session))
  (POST "/check" {params :params session :session} (log/check (:username params) (:password params) session))
  (POST "/updateinvoice" {params :params session :session} (log/updateinvoice params session))
  (route/not-found no_pg))

(def app
  (-> (handler/site app-routes)
      session/wrap-session))

(defn -main []
    (run-jetty #'app {:port 3000 :join? false}))

(comment "repl: cpr - load all cpp - eval at point"
(defonce server (run-jetty #'app {:port 3000 :join? false}))
(.start server)
(.stop server))
