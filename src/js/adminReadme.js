/* global systemLang, showdown */

function Readme(main) {
    'use strict';

    var that           = this;
    this.$dialog       = $('#dialog-readme');
    this.$divReadme    = this.$dialog.find('.result-readme');
    this.$divChangeLog = this.$dialog.find('.result-changelog');
    this.$divLicense   = this.$dialog.find('.result-license');
    this.$divLogo      = this.$dialog.find('.result-logo');
    this.$tabs         = this.$dialog.find('.tabs');
    this.mainUrl       = '';
    this.main          = main;

    this.prepare = function () {
    };

    this.init = function () {
        if (this.inited) {
            return;
        }

        this.inited = true;

        if (!this.$tabs.data('inited')) {
            this.$tabs.data('inited', true);
            this.$tabs.mtabs();
        }

        showdown.setFlavor('github');

        var adapterName = this.main.navigateGetParams();

        var url = that.main.tabs.adapters.$tab.find('.adapter-readme-submit[data-adapter-name="' + adapterName + '"]').data('adapter-url');
        if (!url) {
            url = localStorage.getItem('original-md-url');
        }
        if (url) {
            localStorage.setItem('original-md-url', url);
            url = url.replace('https://github.com', 'https://raw.githubusercontent.com').replace('blob/', '');
            var tmp = url.split('/');
            that.mainUrl = 'https://raw.githubusercontent.com/' + tmp[3] + '/' + tmp[4] + '/master/';
            that.$dialog.find('.title').html(adapterName);
            that.$divReadme.empty();
            that.fillDiv(url);
        }

        that.$dialog.find('.dialog-system-buttons .btn-cancel').off('click').on('click', function (e) {
            e.stopPropagation();
            e.preventDefault();
            localStorage.removeItem('original-md-url');
            that.main.navigate();
        });
    };

    function md2html(data, link) {
        var html = new showdown.Converter().makeHtml(data);
        html = html.replace(/id="/g, 'id="mdid-');
        html = html.replace(/src="(?!http)/g, 'class="responsive-img" src="' + link);
        html = html.replace(/href="#/g, 'href="" class="goto-link" data-goto="#mdid-');
        html = html.replace(/href="(\S*).md/g, function (match) {
            return 'href="" class="md-link" data-url="' + that.mainUrl + match.replace('href="', '');
        });
        html = html.replace(/<!--[^>]*-->/g, '\n');
        return html.replace(/href="http/g, 'target="_blank" href="http');
    }

    function trimArr(lines) {
        var j = lines.length - 1;
        while (j >= 0 && !lines[j]) {
            j--;
        }
        if (j !== lines.length - 1) {
            lines.splice(j);
        }
        return lines;
    }

    function splitReadMe(html, link) {
        var result = {logo: '', readme: [], changeLog: [], license: []};
        var lines = html.trim().split(/\r\n|\n/);

        // second line is main title
        if (lines[2].match(/^#\sio/)) {
            lines.splice(2, 1);
        }
        if (lines[1].match(/^#\sio/)) {
            lines.splice(1, 1);
        }
        // first line is logo
        if (lines[0].match(/!\[[-_\w\d]*]\([-._\w\d\/]+\.png\)/)) {
            result.logo = link + lines[0].match(/\((.+)\)/)[1];
            lines.splice(0, 1);
        }
        var part = 'readme';
        var i = 0;
        while (i < lines.length) {
            if (lines[i].match(/^====/)) {
                i++;
                continue;
            }
            if (lines[i].match(/^###?\s+Changelog/)) {
                part = 'changeLog';
                i++;
                continue;
            } else if (lines[i].match(/^###?\s+License/)) {
                part = 'license';
                i++;
                continue;
            }
            if (!result[part].length && !lines[i]) {
                i++;
                continue;
            }
            result[part].push(lines[i]);
            i++;
        }

        if (result.logo) {
            that.$divLogo.html('<img src="' + result.logo + '" />').show();
        } else {
            that.$divLogo.html('').hide();
        }
        trimArr(result.readme);
        trimArr(result.changeLog);
        trimArr(result.license);

        if (result.readme.length) {
            result.readme = md2html(result.readme.join('\n'), link);
        } else {
            result.readme = '';
        }
        if (result.changeLog.length) {
            result.changeLog = md2html(result.changeLog.join('\n'), link);
        } else {
            delete result.changeLog;
        }
        if (result.license.length) {
            result.license[0] = '## ' + result.license[0];
            result.license = md2html(result.license.join('\n'), link);
        } else {
            delete result.license;
        }

        return result;
    }

    this.fillDiv = function (url) {
        $.get(url, function (data) {
            var orgUrl = url.replace('https://raw.githubusercontent.com', 'https://github.com').replace('/master/', '/blob/master/');
            that.$dialog.find('.dialog-system-buttons .btn-open-org').attr('href', orgUrl);
            // Split data into 3 parts: Readme, ChangeLog and License
            var parts = splitReadMe(data, url.substring(0, url.lastIndexOf('/') + 1));
            that.$divReadme.html(parts.readme);
            if (parts.changeLog) {
                that.$divChangeLog.html(parts.changeLog);
                that.$tabs.find('.tab-changelog').show();
            } else {
                that.$divChangeLog.html('');
                that.$tabs.find('.tab-changelog').hide();
            }
            if (parts.license) {
                that.$divLicense.html(parts.license);
                that.$tabs.find('.tab-license').show();
            } else {
                that.$divLicense.html('');
                that.$tabs.find('.tab-license').hide();
            }
        }).done(function () {
            that.$divReadme.on('click', '.md-link', function (e) {
                e.stopPropagation();
                e.preventDefault();
                that.fillDiv($(this).data('url'));
            });
            that.$divReadme.on('click', '.goto-link', function (e) {
                e.stopPropagation();
                e.preventDefault();
                var $elemId = $($(this).data('goto'));
                if ($elemId.length) {
                    that.$divReadme.animate({
                        scrollTop: that.$divReadme.scrollTop() - that.$divReadme.offset().top + $elemId.offset().top
                    }, 2000);
                }
            });
        });
    };

    this.destroy = function () {
        if (this.inited) {
            // this.$dialog.find('.collapsible').collapsible('destroy');
            localStorage.removeItem('original-md-url');
            this.inited = false;
        }
    };
}