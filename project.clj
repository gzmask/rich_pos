(defproject org.clojars.gzmask/rich_pos "0.1.0-beta1"
  :description "POS"
  :url "http://richever.ca"
  :license {:name "Eclipse Public License"
            :url "http://www.eclipse.org/legal/epl-v10.html"}
  :repositories [["clojars" {:sign-releases false}]]
  :plugins [[lein-cljsbuild "0.3.2"]
            [lein-ring "0.8.5"]]
  :dependencies [[ring/ring-core "1.1.8"]
                 [ring/ring-jetty-adapter "1.1.8"]
                 [ring-mock "0.1.5"]
                 [hiccup "1.0.3"]
                 [compojure "1.1.5"]
                 [org.xerial/sqlite-jdbc "3.7.2"]
                 [org.clojure/java.jdbc "0.3.0-alpha4"]
                 [org.clojure/clojure "1.5.1"]
                 [enfocus "2.0.0-beta1"]]
  :source-paths ["src/clj"]
  :ring {:handler r0_rich.handle/app
         :auto-reload? true
         :nrepl {:start? true :port 7000}}
  :main r0_rich.handle 
  :profiles {:uberjar {:aot [r0_rich.handle]}}
  :cljsbuild{:builds [{:source-paths ["src/qr_cljs"]
                       :compiler {:output-to "resources/public/qr.js"
                                  :externs ["src/qr_cljs/r0_rich/externs.js"]
                                  :optimizations :advanced
                                  :pretty-print true}}
                      {:source-paths ["src/invoice_new_cljs"]
                       :compiler {:output-to "resources/public/invoice_new.js"
                                  :externs ["src/invoice_new_cljs/r0_rich/externs.js"]
                                  :optimizations :advanced
                                  :pretty-print true}
                       :jar true}]})
