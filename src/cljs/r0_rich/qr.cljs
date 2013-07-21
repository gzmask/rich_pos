(ns r0_rich.qr)

(defn makeCode []
  (let [server_qr_str (.-value (.getElementById js/document "qr_str"))
        client_qr_str (.-URL js/document)
        qrcode (js/QRCode. (.getElementById js/document "qrcode") (js-obj "width" 250 "height" 250))]
    (.makeCode qrcode client_qr_str)))

(makeCode)
