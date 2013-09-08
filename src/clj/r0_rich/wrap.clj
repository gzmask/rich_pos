(ns r0_rich.wrap 
  (:use r0_rich.error.err-handler))

(defmacro wrapped-by-try-catch
  [handler & exception-handlers]
  `(try
     ~handler
     (catch Exception e#
       (.printStackTrace e#) ;; log4c
       ~@exception-handlers)))

(defmacro wrap-error-handler
  [handler]
  `(wrapped-by-try-catch
    ~handler
    (err-handler)))

