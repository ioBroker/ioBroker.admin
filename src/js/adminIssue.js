function Issue(main) {
    'use strict';
    var that = this;
    this.$dialogIssue = $('#dialog-issue');
    this.main = main;

    this.prepare = function () {
    };

    this.init = function () {
        if (this.inited) return;

        this.inited = true;

        var id = this.main.navigateGetParams();

        var adapter = this.main.objects[id];
        if (adapter && adapter.common ) {
            
        }

        var name = id.replace(/^system\.adapter\./, '');
        this.$dialogIssue.data('name', name);
        this.$dialogIssue.find('.title').html(_('Known bugs for') + ': ' + name);
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
                        dialog: 'issue',
                        params:  configId
                   });
               }, 1000);
           }
        }
    }
}