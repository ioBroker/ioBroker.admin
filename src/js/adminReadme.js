/* global systemLang, showdown */

function Readme(main) {
    'use strict';

    var that = this;
    this.$dialog = $('#dialog-readme');
    this.$readmediv = $('#result-readme');
    this.mainUrl = "";
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
        if (!url) {
            url = localStorage.getItem('original-md-url');
        }
        if (url) {
            localStorage.setItem('original-md-url', url);
            url = url.replace('https://github.com', 'https://raw.githubusercontent.com').replace('blob/', '');
            var tmp = url.split('/');
            that.mainUrl = "https://raw.githubusercontent.com/" + tmp[3] + "/" + tmp[4] + "/master/";
            that.$dialog.find('.title').html(adapterName);
            that.$readmediv.empty();
            that.fillDiv(url);
        }

        that.$dialog.find('.dialog-system-buttons .btn-cancel').off('click').on('click', function (e) {
            e.stopPropagation();
            e.preventDefault();
            localStorage.removeItem('original-md-url');
            that.main.navigate();
        });

    };

    this.fillDiv = function (url) {
        $.get(url, function (data) {
            var link = url.substring(0, url.lastIndexOf('/') + 1);
            var html = new showdown.Converter().setFlavor('github').makeHtml(data);
            html = html.replace(/id="/g, 'id="mdid-');
            html = html.replace(/src="(?!http)/g, 'class="responsive-img" src="' + link);
            html = html.replace(/href="#/g, 'href="" class="goto-link" data-goto="#mdid-');
            html = html.replace(/href="(\S*).md/g, function (match) {
                return 'href="" class="md-link" data-url="' + that.mainUrl + match.replace('href="', '');
            });
            html = html.replace(/href="http/g, 'target="_blank" href="http');
            that.$readmediv.html(html);
        }).done(function () {
            that.$readmediv.on('click', '.md-link', function (e) {
                e.stopPropagation();
                e.preventDefault();
                that.fillDiv($(this).data('url'));
            });
            that.$readmediv.on('click', '.goto-link', function (e) {
                e.stopPropagation();
                e.preventDefault();
                var $elemId = $($(this).data('goto'));
                if ($elemId.length) {
                    that.$readmediv.animate({
                        scrollTop: that.$readmediv.scrollTop() - that.$readmediv.offset().top + $elemId.offset().top
                    }, 2000);
                }

            });
        });
    };

    this.destroy = function () {
        if (this.inited) {
            this.$dialog.find('.collapsible').collapsible('destroy');
            localStorage.removeItem('original-md-url');
            this.inited = false;
        }
    };
}