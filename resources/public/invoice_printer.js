function printInvoice(ele) {
    var openWindow = window.open("", "Wenxin BnB invoice", "");
    var printable = 
          "<h1>Rich POS</h1><br /><br />" + 
          "<table style=\"width:100%; font-size: 22px;\"><tr>" + 
          "<td>client name:" + document.getElementById("client_name").value + "</td></tr><tr>" + 
          "<td style='text-align:left; width: 500px;'>client telephone:" + document.getElementById("client_telephone").value + "</td></tr><tr>" +
          "<td style='text-align:left; width: 500px;'>client address:" + document.getElementById("client_address").value + "</td></tr></table>"+
          "<br /><br />" +
          ele.previousSibling.innerHTML; 
    openWindow.document.write(printable);
    openWindow.document.close();
    openWindow.focus();
    openWindow.print();
    openWindow.close();
}
