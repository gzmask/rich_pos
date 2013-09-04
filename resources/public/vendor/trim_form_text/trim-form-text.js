/**
 * need jQuery
 */
function listen_sumbmit_onclick(fn) {
    $("form :submit").click(function() {
        fn();
    });
}

function trim_form_data() {
  var texts = $("form :text");
  for (var i = 0; i < texts.length; i++) {
    texts[i].value = $.trim(texts[i].value);
  }
}

$(function() {
    listen_sumbmit_onclick(trim_form_data);
});
