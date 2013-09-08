(ns r0_rich.error.err-handler
  (:use ring.util.response
        r0_rich.env))

(defn err-handler []
  (file-response "error.html" {:root ERR_PAGE_ROOT}))
