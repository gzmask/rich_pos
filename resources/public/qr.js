var qrcode = new QRCode(document.getElementById("qrcode"), {
	width : 250,
	height : 250
});

function makeCode () {		
    var qr_str = document.getElementById("qr_str").value;
	qrcode.makeCode(qr_str);
}
makeCode();
