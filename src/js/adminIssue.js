/* global systemLang, showdown */

function Issue(main) {
    'use strict';

    var that = this;
    this.$dialogIssue = $('#dialog-issue');
    this.main = main;

    this.prepare = function () {
    };

    this.init = function () {
        if (this.inited) {
            return;
        }

        this.inited = true;
        
        showdown.setFlavor('github');

        var id = this.main.navigateGetParams();
        var name = id.replace(/^system\.adapter\./, '');

        var adapter = this.main.objects[id];
        if (adapter && adapter.common && adapter.common.extIcon) {
            var tmp = adapter.common.extIcon.split('/');
            var $table = that.$dialogIssue.find('#result-issue');
            $table.html(
                '<div class="loader"><svg class="spinner" width="100%" height="100%" viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg">\n' +
                '      <circle class="path" fill="none" stroke-width="6" stroke-linecap="round" cx="33" cy="33" r="30"></circle>\n' +
                '</svg></div>');
            var count = 0;

            $.getJSON('https://api.github.com/repos/' + tmp[3] + '/' + tmp[4] + '/issues', function (data) {
                var bug = false;

                $table.empty();
                for (var i in data) {
                    if (!data.hasOwnProperty(i)) continue;
                    if (i === 'remove') {
                        break;
                    }
                    var issue = data[i];
                    if (issue.hasOwnProperty('pull_request')) {
                        continue;
                    }
                    bug = true;

                    var $issueElement = $('#issueTable').children().clone(true, true);
                    $issueElement.find('.collapsible-header-title').text(issue.title);
                    $issueElement.find('.goto').attr('href', issue.html_url);
                    $issueElement.find('.user').text(issue.user.login);
                    $issueElement.find('.form-row').html(new showdown.Converter().makeHtml(issue.body).replace(/src="/g, 'class="responsive-img" src="'));
                    var issueDate = new Date(new Date(issue.created_at));
                    $issueElement.find('.created').text(issueDate.toLocaleDateString(systemLang, {'weekday': 'short', 'year': 'numeric', 'month': 'long', 'day': '2-digit', 'hour': '2-digit', 'minute': '2-digit', 'second': '2-digit'}));
                    if (issue.labels.length > 0) {
                        for (var k in issue.labels) {
                            if (!issue.labels.hasOwnProperty(k)) continue;
                            if (k === 'remove') {
                                break;
                            }
                            $issueElement.find('.category').append('<a class="btn-floating btn-small translateT" style="background:#' + issue.labels[k].color + ';" title="' + issue.labels[k].name + '"><span>' + issue.labels[k].name + '</span></a>');
                        }
                    }

                    $table.append($issueElement);
                    count++;
                }

                if (!bug) {
                    $table.append($('<li><h3 class="title">' + _('No bug') + '</h3></li>'));
                }

            }).done(that.$dialogIssue.find('.collapsible').collapsible());
        }

        that.$dialogIssue.data('name', name);
        that.$dialogIssue.find('.title').html(_('Known bugs for') + ': ' + name);
        that.$dialogIssue.find('.dialog-system-buttons .btn-add').attr('href', 'https://github.com/' + tmp[3] + '/' + tmp[4] + '/issues/new');
        that.$dialogIssue.find('.dialog-system-buttons .btn-cancel').off('click').on('click', function (e) {
            e.stopPropagation();
            e.preventDefault();
            that.main.navigate();
        });
    };

    this.destroy = function () {
        if (this.inited) {
            this.$dialogIssue.find('.collapsible').collapsible('destroy');
            this.inited = false;
        }
    };
}