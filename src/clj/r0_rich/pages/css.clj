(ns r0_rich.pages.css)

(defn css [] 
  {:headers {"Content-Type" "text/css"}
   :body "body {
            background-color: #000;
            background-repeat: no-repeat;
            background-position: 10px 50px;
            background-size: 1280px 800px;
            color: #E0771B;
            font-family: advent-Bd1;}
          .trans_bg {
            padding: 10px;
            background-color: rgba(0,0,0,0.8);
          }
          div.hidenum {
           opacity: 0.0;
           transition: opacity 1s ease;
          }
          div.hidenum:hover {
           opacity: 1.0;
          }
          #qrcode {
            color: #000;
            background-color: #fff;
            padding: 15px;
          }
          div.content {
            font-size: 20px;}
          div.navigation_bar {
            background-color: #ccc;
            font-family: advent-Re;
            font-size: 20px;
            color: #fff;}
          @font-face {
            font-family: advent-Re;
            src: url('fonts/advent-Re.otf');}
          @font-face {
            font-family: advent-Lt1;
            src: url('fonts/advent-Lt1.otf');}
          @font-face {
            font-family: advent-Bd1;
            src: url('fonts/advent-Bd1.otf');}
          i.icon-camera-retro {
            color: #000;} "})
