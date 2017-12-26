function Config(main) {
    'use strict';
    var that = this;
    this.$dialogConfig = $('#dialog-config');
    this.$configFrame  = this.$dialogConfig.find('#config-iframe');
    this.main = main;

    this.prepare = function () {
    };

    // called from inside of iframe
    this.close = function () {
        that.$configFrame.attr('src', '');
        that.main.navigate();
    };

    this.init = function () {
        if (this.inited) return;

        this.inited = true;

        // id = 'system.adapter.NAME.X'
        $iframeDialog = this;

        var id = this.main.navigateGetParams();

        var parts = id.split('.');
        if (this.main.objects[id] && this.main.objects[id].common && this.main.objects[id].common.materialize) {
            this.$configFrame.attr('src', 'adapter/' + parts[2] + '/index_m.html?' + parts[3]);
        } else {
            this.$configFrame.attr('src', 'adapter/' + parts[2] + '/?' + parts[3]);
        }

        var name = id.replace(/^system\.adapter\./, '');
        this.$dialogConfig.data('name', name);
        this.$dialogConfig.find('.title').html(_('Adapter configuration') + ': ' + name);
    };

    this.allStored = function () {
        return !window.frames['config-iframe'].changed;
    };

    this.destroy = function () {
        if (this.inited) {
            this.inited = false;
            this.$configFrame.attr('src', '');

            // If after wizard some configurations must be shown
           if (typeof showConfig !== 'undefined' && showConfig && showConfig.length) {
               var configId = showConfig.shift();
               setTimeout(function () {
                   that.main.navigate({
                        tab:    'instances',
                        dialog: 'config',
                        params:  configId
                   });
               }, 1000);
           }
        }
    }
}