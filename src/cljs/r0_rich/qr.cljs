(ns r0_rich.qr)

(defn makeCode []
  (let [qr_str (.-value (.getElementById js/document "qr_str"))
        qrcode (js/QRCode. (.getElementById js/document "qrcode") (js-obj "width" 250 "height" 250))]
    (.makeCode qrcode qr_str)))

(makeCode)
