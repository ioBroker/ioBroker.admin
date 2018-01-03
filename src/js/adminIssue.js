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
            var $table = $('#result-issue');
            $table.empty();
            var count = 0;
            $.getJSON(issue, function (data) {                
                var bug = false;
                for (var i in data) {
                    if (i === "remove") {
                        break;
                    }
                    bug = true;
                    var issue = data[i];
                    var $issueElement = $('#issueTable').children().clone(true, true);
                    if(count === 0){
                        $issueElement.find('li').addClass('active');
                    }
                    $issueElement.find('.collapsible-header-title').text(issue.title);
                    $issueElement.find('.goto').attr('href', issue.html_url);
                    $issueElement.find('.user').text(issue.user.login);
                    $issueElement.find('.form-row').text(issue.body);
                    $issueElement.find('.created').text(main.formatDate(new Date(issue.created_at), false, true));
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
                    $table.append($('<li><h2>' + _('No bug') + '</h2></li>'));
                }

            });
        }
        
        that.$dialogIssue.data('name', name);
        that.$dialogIssue.find('.title').html(_('Known bugs for') + ': ' + name);
        
        var $collapsible = that.$dialogIssue.find('.collapsible');
        $collapsible.collapsible();
        
    };

    this.destroy = function () {
        if (this.inited) {
            this.$dialogIssue.find('.collapsible').collapsible('destroy')
            this.inited = false;             
        }
    }
}