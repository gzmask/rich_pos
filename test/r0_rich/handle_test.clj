(ns r0_rich.handle_test
  (:use clojure.test
        ring.mock.request
        r0_rich.handle)
  (:require [compojure.handler :as handler]))

(deftest home-page
  (let [response (app-routes (request :get "/"))]
    (is (= 200 
           (:status response)))
    (is (re-find #".*utf-8.*" 
           (get (:headers response) "Content-Type")))
    (is (re-find #".*長亨POS系統.*開始.*商品.*登錄.*" 
           (:body response)))))

(deftest item-page
  (let [response (app-routes (request :get "/items"))]
    (is (= 200 
           (:status response)))
    (is (re-find #".*utf-8.*" 
           (get (:headers response) "Content-Type")))
    (is (re-find #".*長亨POS系統.*開始.*商品.*登錄.*" 
           (:body response)))))
 
(deftest log-page
  (let [response (app-routes (request :get "/login"))]
    (is (= 200 
           (:status response)))
    (is (re-find #".*utf-8.*" 
           (get (:headers response) "Content-Type")))
    (is (re-find #".*長亨POS系統.*開始.*商品.*登錄.*" 
           (:body response)))))

(deftest no-page
  (let [response (app-routes (request :get "/asdf"))]
    (is (= 404 
           (:status response)))
    (is (re-find #".*utf-8.*" 
           (get (:headers response) "Content-Type")))
    (is (re-find #".*長亨POS系統.*開始.*商品.*登錄.*页面不存在.*" 
           (:body response)))))

(deftest login-sucess
  (let [response (app-routes {:uri "/check" 
                       :request-method :post 
                       :session nil
                       :params {"username" "daisy" "password" "123456"}})]
    (is (= 200 
           (:status response)))
    (is (re-find #".*utf-8.*" 
           (get (:headers response) "Content-Type")))
    (is (re-find #".*長亨POS系統.*開始.*商品.*登錄.*登錄成功.*" 
           (:body response)))
    (is (= true
           (:login (:session response))))))

(deftest login-fail
  (let [response (app-routes {:uri "/check" 
                       :request-method :post 
                       :session nil
                       :params {"username" "daisy" "password" "122222"}})]
    (is (= 200 
           (:status response)))
    (is (re-find #".*utf-8.*" 
           (get (:headers response) "Content-Type")))
    (is (re-find #".*長亨POS系統.*開始.*商品.*登錄.*登錄失敗.*" 
           (:body response)))
    (is (= nil
           (:session response)))))
