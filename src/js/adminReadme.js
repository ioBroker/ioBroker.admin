/* global systemLang, showdown */

function Readme(main) {
    'use strict';

    var that = this;
    this.$dialog = $('#dialog-readme');
    this.main = main;

    this.prepare = function () {
    };

    this.init = function () {
        if (this.inited) {
            return;
        }

        this.inited = true;

        var adapterName = this.main.navigateGetParams();

        var url = $('.adapter-readme-submit[data-adapter-name="' + adapterName + '"]').data('adapter-url');
        
        if (url) {
            url = url.replace('https://github.com', 'https://raw.githubusercontent.com').replace('blob/', '');
            var $div = $('#result-readme');
            $div.empty();
            $.get(url, function (data) {
                var link = url.match(/([^/]*\/){6}/);
                var html = new showdown.Converter().makeHtml(data).replace(/src="(?!http)/g, 'class="responsive-img" src="' + link[0]);
                $div.html(html);
            });

            that.$dialog.find('.title').html(adapterName);
        }

        that.$dialog.find('.dialog-system-buttons .btn-cancel').unbind('click').click(function (e) {
            e.stopPropagation();
            e.preventDefault();
            that.main.navigate();
        });

    };

    this.destroy = function () {
        if (this.inited) {
            this.$dialog.find('.collapsible').collapsible('destroy');
            this.inited = false;
        }
    };
}