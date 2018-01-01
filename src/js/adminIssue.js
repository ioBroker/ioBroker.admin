function Issue(main) {
    'use strict';
    var that = this;
    this.$dialogIssue = $('#dialog-issue');
    this.main = main;

    this.prepare = function () {
    };

    this.init = function () {
        if (this.inited){
            return;
        }

        this.inited = true;

        var id = this.main.navigateGetParams();
        var name = id.replace(/^system\.adapter\./, '');

        var adapter = this.main.objects[id];
        if (adapter && adapter.common && adapter.common.extIcon) {
            var tmp = adapter.common.extIcon.split('/');
            var issue = 'https://api.github.com/repos/' + tmp[3] + "/" + tmp[4] + "/issues";
            $.getJSON(issue, function (data) {
                var $table = $('#issueTable').children().clone(true, true);
                var bug = false;
                for (var i in data) {
                    if (i === "remove") {
                        break;
                    }
                    bug = true;
                    var issue = data[i];
                    var $issueElement = $('#issueTableElement').children().clone(true, true);
                    $issueElement.find('.title').text(issue.title).attr('href', issue.html_url);
                    $issueElement.find('.user').text(issue.user.login);
                    $issueElement.find('.description').text(issue.body);
                    $issueElement.find('.created').text(main.formatDate(new Date(issue.created_at), false, true));
                    if (issue.labels.length > 0) {
                        for (var k in issue.labels) {
                            if (k === "remove") {
                                break;
                            }
                            $issueElement.find('.tags').append('<a class="tag" style="background:#' + issue.labels[k].color + ';" title="' + issue.labels[k].name + '"><span>' + issue.labels[k].name + '</span></a>');
                        }
                    }

                    $table.find('.timeline').append($issueElement);
                }

                if (!bug) {
                    $table.find('.timeline').append($('<li><h2>' + _('No bug') + '</h2></li>'));
                }
                
                $('#result-issue').append($table);

            });
        }
        
        this.$dialogIssue.data('name', name);
        this.$dialogIssue.find('.title').html(_('Known bugs for') + ': ' + name);
    };

    this.allStored = function () {
        return !window.frames['config-iframe'].changed;
    };

    this.destroy = function () {
        if (this.inited) {
            this.inited = false;             
        }
    }
}