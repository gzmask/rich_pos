(ns r0_rich.invoice_new
  (:require [enfocus.core :as ef]
            [enfocus.events :as event]
            [enfocus.effects :as effect]
            [cljs.reader :as reader])
  (:require-macros [enfocus.macros :as em]))

(defn update_total [] 
  (let [tax_doms (.getElementsByClassName js/document "price_change_with_tax")
        no_tax_doms (.getElementsByClassName js/document "price_change_without_tax")
        total-taxable (reduce + (for [dom tax_doms] (reader/read-string (ef/from dom (ef/get-prop :value)))))
        total-notaxable (reduce + (for [dom no_tax_doms] (reader/read-string (ef/from dom (ef/get-prop :value)))))
        tax-rate (reader/read-string (ef/from ["#tax_change"] (ef/get-prop :value)))
        tax-rate2 (reader/read-string (ef/from ["#tax_change2"] (ef/get-prop :value)))
        total-with-tax (+ total-taxable (* total-taxable (+ tax-rate tax-rate2)))
        total (+ total-with-tax total-notaxable)] 
    (ef/at ["#price_subtotal"] 
           (ef/set-prop :value (format "%.2f" (+ total-taxable total-notaxable))))
    (ef/at ["#price_total"] 
           (ef/set-prop :value (format "%.2f" total)))))

(ef/at [".price_change_without_tax"]
       (event/listen :change 
                     #(update_total)))

(ef/at [".price_change_with_tax"]
       (event/listen :change 
                     #(update_total)))

(ef/at ["#tax_change"]
         (event/listen :change
                       #(update_total)))

(ef/at ["#tax_change2"]
         (event/listen :change
                       #(update_total)))
