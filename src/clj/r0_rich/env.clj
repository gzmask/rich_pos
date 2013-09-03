(ns r0_rich.env)

(def SQLDB {:classname "org.sqlite.JDBC"
                :subprotocol "sqlite"
                :subname "resources/db/data.db"})

;no tailing '/'
(def SERVER_URL "http://prodvideo.cat.uregina.ca:3000")
(def PRO_PIC_FOLDER "resources/pro-pic")
(def ERR_PAGE_ROOT "public")
