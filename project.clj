(defproject r0-rich "0.1.0-SNAPSHOT"
  :description "FIXME: write description"
  :url "http://example.com/FIXME"
  :license {:name "Eclipse Public License"
            :url "http://www.eclipse.org/legal/epl-v10.html"}
  :plugins [[lein-cljsbuild "0.3.2"]
            [lein-ring "0.8.5"]]
  :dependencies [[ring/ring-core "1.1.8"]
                 [ring/ring-jetty-adapter "1.1.8"]
                 [hiccup "1.0.3"]
                 [prismatic/dommy "0.1.1"]
                 [compojure "1.1.5"]
                 [org.clojure/clojure "1.5.1"]]
  :source-paths ["src/clj"]
  :ring {:handler r0_rich.handle/app
         :auto-relod? true}
  :main r0_rich.handle
  :profiles {:dev {:dependencies [[ring-server "0.2.8"]
                                  [ring-mock "0.1.3"]]}}
  :cljsbuild{:builds [{:source-paths ["src/cljs"],
                       :compiler {:output-to "resources/public/app.js",
                                  :optimizations :whitespace,
                                  :pretty-print true}}]})
