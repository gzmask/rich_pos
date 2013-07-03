(ns r0_rich.env)

(def SQLDB {:classname "org.sqlite.JDBC"
                :subprotocol "sqlite"
                :subname "resources/db/data.db"})

;no tailing '/'
(def SERVER_URL "http://prodvideo.cat.uregina.ca:3000")
