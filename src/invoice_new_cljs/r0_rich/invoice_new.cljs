(ns r0_rich.invoice_new
  (:require [enfocus.core :as ef]
            [enfocus.events :as event]
            [enfocus.effects :as effect]
            [cljs.reader :as reader])
  (:require-macros [enfocus.macros :as em]))

(defn change_total [doms] 
  (let [total (reduce + (for [dom doms] (reader/read-string (ef/from dom (ef/get-prop :value)))))
        ] 
    (ef/at ["#price_total"] 
           (ef/set-prop :value total))))

(let [price_doms (.getElementsByClassName js/document "price_change")] 
  (doseq [price_dom price_doms] 
    (ef/at price_dom 
           (event/listen :change 
                         #(change_total price_doms)))))

(defn change_tax [dom]
  (let [total (reader/read-string (ef/from ["#price_total"] (ef/get-prop :value)))
        tax-rate (reader/read-string (ef/from dom (ef/get-prop :value)))
        total-with-tax (+ total (* total tax-rate))]
    (ef/at ["#price_total"] 
           (ef/set-prop :value total-with-tax))))

(let [tax_dom (.getElementById js/document "tax_change")]
  (ef/at tax_dom
         (event/listen :change
                       #(change_tax tax_dom))))
