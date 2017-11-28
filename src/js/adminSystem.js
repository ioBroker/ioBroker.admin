function System(main) {
    'use strict';
    var that = this;
    var $dialogSystem = $('#dialog-system');
    var $gridRepo     = $('#grid-repos');
    var $gridCerts    = $('#grid-certs');
    var editingCerts  = [];
    var editingRepos  = [];

    this.systemRepos  = null;
    this.systemCerts  = null;

    function string2cert(name, str) {
        if (str.length < 700 && (str.indexOf('/') !== -1 || str.indexOf('\\') !== -1)) {
            // it is a path
            return str;
        }
        // expected format: -----BEGIN CERTIFICATE-----certif...icate==-----END CERTIFICATE-----
        if (str.length < '-----BEGIN CERTIFICATE-----==-----END CERTIFICATE-----'.length) {
            main.showMessage(_('Invalid certificate "%s". To short.', name));
            return '';
        }
        var lines = [];
        if (str.substring(0, '-----BEGIN RSA PRIVATE KEY-----'.length) === '-----BEGIN RSA PRIVATE KEY-----') {
            if (str.substring(str.length -  '-----END RSA PRIVATE KEY-----'.length) !== '-----END RSA PRIVATE KEY-----') {
                main.showMessage(_('Certificate "%s" must end with "-----END RSA PRIVATE KEY-----".', name), '', 'notice');
                return '';
            }
            str = str.substring('-----BEGIN RSA PRIVATE KEY-----'.length);
            str = str.substring(0, str.length - '-----END RSA PRIVATE KEY-----'.length);
            str = str.replace(/\s/g, '');
            while (str.length) {
                lines.push(str.substring(0, 64));
                str = str.substring(64);
            }
            return '-----BEGIN RSA PRIVATE KEY-----\r\n' + lines.join('\r\n') + '\r\n-----END RSA PRIVATE KEY-----\r\n';
        } else if (str.substring(0, '-----BEGIN PRIVATE KEY-----'.length) === '-----BEGIN PRIVATE KEY-----') {
            if (str.substring(str.length -  '-----END PRIVATE KEY-----'.length) !== '-----END PRIVATE KEY-----') {
                main.showMessage(_('Certificate "%s" must end with "-----BEGIN PRIVATE KEY-----".', name), '', 'notice');
                return '';
            }
            str = str.substring('-----BEGIN PRIVATE KEY-----'.length);
            str = str.substring(0, str.length - '-----END PRIVATE KEY-----'.length);
            str = str.replace(/\s/g, '');
            while (str.length) {
                lines.push(str.substring(0, 64));
                str = str.substring(64);
            }
            return '-----BEGIN PRIVATE KEY-----\r\n' + lines.join('\r\n') + '\r\n-----END PRIVATE KEY-----\r\n';
        } else {
            if (str.substring(0, '-----BEGIN CERTIFICATE-----'.length) !== '-----BEGIN CERTIFICATE-----') {
                main.showMessage(_('Certificate "%s" must start with "-----BEGIN CERTIFICATE-----".', name), '', 'notice');
                return '';
            }
            if (str.substring(str.length -  '-----END CERTIFICATE-----'.length) !== '-----END CERTIFICATE-----') {
                main.showMessage(_('Certificate "%s" must end with "-----END CERTIFICATE-----".', name), '', 'notice');
                return '';
            }
            // process chained certificates
            var parts = str.split('-----END CERTIFICATE-----');
            for (var p = parts.length - 1; p >= 0; p--) {
                if (!parts[p].replace(/[\r\n|\r|\n]+/, '').trim()) {
                    parts.splice(p, 1);
                    continue;
                }
                str = parts[p];
                str = str.substring('-----BEGIN CERTIFICATE-----'.length);
                str = str.replace(/\s/g, '');
                lines = [];
                while (str.length) {
                    lines.push(str.substring(0, 64));
                    str = str.substring(64);
                }
                parts[p] = '-----BEGIN CERTIFICATE-----\r\n' + lines.join('\r\n') + '\r\n-----END CERTIFICATE-----\r\n';
            }

            return parts.join('');
        }
    }

    function cert2string(cert) {
        return cert.replace(/(?:\\[rn]|[\r\n]+)+/g, '');
    }

    function prepareRepos() {
        $gridRepo.jqGrid({
            datatype: 'local',
            colNames: ['id', _('name'), _('link'), ''],
            colModel: [
                {name: '_id',       index: '_id',       hidden: true},
                {name: 'name',      index: 'name',      width: 60,  editable: true},
                {name: 'link',      index: 'link',      width: 300, editable: true},
                {name: 'commands',  index: 'commands',  width: 60,  editable: false, align: 'center'}
            ],
            pager: $('#pager-repos'),
            rowNum: 100,
            rowList: [20, 50, 100],
            sortname: "id",
            sortorder: "desc",
            ondblClickRow: function (rowid) {
                var id = rowid.substring('repo_'.length);
                $('.repo-edit-submit').hide();
                $('.repo-delete-submit').hide();
                $('.repo-ok-submit[data-repo-id="' + id + '"]').show();
                $('.repo-cancel-submit[data-repo-id="' + id + '"]').show();
                $gridRepo.jqGrid('editRow', rowid, {url: 'clientArray'});
                if (editingRepos.indexOf(rowid) === -1) editingRepos.push(rowid);
            },
            loadComplete: function () {
                initRepoButtons();
            },
            viewrecords: false,
            pgbuttons: false,
            pginput: false,
            pgtext: false,
            caption: _('ioBroker repositories'),
            ignoreCase: true
        }).navGrid('#pager-repos', {
            search:  false,
            edit:    false,
            add:     false,
            del:     false,
            refresh: false
        }).jqGrid('navButtonAdd', '#pager-repos', {
            caption: '',
            buttonicon: 'ui-icon-plus',
            onClickButton: function () {
                // Find last id;
                var id = 1;
                var ids = $gridRepo.jqGrid('getDataIDs');
                while (ids.indexOf('repo_' + id) !== -1) {
                    id++;
                }
                // Find new unique name
                var found;
                var newText = _("New");
                var idx = 1;
                do {
                    found = true;
                    for (var _id = 0; _id < ids.length; _id++) {
                        var obj = $gridRepo.jqGrid('getRowData', ids[_id]);
                        if (obj && obj.name === newText + idx)  {
                            idx++;
                            found = false;
                            break;
                        }
                    }
                } while (!found);

                $gridRepo.jqGrid('addRowData', 'repo_' + id, {
                    _id:     id,
                    name:    newText + idx,
                    link:    '',
                    commands:
                    '<button data-repo-id="' + id + '" class="repo-edit-submit">'   + _('edit')   + '</button>' +
                    '<button data-repo-id="' + id + '" class="repo-delete-submit">' + _('delete') + '</button>' +
                    '<button data-repo-id="' + id + '" class="repo-ok-submit" style="display:none">' + _('ok') + '</button>' +
                    '<button data-repo-id="' + id + '" class="repo-cancel-submit" style="display:none">' + _('cancel') + '</button>'
                });

                initRepoButtons();
            },
            position: 'first',
            id:       'add-repo',
            title:    _('add repository'),
            cursor:   'pointer'
        });
    }

    function addCert(name, text) {
        // Find last id;
        var id = 1;
        var ids = $gridCerts.jqGrid('getDataIDs');
        while (ids.indexOf('cert_' + id) !== -1) {
            id++;
        }
        // Find new unique name
        var found;
        var newText = name || _('New');
        var idx = 1;
        do {
            found = true;
            for (var _id = 0; _id < ids.length; _id++) {
                var obj = $gridCerts.jqGrid('getRowData', ids[_id]);
                if (obj && obj.name === newText + idx)  {
                    idx++;
                    found = false;
                    break;
                }
            }
        } while (!found);

        $gridCerts.jqGrid('addRowData', 'cert_' + id, {
            _id:         id,
            name:        newText + idx,
            certificate: text || '',
            commands:
                '<button data-cert-id="' + id + '" class="cert-edit-submit">'   + _('edit')   + '</button>' +
                '<button data-cert-id="' + id + '" class="cert-delete-submit">' + _('delete') + '</button>' +
                '<button data-cert-id="' + id + '" class="cert-ok-submit"     style="display: none">' + _('ok')     + '</button>' +
                '<button data-cert-id="' + id + '" class="cert-cancel-submit" style="display: none">' + _('cancel') + '</button>'
        });

        initCertButtons();
    }

    function prepareCerts() {
        $gridCerts.jqGrid({
            datatype: 'local',
            colNames: ['id', _('name'), _('certificate'), ''],
            colModel: [
                {name: '_id',         index: '_id',         hidden: true},
                {name: 'name',        index: 'name',        width: 60,  editable: true},
                {name: 'certificate', index: 'certificate', width: 300, editable: true},
                {name: 'commands',    index: 'commands',    width: 60,  editable: false, align: 'center'}
            ],
            pager:     $('#pager-certs'),
            rowNum:    100,
            rowList:   [20, 50, 100],
            sortname:  "id",
            sortorder: "desc",
            ondblClickRow: function (rowid) {
                var id = rowid.substring('cert_'.length);
                $('.cert-edit-submit').hide();
                $('.cert-delete-submit').hide();
                $('.cert-ok-submit[data-cert-id="' + id + '"]').show();
                $('.cert-cancel-submit[data-cert-id="' + id + '"]').show();
                $gridCerts.jqGrid('editRow', rowid, {url: 'clientArray'});
                if (editingCerts.indexOf(rowid) === -1) editingCerts.push(rowid);
            },
            loadComplete: function () {
                initCertButtons();
            },
            viewrecords: false,
            pgbuttons: false,
            pginput: false,
            pgtext: false,
            caption: _('ioBroker certificates'),
            ignoreCase: true
        }).navGrid('#pager-certs', {
            search:  false,
            edit:    false,
            add:     false,
            del:     false,
            refresh: false
        }).jqGrid('navButtonAdd', '#pager-certs', {
            caption: '',
            buttonicon: 'ui-icon-plus',
            onClickButton: function () {
                addCert();
            },
            position: 'first',
            id:       'add-cert',
            title:    _('new certificate'),
            cursor:   'pointer'
        }).jqGrid('navButtonAdd', '#pager-certs', {
            caption: '',
            buttonicon: 'ui-icon-disk',
            onClickButton: function () {
                $('#drop-file').trigger('click');
            },
            position: 'second',
            id:       'add-cert-from-file',
            title:    _('Add certificate from file'),
            cursor:   'pointer'
        });
    }

    // ----------------------------- Repositories show and Edit ------------------------------------------------
    function finishEditingRepo() {
        if (editingRepos.length) {
            $('.repo-edit-submit').show();
            $('.repo-delete-submit').show();
            $('.repo-ok-submit').hide();
            $('.repo-cancel-submit').hide();

            for (var i = 0; i < editingRepos.length; i++) {
                $gridRepo.jqGrid('saveRow', editingRepos[i], {url: 'clientArray'});
                updateRepoListSelect();
            }
            editingRepos = [];
        }
    }
    function initRepoGrid(/* update */) {
        $gridRepo.jqGrid('clearGridData');

        if (that.systemRepos && that.systemRepos.native.repositories) {
            var id = 1;
            // list of the repositories
            for (var repo in that.systemRepos.native.repositories) {
                if (!that.systemRepos.native.repositories.hasOwnProperty(repo)) continue;
                var obj = that.systemRepos.native.repositories[repo];

                $gridRepo.jqGrid('addRowData', 'repo_' + id, {
                    _id:     id,
                    name:    repo,
                    link:    (typeof that.systemRepos.native.repositories[repo] === 'object') ? that.systemRepos.native.repositories[repo].link : that.systemRepos.native.repositories[repo],
                    commands:
                        '<button data-repo-id="' + id + '" class="repo-edit-submit">'   + _('edit')   + '</button>' +
                        '<button data-repo-id="' + id + '" class="repo-delete-submit">' + _('delete') + '</button>' +
                        '<button data-repo-id="' + id + '" class="repo-ok-submit"     style="display: none">' + _('ok')     + '</button>' +
                        '<button data-repo-id="' + id + '" class="repo-cancel-submit" style="display: none">' + _('cancel') + '</button>'
                    });
                id++;
            }

            initRepoButtons();
        } else {
            $('#tab-system-repo').html(_('permissionError'));
        }

        $gridRepo.trigger('reloadGrid');
    }
    function initRepoButtons() {
        $('.repo-edit-submit').unbind('click').button({
            icons: {primary: 'ui-icon-pencil'},
            text:  false
        }).click(function () {
            var id = $(this).attr('data-repo-id');
            $('.repo-edit-submit').hide();
            $('.repo-delete-submit').hide();
            $('.repo-ok-submit[data-repo-id="' + id + '"]').show();
            $('.repo-cancel-submit[data-repo-id="' + id + '"]').show();
            $gridRepo.jqGrid('editRow', 'repo_' + id, {url: 'clientArray'});
            if (editingRepos.indexOf('repo_' + id) === -1) editingRepos.push(id);
        });

        $('.repo-delete-submit').unbind('click').button({
            icons: {primary: 'ui-icon-trash'},
            text:  false
        }).click(function () {
            var id = $(this).attr('data-repo-id');
            $gridRepo.jqGrid('delRowData', 'repo_' + id);
            updateRepoListSelect();
            var pos = editingRepos.indexOf('repo_' + id);
            if (pos !== -1) editingRepos.splice(pos, 1);
        });

        $('.repo-ok-submit').unbind('click').button({
            icons: {primary: 'ui-icon-check'},
            text:  false
        }).click(function () {
            var id = $(this).attr('data-repo-id');
            $('.repo-edit-submit').show();
            $('.repo-delete-submit').show();
            $('.repo-ok-submit').hide();
            $('.repo-cancel-submit').hide();
            $gridRepo.jqGrid('saveRow', 'repo_' + id, {"url":"clientArray"});
            updateRepoListSelect();
            var pos = editingRepos.indexOf('repo_' + id);
            if (pos !== -1) editingRepos.splice(pos, 1);
        });
        $('.repo-cancel-submit').unbind('click').button({
            icons: {primary: 'ui-icon-close'},
            text:  false
        }).click(function () {
            var id = $(this).attr('data-repo-id');
            $('.repo-edit-submit').show();
            $('.repo-delete-submit').show();
            $('.repo-ok-submit').hide();
            $('.repo-cancel-submit').hide();
            $gridRepo.jqGrid('restoreRow', 'repo_' + id, false);
            var pos = editingRepos.indexOf('repo_' + id);
            if (pos !== -1) editingRepos.splice(pos, 1);
        });
    }
    function updateRepoListSelect() {
        var $system_activeRepo = $('#system_activeRepo');
        var selectedRepo = $system_activeRepo.val();
        var isFound = false;
        $system_activeRepo.html('');
        var data = $gridRepo.jqGrid('getRowData');
        for (var i = 0; i < data.length; i++) {
            $system_activeRepo.append('<option value="' + data[i].name + '">' + data[i].name + '</option>');
            if (selectedRepo === data[i].name) {
                isFound = true;
            }
        }
        if (isFound) $system_activeRepo.val(selectedRepo);
    }

    function fileHandler(event) {
        event.preventDefault();
        var file = event.dataTransfer ? event.dataTransfer.files[0] : event.target.files[0];

        var $dz = $('#drop-zone');
        if (file.size > 10000) {
            $('#drop-text').html(_('File is too big!'));
            $dz.addClass('dropZone-error').animate({opacity: 0}, 1000, function () {
                $dz.hide().removeClass('dropZone-error').css({opacity: 1});
                main.showError(_('File is too big!'));
                $('#drop-text').html(_('Drop the files here'));
            });
            return false;
        }
        $dz.show();
        var reader = new FileReader();
        reader.onload = function (evt) {
            var text;
            try {
                text = atob(evt.target.result.split(',')[1]); // string has form data:;base64,TEXT==
            } catch(err) {
                $('#drop-text').html(_('Cannot read file!'));
                $dz.addClass('dropZone-error').animate({opacity: 0}, 1000, function () {
                    $dz.hide().removeClass('dropZone-error').css({opacity: 1});
                    main.showError(_('Cannot read file!'));
                    $('#drop-text').html(_('Drop the files here'));
                });
                return;
            }
            text = text.replace(/(\r\n|\n|\r)/gm, '');
            if (text.indexOf('BEGIN RSA PRIVATE KEY') !== -1) {
                $dz.hide();
                addCert('private', text);
            } else if (text.indexOf('BEGIN PRIVATE KEY') !== -1) {
                $dz.hide();
                addCert('private', text);
            } else if (text.indexOf('BEGIN CERTIFICATE') !== -1) {
                $dz.hide();
                var m = text.split('-----END CERTIFICATE-----');
                var count = 0;
                for (var _m = 0; _m < m.length; _m++) {
                    if (m[_m].replace(/[\r\n|\r|\n]+/, '').trim()) count++;
                }
                if (count > 1) {
                    addCert('chained', text);
                }  else {
                    addCert('public', text);
                }


            } else {
                $('#drop-text').html(_('Unknown file format!'));
                $dz.addClass('dropZone-error').animate({opacity: 0}, 1000, function () {
                    $dz.hide().removeClass('dropZone-error').css({opacity: 1});
                    main.showError(_('Unknown file format!'));
                    $('#drop-text').html(_('Drop the files here'));
                });
            }
        };
        reader.readAsDataURL(file);
    }

    // ----------------------------- Certificates show and Edit ------------------------------------------------
    function finishEditingCerts() {
        if (editingCerts.length) {
            $('.cert-edit-submit').show();
            $('.cert-delete-submit').show();
            $('.cert-ok-submit').hide();
            $('.cert-cancel-submit').hide();

            for (var i = 0; i < editingCerts.length; i++) {
                $gridCerts.jqGrid('saveRow', editingCerts[i], {url: 'clientArray'});
                updateCertListSelect();
            }
            editingCerts = [];
        }
    }
    function initCertsGrid( /* update */) {
        $gridCerts.jqGrid('clearGridData');
        if (that.systemCerts && that.systemCerts.native.certificates) {
            var id = 1;
            // list of the repositories
            for (var cert in that.systemCerts.native.certificates) {
                if (!that.systemCerts.native.certificates.hasOwnProperty(cert)) continue;

                $gridCerts.jqGrid('addRowData', 'cert_' + id, {
                    _id:         id,
                    name:        cert,
                    certificate: cert2string(that.systemCerts.native.certificates[cert]),
                    commands:
                    '<button data-cert-id="' + id + '" class="cert-edit-submit">'   + _('edit')   + '</button>' +
                    '<button data-cert-id="' + id + '" class="cert-delete-submit">' + _('delete') + '</button>' +
                    '<button data-cert-id="' + id + '" class="cert-ok-submit"     style="display:none">' + _('ok')     + '</button>' +
                    '<button data-cert-id="' + id + '" class="cert-cancel-submit" style="display:none">' + _('cancel') + '</button>'
                });
                id++;
            }

            initCertButtons();
        } else {
            $('#tab-system-certs').html(_('permissionError'));
        }

        $gridCerts.trigger('reloadGrid');

        var $dropZone = $('#tab-system-certs');
        if (typeof(window.FileReader) !== 'undefined' && !$dropZone.data('installed')) {
            $dropZone.data('installed', true);
            var $dz = $('#drop-zone');
            $('#drop-text').html(_('Drop the files here'));
            $dropZone[0].ondragover = function() {
                $dz.unbind('click');
                $dz.show();
                return false;
            };
            $dz.click(function () {
                $dz.hide();
            });

            $dz[0].ondragleave = function() {
                $dz.hide();
                return false;
            };

            $dz[0].ondrop = fileHandler;
        }

        $('#drop-file').change(fileHandler);
    }

    function initCertButtons() {
        $('.cert-edit-submit').unbind('click').button({
            icons: {primary: 'ui-icon-pencil'},
            text:  false
        }).click(function () {
            var id = $(this).attr('data-cert-id');
            $('.cert-edit-submit').hide();
            $('.cert-delete-submit').hide();
            $('.cert-ok-submit[data-cert-id="' + id + '"]').show();
            $('.cert-cancel-submit[data-cert-id="' + id + '"]').show();
            $gridCerts.jqGrid('editRow', 'cert_' + id, {url: 'clientArray'});
            if (editingCerts.indexOf('cert_' + id) === -1) {
                editingCerts.push('cert_' + id);
            }
        });

        $('.cert-delete-submit').unbind('click').button({
            icons: {primary: 'ui-icon-trash'},
            text:  false
        }).click(function () {
            var id = $(this).attr('data-cert-id');
            $gridCerts.jqGrid('delRowData', 'cert_' + id);
            updateCertListSelect();
            var pos = editingCerts.indexOf('cert_' + id);
            if (pos !== -1) editingCerts.splice(pos, 1);
        });

        $('.cert-ok-submit').unbind('click').button({
            icons: {primary: 'ui-icon-check'},
            text:  false
        }).click(function () {
            var id = $(this).attr('data-cert-id');
            $('.cert-edit-submit').show();
            $('.cert-delete-submit').show();
            $('.cert-ok-submit').hide();
            $('.cert-cancel-submit').hide();
            $gridCerts.jqGrid('saveRow', 'cert_' + id, {url: 'clientArray'});
            updateCertListSelect();
            var pos = editingCerts.indexOf('cert_' + id);
            if (pos !== -1) editingCerts.splice(pos, 1);
        });
        $('.cert-cancel-submit').unbind('click').button({
            icons: {primary: 'ui-icon-close'},
            text:  false
        }).click(function () {
            var id = $(this).attr('data-cert-id');
            $('.cert-edit-submit').show();
            $('.cert-delete-submit').show();
            $('.cert-ok-submit').hide();
            $('.cert-cancel-submit').hide();
            $gridCerts.jqGrid('restoreRow', 'cert_' + id, false);
            var pos = editingCerts.indexOf('cert_' + id);
            if (pos !== -1) editingCerts.splice(pos, 1);
        });
    }

    function updateCertListSelect() {
        // todo
    }

    function initRights() {
        main.systemConfig.common.defaultNewAcl = main.systemConfig.common.defaultNewAcl || {};
        var acl = main.systemConfig.common.defaultNewAcl;

        // fill users
        var text = '';
        for (var u = 0; u < main.tabs.users.list.length; u++) {
            text += '<option value="' + main.tabs.users.list[u] + '">' + (main.objects[main.tabs.users.list[u]].common.name || main.tabs.users.list[u]) + '</option>';
        }
        $('#tab-system-acl-owner').html(text).val(acl.owner || 'system.user.admin');

        // fill groups
        text = '';
        for (u = 0; u < main.tabs.groups.list.length; u++) {
            text += '<option value="' + main.tabs.groups.list[u] + '">' + (main.objects[main.tabs.groups.list[u]].common.name || main.tabs.groups.list[u]) + '</option>';
        }
        $('#tab-system-acl-group').html(text).val(acl.ownerGroup || 'system.group.administrator');

        if (acl.object === undefined) acl.object = 0x664;

        $('#tab-system-acl-obj-owner-read') .prop('checked', acl.object & 0x400);
        $('#tab-system-acl-obj-owner-write').prop('checked', acl.object & 0x200);
        $('#tab-system-acl-obj-group-read'). prop('checked', acl.object & 0x40);
        $('#tab-system-acl-obj-group-write').prop('checked', acl.object & 0x20);
        $('#tab-system-acl-obj-every-read'). prop('checked', acl.object & 0x4);
        $('#tab-system-acl-obj-every-write').prop('checked', acl.object & 0x2);

        if (acl.state === undefined) acl.state = 0x664;

        $('#tab-system-acl-state-owner-read') .prop('checked', acl.state & 0x400);
        $('#tab-system-acl-state-owner-write').prop('checked', acl.state & 0x200);
        $('#tab-system-acl-state-group-read'). prop('checked', acl.state & 0x40);
        $('#tab-system-acl-state-group-write').prop('checked', acl.state & 0x20);
        $('#tab-system-acl-state-every-read'). prop('checked', acl.state & 0x4);
        $('#tab-system-acl-state-every-write').prop('checked', acl.state & 0x2);

        if (acl.file === undefined) acl.file = 0x664;
        $('#tab-system-acl-file-owner-read') .prop('checked', acl.file & 0x400);
        $('#tab-system-acl-file-owner-write').prop('checked', acl.file & 0x200);
        $('#tab-system-acl-file-group-read'). prop('checked', acl.file & 0x40);
        $('#tab-system-acl-file-group-write').prop('checked', acl.file & 0x20);
        $('#tab-system-acl-file-every-read'). prop('checked', acl.file & 0x4);
        $('#tab-system-acl-file-every-write').prop('checked', acl.file & 0x2);
    }

    function finishEditingRights () {
        main.systemConfig.common.defaultNewAcl = main.systemConfig.common.defaultNewAcl || {};
        var acl = main.systemConfig.common.defaultNewAcl;
        var old = JSON.stringify(acl);
        acl.object = 0;
        acl.object |= $('#tab-system-acl-obj-owner-read').prop('checked')  ? 0x400 : 0;
        acl.object |= $('#tab-system-acl-obj-owner-write').prop('checked') ? 0x200 : 0;
        acl.object |= $('#tab-system-acl-obj-group-read').prop('checked')  ? 0x40  : 0;
        acl.object |= $('#tab-system-acl-obj-group-write').prop('checked') ? 0x20  : 0;
        acl.object |= $('#tab-system-acl-obj-every-read').prop('checked')  ? 0x4   : 0;
        acl.object |= $('#tab-system-acl-obj-every-write').prop('checked') ? 0x2   : 0;

        acl.owner = $('#tab-system-acl-owner').val();
        acl.ownerGroup = $('#tab-system-acl-group').val();

        acl.state = 0;
        acl.state |= $('#tab-system-acl-state-owner-read').prop('checked')  ? 0x400 : 0;
        acl.state |= $('#tab-system-acl-state-owner-write').prop('checked') ? 0x200 : 0;
        acl.state |= $('#tab-system-acl-state-group-read').prop('checked')  ? 0x40  : 0;
        acl.state |= $('#tab-system-acl-state-group-write').prop('checked') ? 0x20  : 0;
        acl.state |= $('#tab-system-acl-state-every-read').prop('checked')  ? 0x4   : 0;
        acl.state |= $('#tab-system-acl-state-every-write').prop('checked') ? 0x2   : 0;

        acl.file = 0;
        acl.file |= $('#tab-system-acl-file-owner-read').prop('checked')  ? 0x400 : 0;
        acl.file |= $('#tab-system-acl-file-owner-write').prop('checked') ? 0x200 : 0;
        acl.file |= $('#tab-system-acl-file-group-read').prop('checked')  ? 0x40  : 0;
        acl.file |= $('#tab-system-acl-file-group-write').prop('checked') ? 0x20  : 0;
        acl.file |= $('#tab-system-acl-file-every-read').prop('checked')  ? 0x4   : 0;
        acl.file |= $('#tab-system-acl-file-every-write').prop('checked') ? 0x2   : 0;
        return old !== JSON.stringify(acl);
    }

    this.init = function () {
        var buttons = [
            {
                text: _('Save'),
                _class: 'btn btn-active',
                click: function () {
                    var common = main.systemConfig.common;
                    var languageChanged   = false;
                    var activeRepoChanged = false;

                    finishEditingCerts();
                    finishEditingRepo();
                    finishEditingRights();

                    $('.system-settings.value').each(function () {
                        var $this = $(this);
                        var id = $this.attr('id');
                        if (!id) return;
                        id = id.substring('system_'.length);

                        if ($this.attr('type') === 'checkbox') {
                            common[id] = $this.prop('checked');
                        } else {
                            if (id === 'language'   && common.language   !== $this.val()) languageChanged   = true;
                            if (id === 'activeRepo' && common.activeRepo !== $this.val()) activeRepoChanged = true;
                            common[id] = $this.val();
                            if (id === 'isFloatComma') {
                                common[id] = (common[id] === 'true' || common[id] === true);
                            }
                        }
                    });

                    // Fill the repositories list
                    var links = {};
                    if (that.systemRepos) {
                        for (var r in that.systemRepos.native.repositories) {
                            if (that.systemRepos.native.repositories.hasOwnProperty(r) && typeof that.systemRepos.native.repositories[r] === 'object' && that.systemRepos.native.repositories[r].json) {
                                links[that.systemRepos.native.repositories[r].link] = that.systemRepos.native.repositories[r].json;
                            }
                        }
                        that.systemRepos.native.repositories = {};
                    }

                    var data = $gridRepo.jqGrid('getRowData');
                    if (that.systemRepos) {
                        var first = null;
                        for (var i = 0; i < data.length; i++) {
                            that.systemRepos.native.repositories[data[i].name] = {link: data[i].link, json: null};
                            if (links[data[i].link]) that.systemRepos.native.repositories[data[i].name].json = links[data[i].link];
                            if (!first) first = data[i].name;
                        }
                        // Check if the active repository still exist in the list
                        if (!first) {
                            if (common.activeRepo) {
                                activeRepoChanged = true;
                                common.activeRepo = '';
                            }
                        } else if (!that.systemRepos.native.repositories[common.activeRepo]) {
                            activeRepoChanged = true;
                            common.activeRepo = first;
                        }
                    }
                    common.diag = $('#diagMode').val();

                    if (that.systemCerts) {
                        // Fill the certificates list
                        that.systemCerts.native.certificates = {};
                        data = $gridCerts.jqGrid('getRowData');
                        for (var j = 0; j < data.length; j++) {
                            that.systemCerts.native.certificates[data[j].name] = string2cert(data[j].name, data[j].certificate);
                        }

                        $('.system-le-settings.value').each(function () {
                            var $this = $(this);
                            var id = $this.data('name');

                            if ($this.attr('type') === 'checkbox') {
                                that.systemCerts.native.letsEncrypt[id] = $this.prop('checked');
                            } else {
                                that.systemCerts.native.letsEncrypt[id] = $this.val();
                            }
                        });
                    }

                    main.socket.emit('extendObject', 'system.config', {common: common}, function (err) {
                        if (!err) {
                            main.socket.emit('extendObject', 'system.repositories', that.systemRepos, function () {
                                main.socket.emit('extendObject', 'system.certificates', that.systemCerts, function () {
                                    if (languageChanged) {
                                        window.location.reload();
                                    } else {
                                        var $currentTab = $dialogSystem.data('current');
                                        $dialogSystem.data('current', null);
                                        var $adminBody = main.removeNavBody();
                                        $currentTab.show().appendTo($adminBody);
                                        // $dialogSystem.dialog('close');
                                        if (activeRepoChanged) {
                                            setTimeout(function () {
                                                main.tabs.adapters.init(true);
                                            }, 0);
                                        }
                                    }
                                });
                            });
                        } else {
                            main.showError(err);
                        }
                    });
                }
            },
            {
                text: _('Cancel'),
                _class: 'btn',
                click: function () {
                    //$dialogSystem.dialog('close');
                    var $currentTab = $dialogSystem.data('current');
                    $dialogSystem.data('current', null);
                    var $adminBody = main.removeNavBody();
                    $currentTab.show().appendTo($adminBody);
                }
            }
        ];
        if (!main.systemConfig.error) {
            $('#button-system')/*.button({
                icons: {primary: 'ui-icon-gear'},
                text: false
            })*/.click(function () {
                var $system_activeRepo = $('#system_activeRepo');
                $system_activeRepo.html('');
                if (that.systemRepos && that.systemRepos.native.repositories) {
                    for (var repo in that.systemRepos.native.repositories) {
                        $system_activeRepo.append('<option value="' + repo + '">' + repo + '</option>');
                    }
                } else {
                    $('#tab-system-repo').html(_('permissionError'));
                }

                $('#diagMode')
                    .val(main.systemConfig.common.diag)
                    .change(function () {
                    main.socket.emit('sendToHost', main.currentHost, 'getDiagData', $(this).val(), function (obj) {
                        $('#diagSample').html(JSON.stringify(obj, null, 2));
                    });
                })
                    .trigger('change');

                // collect all history instances
                var $system_defaultHistory = $('#system_defaultHistory');
                $system_defaultHistory.html('<option value=""></option>');
                for (var id = 0; id < main.instances.length; id++) {
                    if (main.objects[main.instances[id]].common.type === 'storage') {
                        $system_defaultHistory.append('<option value="' + main.instances[id].substring('system.adapter.'.length) + '">' + main.instances[id].substring('system.adapter.'.length) + '</option>');
                    }
                }

                $('.system-settings.value').each(function () {
                    var $this = $(this);
                    var id = $this.attr('id');
                    if (!id) return;
                    id = id.substring('system_'.length);

                    if ($this.attr('type') === 'checkbox') {
                        $this.prop('checked', main.systemConfig.common[id]);
                    } else {
                        if (id === 'isFloatComma') {
                            $this.val(main.systemConfig.common[id] ? 'true' : 'false');
                        } else {
                            $this.val(main.systemConfig.common[id]);
                        }
                    }
                });

                if (!that.systemCerts.native.letsEncrypt) {
                    that.systemCerts.native.letsEncrypt = {
                        path: 'letsencrypt'
                    };
                }
                
                $('.system-le-settings.value').each(function () {
                    var $this = $(this);
                    var id = $this.data('name');
                    if (that.systemCerts && that.systemCerts.native.letsEncrypt) {
                        if ($this.attr('type') === 'checkbox') {
                            $this.prop('checked', that.systemCerts.native.letsEncrypt[id]);
                        } else {
                            $this.val(that.systemCerts.native.letsEncrypt[id]);
                        }
                    }
                });

                $('#tabs-system').find('.tabs').mtabs({
                    activate: function (event, ui)  {
                        if (ui.newPanel.selector === '#tab-system-certs') {
                            $('#drop-zone').show().css({opacity: 1}).animate({opacity: 0}, 2000, function () {
                                $('#drop-zone').hide().css({opacity: 1});
                            });
                        }
                    }
                });

                // $dialogSystem.dialog('open');

                var $adminBody = $('.admin-sidemenu-body');
                var $currentTab = $adminBody.find('.admin-sidemenu-body-content');
                $currentTab.hide().appendTo('body');
                $dialogSystem.show().appendTo('.admin-sidemenu-body');
                $dialogSystem.data('current', $currentTab);
                if (!$dialogSystem.find('.dialog-system-buttons').length) {
                    var $div = $('<nav class="dialog-system-buttons nav-wrapper footer"></nav>');
                    for (var b = 0; b < buttons.length; b++) {
                        $div.append($('<a class="' + (buttons[b]._class || '') + '">' + buttons[b].text + '</a>').click(buttons[b].click));
                    }
                    $dialogSystem.append($div);
                }

                if (typeof Materialize !== 'undefined') {
                    Materialize.updateTextFields();
                    $dialogSystem.find('select').material_select();
                    $('#tabs-system').mtabs('select_tab', 'tab-system-main');
                }

                ///$gridRepo.setGridHeight($(this).height() - 160).setGridWidth($(this).width() - 40);
                //$gridCerts.setGridHeight($(this).height() - 160).setGridWidth($(this).width() - 40);
            });
        } else {
            $('#button-system').hide();
        }
    };

    this.prepare = function () {
        /*var buttons = [
            {
                text: _('Save'),
                _class: 'm btn btn-active',
                click: function () {
                    var common = main.systemConfig.common;
                    var languageChanged   = false;
                    var activeRepoChanged = false;

                    finishEditingCerts();
                    finishEditingRepo();
                    finishEditingRights();

                    $('.system-settings.value').each(function () {
                        var $this = $(this);
                        var id = $this.attr('id').substring('system_'.length);

                        if ($this.attr('type') === 'checkbox') {
                            common[id] = $this.prop('checked');
                        } else {
                            if (id === 'language'   && common.language   !== $this.val()) languageChanged   = true;
                            if (id === 'activeRepo' && common.activeRepo !== $this.val()) activeRepoChanged = true;
                            common[id] = $this.val();
                            if (id === 'isFloatComma') {
                                common[id] = (common[id] === 'true' || common[id] === true);
                            }
                        }
                    });

                    // Fill the repositories list
                    var links = {};
                    if (that.systemRepos) {
                        for (var r in that.systemRepos.native.repositories) {
                            if (that.systemRepos.native.repositories.hasOwnProperty(r) && typeof that.systemRepos.native.repositories[r] === 'object' && that.systemRepos.native.repositories[r].json) {
                                links[that.systemRepos.native.repositories[r].link] = that.systemRepos.native.repositories[r].json;
                            }
                        }
                        that.systemRepos.native.repositories = {};
                    }

                    var data = $gridRepo.jqGrid('getRowData');
                    if (that.systemRepos) {
                        var first = null;
                        for (var i = 0; i < data.length; i++) {
                            that.systemRepos.native.repositories[data[i].name] = {link: data[i].link, json: null};
                            if (links[data[i].link]) that.systemRepos.native.repositories[data[i].name].json = links[data[i].link];
                            if (!first) first = data[i].name;
                        }
                        // Check if the active repository still exist in the list
                        if (!first) {
                            if (common.activeRepo) {
                                activeRepoChanged = true;
                                common.activeRepo = '';
                            }
                        } else if (!that.systemRepos.native.repositories[common.activeRepo]) {
                            activeRepoChanged = true;
                            common.activeRepo = first;
                        }
                    }
                    common.diag = $('#diagMode').val();

                    if (that.systemCerts) {
                        // Fill the certificates list
                        that.systemCerts.native.certificates = {};
                        data = $gridCerts.jqGrid('getRowData');
                        for (var j = 0; j < data.length; j++) {
                            that.systemCerts.native.certificates[data[j].name] = string2cert(data[j].name, data[j].certificate);
                        }

                        $('.system-le-settings.value').each(function () {
                            var $this = $(this);
                            var id = $this.data('name');

                            if ($this.attr('type') === 'checkbox') {
                                that.systemCerts.native.letsEncrypt[id] = $this.prop('checked');
                            } else {
                                that.systemCerts.native.letsEncrypt[id] = $this.val();
                            }
                        });
                    }

                    main.socket.emit('extendObject', 'system.config', {common: common}, function (err) {
                        if (!err) {
                            main.socket.emit('extendObject', 'system.repositories', that.systemRepos, function () {
                                main.socket.emit('extendObject', 'system.certificates', that.systemCerts, function () {
                                    if (languageChanged) {
                                        window.location.reload();
                                    } else {
                                        var $currentTab = $dialogSystem.data('current');
                                        $dialogSystem.data('current', null);
                                        var $adminBody = main.removeNavBody();
                                        $currentTab.show().appendTo($adminBody);
                                        // $dialogSystem.dialog('close');
                                        if (activeRepoChanged) {
                                            setTimeout(function () {
                                                main.tabs.adapters.init(true);
                                            }, 0);
                                        }
                                    }
                                });
                            });
                        } else {
                            main.showError(err);
                        }
                    });
                }
            },
            {
                text: _('Cancel'),
                _class: 'm btn',
                click: function () {
                    //$dialogSystem.dialog('close');
                    var $currentTab = $dialogSystem.data('current');
                    $dialogSystem.data('current', null);
                    var $adminBody = main.removeNavBody();
                    $currentTab.show().appendTo($adminBody);
                }
            }
        ];*/
        /*$dialogSystem.dialog({
            autoOpen:   false,
            modal:      true,
            width:      900,
            height:     480,
            buttons: buttons,
            open: function (event, ui) {
                $(event.target).parent().find('.ui-dialog-titlebar-close .ui-button-text').html('');
                $gridRepo.setGridHeight($(this).height() - 150).setGridWidth($(this).width() - 40);
                $gridCerts.setGridHeight($(this).height() - 150).setGridWidth($(this).width() - 40);
                initRights();
                initRepoGrid();
                initCertsGrid();
            },
            resize: function () {
                $gridRepo.setGridHeight($(this).height() - 160).setGridWidth($(this).width() - 40);
                $gridCerts.setGridHeight($(this).height() - 160).setGridWidth($(this).width() - 40);
            }
        });*/

        prepareRepos();
        prepareCerts();
    };
}