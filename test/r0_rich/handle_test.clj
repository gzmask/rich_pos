(ns r0_rich.handle_test
  (:use clojure.test
        ring.mock.request
        r0_rich.handle)
  (:require [compojure.handler :as handler]))

(deftest home-page
  (let [response (app (request :get "/"))]
    (is (= 200 
           (:status response)))
    (is (re-find #".*utf-8.*" 
           (get (:headers response) "Content-Type")))
    (is (re-find #".*長亨POS系統.*開始.*商品.*登錄.*" 
           (:body response)))))

(deftest item-page
  (let [response (app (request :get "/items"))]
    (is (= 200 
           (:status response)))
    (is (re-find #".*utf-8.*" 
           (get (:headers response) "Content-Type")))
    (is (re-find #".*長亨POS系統.*開始.*商品.*登錄.*" 
           (:body response)))))
 
(deftest log-page
  (let [response (app (request :get "/login"))]
    (is (= 200 
           (:status response)))
    (is (re-find #".*utf-8.*" 
           (get (:headers response) "Content-Type")))
    (is (re-find #".*長亨POS系統.*開始.*商品.*登錄.*" 
           (:body response)))))

(deftest no-page
  (let [response (app (request :get "/asdf"))]
    (is (= 404 
           (:status response)))
    (is (re-find #".*utf-8.*" 
           (get (:headers response) "Content-Type")))
    (is (re-find #".*長亨POS系統.*開始.*商品.*登錄.*页面不存在.*" 
           (:body response)))))

(deftest login-success
  (let [response (app {:uri "/check" 
                       :request-method :post 
                       :session nil
                       :params {"username" "daisy" "password" "123456"}})]
    (is (= 200 
           (:status response)))
    (is (re-find #".*utf-8.*" 
           (get (:headers response) "Content-Type")))
    (is (re-find #".*長亨POS系統.*開始.*商品.*登錄.*登錄成功.*" 
           (:body response)))
    (is (= nil
           (:session response)))))

(deftest login-fail
  (let [response (app {:uri "/check" 
                       :request-method :post 
                       :session nil
                       :params {"username" "daisy" "password" "123455"}})]
    (is (= 200 
           (:status response)))
    (is (re-find #".*utf-8.*" 
           (get (:headers response) "Content-Type")))
    (is (re-find #".*長亨POS系統.*開始.*商品.*登錄.*登錄失敗.*" 
           (:body response)))
    (is (= nil
           (:session response)))))
