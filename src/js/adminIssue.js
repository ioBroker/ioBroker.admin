/* global systemLang */

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

        var id = this.main.navigateGetParams();
        var name = id.replace(/^system\.adapter\./, '');

        var adapter = this.main.objects[id];
        if (adapter && adapter.common && adapter.common.extIcon) {
            var tmp = adapter.common.extIcon.split('/');
            var issue = 'https://api.github.com/repos/' + tmp[3] + "/" + tmp[4] + "/issues";
            var $table = $('#result-issue');
            $table.empty();
            var count = 0;
            $.getJSON(issue, function (data) {
                var bug = false;
                for (var i in data) {
                    if (i === "remove") {
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
                    $issueElement.find('.form-row').text(issue.body);
                    var issueDate = new Date(new Date(issue.created_at));
                    $issueElement.find('.created').text(issueDate.toLocaleDateString(systemLang, {"weekday": "short", "year": "numeric", "month": "long", "day": "2-digit", "hour": "2-digit", "minute": "2-digit", "second": "2-digit"}));
                    if (issue.labels.length > 0) {
                        for (var k in issue.labels) {
                            if (k === "remove") {
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

        that.$dialogIssue.find('.dialog-system-buttons .btn-cancel').unbind('click').click(function (e) {
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