$(document).ready(function () {

    var socket;
    var path = window.location.pathname;
    var tmp = path.split('/');
    var adapter = tmp[2];
    var instance = window.location.search.slice(1);

    var id = 'system.adapter.' + adapter + '.' + instance;

    socket = io.connect();

    loadSettings();
    $('body').prepend('<div class="header ui-tabs-nav ui-widget ui-widget-header ui-corner-all" >' + adapter + '.' + instance + ' settings' +
        '<input type="button" id="save" value="save"/>' +
        '<input type="button" id="saveclose" value="save and close"/>' +
        '<input type="button" id="close" value="close"/>' +
        '</div>');

    $('input[type="button"]').button();
    $('input#save').click(function () {
        save(function (obj) {
            saveSettings(obj);
        });
    });
    $('input#saveclose').click(function () {
        save(function (obj) {
            saveSettings(obj);
            window.close();
        });
    });
    $('input#close').click(function () {
        window.close();
    });

    function saveSettings(obj) {
        socket.emit('extendObject', id, {native: obj});
    }

    function loadSettings() {
        socket.emit('getObject', id, function (err, res) {
            console.log(err, res);
            if (!err && res && res.native) {
                $('.adapter-instance').html(adapter + '.' + instance);
                $('.adapter-config').html('system.adapter.' + adapter + '.' + instance);
                if (res.common && res.common.name) $('.adapter-name').html(res.common.name);
                load(res.native);
            } else {
                alert('error loading settings for ' + id + '\n\n' + err);
            }
        });
    }

});





