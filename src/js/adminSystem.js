function System(main) {
    'use strict';
    var that = this;
    var $dialogSystem = $('#dialog-system');
    this.main = main;


    this.systemRepos  = null;
    this.systemCerts  = null;

    function string2cert(name, str) {
        if (str.length < 700 && (str.indexOf('/') !== -1 || str.indexOf('\\') !== -1)) {
            // it is a path
            return str;
        }
        // expected format: -----BEGIN CERTIFICATE-----certif...icate==-----END CERTIFICATE-----
        if (str.length < '-----BEGIN CERTIFICATE-----==-----END CERTIFICATE-----'.length) {
            showMessage(_('Invalid certificate "%s". To short.', name), true);
            return '';
        }
        var lines = [];
        if (str.substring(0, '-----BEGIN RSA PRIVATE KEY-----'.length) === '-----BEGIN RSA PRIVATE KEY-----') {
            if (str.substring(str.length -  '-----END RSA PRIVATE KEY-----'.length) !== '-----END RSA PRIVATE KEY-----') {
                showMessage(_('Certificate "%s" must end with "-----END RSA PRIVATE KEY-----".', name), true);
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
                showMessage(_('Certificate "%s" must end with "-----BEGIN PRIVATE KEY-----".', name), true);
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
                showMessage(_('Certificate "%s" must start with "-----BEGIN CERTIFICATE-----".', name), true);
                return '';
            }
            if (str.substring(str.length -  '-----END CERTIFICATE-----'.length) !== '-----END CERTIFICATE-----') {
                showMessage(_('Certificate "%s" must end with "-----END CERTIFICATE-----".', name), true);
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

    function addCert(name, text) {
        // Get data and Names
        var values = table2values('tab-system-certs');
        var ids = [];
        for (var d = 0; d < values.length; d++) {
            ids.push(values[d].name);
        }
        // Find new unique name
        var found;
        var newText = name || _('New');
        var idx = 1;
        do {
            found = ids.indexOf(newText + idx) !== -1;
            if (found) {
                idx++;
            }
        } while (found);

        values.push({name: newText + idx, certificate: text || ''});
        values2table('tab-system-certs', values);
    }

    // ----------------------------- Repositories show and Edit ------------------------------------------------
    function initRepoGrid(/* update */) {
        if (that.systemRepos && that.systemRepos.native.repositories) {
            var values = [];
            // list of the repositories
            for (var repo in that.systemRepos.native.repositories) {
                if (!that.systemRepos.native.repositories.hasOwnProperty(repo)) continue;
                var obj = that.systemRepos.native.repositories[repo];

                values.push({
                    name:    repo,
                    link:    (typeof obj === 'object') ? obj.link : obj
                });
            }

            values2table('tab-system-repo', values, {
                onChange: function (attr /* , index */) {
                    if (!attr || attr === 'name') {
                        updateRepoListSelect();
                    }
                }
            });
        } else {
            $('#tab-system-repo').html(_('permissionError'));
        }
    }

    function updateRepoListSelect() {
        var $system_activeRepo = $('#system_activeRepo');
        var selectedRepo = $system_activeRepo.val();
        var isFound = false;
        $system_activeRepo.html('');
        var data = table2values('tab-system-repo');
        for (var i = 0; i < data.length; i++) {
            $system_activeRepo.append('<option value="' + data[i].name + '">' + data[i].name + '</option>');
            if (selectedRepo === data[i].name) {
                isFound = true;
            }
        }
        if (isFound) $system_activeRepo.val(selectedRepo);
        $system_activeRepo.select();
    }

    // ----------------------------- Certificates show and Edit ------------------------------------------------
    function initCertsGrid() {
        var $dropZone = $('#tab-system-certs');
        if (that.systemCerts && that.systemCerts.native.certificates) {
            var values = [];
            // list of the repositories
            for (var cert in that.systemCerts.native.certificates) {
                if (!that.systemCerts.native.certificates.hasOwnProperty(cert)) continue;

                values.push({
                    name:        cert,
                    certificate: cert2string(that.systemCerts.native.certificates[cert])
                });
            }
            values2table('tab-system-certs', values);
        } else {
            $dropZone.html(_('permissionError'));
        }

        installFileUpload($dropZone, 10000, function (err, text) {
            if (err) {
                showMessage(err, true);
            } else {
                try {
                    text = atob(text.split(',')[1]); // string has form data:;base64,TEXT==
                } catch (err) {
                    showMessage(_('Cannot read file!'), true);
                    return;
                }
                text = text.replace(/(\r\n|\n|\r)/gm, '');
                if (text.indexOf('BEGIN RSA PRIVATE KEY') !== -1) {
                    addCert('private', text);
                } else if (text.indexOf('BEGIN PRIVATE KEY') !== -1) {
                    addCert('private', text);
                } else if (text.indexOf('BEGIN CERTIFICATE') !== -1) {
                    var m = text.split('-----END CERTIFICATE-----');
                    var count = 0;
                    for (var _m = 0; _m < m.length; _m++) {
                        if (m[_m].replace(/[\r\n]+|\n|\r/, '').trim()) count++;
                    }
                    if (count > 1) {
                        addCert('chained', text);
                    } else {
                        addCert('public', text);
                    }
                } else {
                    showMessage(_('Unknown file format!'), true);
                }
            }
        });
    }

    function updateCertListSelect() {
        // todo
    }

    function showMessage(text, isError, duration) {
        that.main.showToast($('#tab-system-certs'), text, null, duration, isError);
    }

    function initRights() {
        main.systemConfig.common.defaultNewAcl = main.systemConfig.common.defaultNewAcl || {};
        var acl = main.systemConfig.common.defaultNewAcl;

        // fill users
        var text = '';
        for (var u = 0; u < main.tabs.users.list.length; u++) {
            text += '<option value="' + main.tabs.users.list[u] + '">' + (main.objects[main.tabs.users.list[u]].common.name || main.tabs.users.list[u]) + '</option>';
        }
        $dialogSystem.find('#tab-system-acl-owner').html(text).val(acl.owner || 'system.user.admin');

        // fill groups
        text = '';
        for (u = 0; u < main.tabs.users.groups.length; u++) {
            text += '<option value="' + main.tabs.users.groups[u] + '">' + (main.objects[main.tabs.users.groups[u]].common.name || main.tabs.users.groups[u]) + '</option>';
        }
        $dialogSystem.find('#tab-system-acl-group').html(text).val(acl.ownerGroup || 'system.group.administrator');

        if (acl.object === undefined) acl.object = 0x664;

        $dialogSystem.find('#tab-system-acl-obj-owner-read') .prop('checked', acl.object & 0x400);
        $dialogSystem.find('#tab-system-acl-obj-owner-write').prop('checked', acl.object & 0x200);
        $dialogSystem.find('#tab-system-acl-obj-group-read'). prop('checked', acl.object & 0x40);
        $dialogSystem.find('#tab-system-acl-obj-group-write').prop('checked', acl.object & 0x20);
        $dialogSystem.find('#tab-system-acl-obj-every-read'). prop('checked', acl.object & 0x4);
        $dialogSystem.find('#tab-system-acl-obj-every-write').prop('checked', acl.object & 0x2);

        if (acl.state === undefined) acl.state = 0x664;

        $dialogSystem.find('#tab-system-acl-state-owner-read') .prop('checked', acl.state & 0x400);
        $dialogSystem.find('#tab-system-acl-state-owner-write').prop('checked', acl.state & 0x200);
        $dialogSystem.find('#tab-system-acl-state-group-read'). prop('checked', acl.state & 0x40);
        $dialogSystem.find('#tab-system-acl-state-group-write').prop('checked', acl.state & 0x20);
        $dialogSystem.find('#tab-system-acl-state-every-read'). prop('checked', acl.state & 0x4);
        $dialogSystem.find('#tab-system-acl-state-every-write').prop('checked', acl.state & 0x2);

        if (acl.file === undefined) acl.file = 0x664;
        $dialogSystem.find('#tab-system-acl-file-owner-read') .prop('checked', acl.file & 0x400);
        $dialogSystem.find('#tab-system-acl-file-owner-write').prop('checked', acl.file & 0x200);
        $dialogSystem.find('#tab-system-acl-file-group-read'). prop('checked', acl.file & 0x40);
        $dialogSystem.find('#tab-system-acl-file-group-write').prop('checked', acl.file & 0x20);
        $dialogSystem.find('#tab-system-acl-file-every-read'). prop('checked', acl.file & 0x4);
        $dialogSystem.find('#tab-system-acl-file-every-write').prop('checked', acl.file & 0x2);

        // workaround for materialize checkbox problem
        $dialogSystem.find('input[type="checkbox"]+span').unbind('click').click(function () {
            var $input = $(this).prev();
            if (!$input.prop('disabled')) {
                $input.prop('checked', !$input.prop('checked')).trigger('change');
            }
        });
    }

    function finishEditingRights () {
        main.systemConfig.common.defaultNewAcl = main.systemConfig.common.defaultNewAcl || {};
        var acl = main.systemConfig.common.defaultNewAcl;
        var old = JSON.stringify(acl);
        acl.object = 0;
        acl.object |= $dialogSystem.find('#tab-system-acl-obj-owner-read').prop('checked')  ? 0x400 : 0;
        acl.object |= $dialogSystem.find('#tab-system-acl-obj-owner-write').prop('checked') ? 0x200 : 0;
        acl.object |= $dialogSystem.find('#tab-system-acl-obj-group-read').prop('checked')  ? 0x40  : 0;
        acl.object |= $dialogSystem.find('#tab-system-acl-obj-group-write').prop('checked') ? 0x20  : 0;
        acl.object |= $dialogSystem.find('#tab-system-acl-obj-every-read').prop('checked')  ? 0x4   : 0;
        acl.object |= $dialogSystem.find('#tab-system-acl-obj-every-write').prop('checked') ? 0x2   : 0;

        acl.owner = $dialogSystem.find('#tab-system-acl-owner').val();
        acl.ownerGroup = $dialogSystem.find('#tab-system-acl-group').val();

        acl.state = 0;
        acl.state |= $dialogSystem.find('#tab-system-acl-state-owner-read').prop('checked')  ? 0x400 : 0;
        acl.state |= $dialogSystem.find('#tab-system-acl-state-owner-write').prop('checked') ? 0x200 : 0;
        acl.state |= $dialogSystem.find('#tab-system-acl-state-group-read').prop('checked')  ? 0x40  : 0;
        acl.state |= $dialogSystem.find('#tab-system-acl-state-group-write').prop('checked') ? 0x20  : 0;
        acl.state |= $dialogSystem.find('#tab-system-acl-state-every-read').prop('checked')  ? 0x4   : 0;
        acl.state |= $dialogSystem.find('#tab-system-acl-state-every-write').prop('checked') ? 0x2   : 0;

        acl.file = 0;
        acl.file |= $dialogSystem.find('#tab-system-acl-file-owner-read').prop('checked')  ? 0x400 : 0;
        acl.file |= $dialogSystem.find('#tab-system-acl-file-owner-write').prop('checked') ? 0x200 : 0;
        acl.file |= $dialogSystem.find('#tab-system-acl-file-group-read').prop('checked')  ? 0x40  : 0;
        acl.file |= $dialogSystem.find('#tab-system-acl-file-group-write').prop('checked') ? 0x20  : 0;
        acl.file |= $dialogSystem.find('#tab-system-acl-file-every-read').prop('checked')  ? 0x4   : 0;
        acl.file |= $dialogSystem.find('#tab-system-acl-file-every-write').prop('checked') ? 0x2   : 0;
        return old !== JSON.stringify(acl);
    }

    function requestInfo(callback) {
        that.main.socket.emit('getObject', 'system.repositories', function (errRepo, repo) {
            that.systemRepos = repo;
            that.main.socket.emit('getObject', 'system.certificates', function (errCerts, certs) {
                that.systemCerts = certs;
                that.main.socket.emit('getObject', 'system.config', function (errConfig, config) {
                    that.main.systemConfig = config;
                    callback(errRepo || errCerts || errConfig);
                });
            });
        });
    }

    function onButtonSave() {
        var common = main.systemConfig.common;
        var languageChanged   = false;
        var activeRepoChanged = false;

        finishEditingRights();

        $dialogSystem.find('.system-settings.value').each(function () {
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

        var data = table2values('tab-system-repo');
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
        common.diag = $dialogSystem.find('#diagMode').val();

        if (that.systemCerts) {
            // Fill the certificates list
            that.systemCerts.native.certificates = {};
            data = table2values('tab-system-certs');
            for (var j = 0; j < data.length; j++) {
                that.systemCerts.native.certificates[data[j].name] = string2cert(data[j].name, data[j].certificate);
            }

            $dialogSystem.find('.system-le-settings.value').each(function () {
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
                            that.main.hideBuildInWindow();
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

    this.init = function () {
        if (!main.systemConfig.error) {
            $('#button-system').click(function () {
                // request all info anew
                requestInfo(function (error) {
                    if (error) {
                        console.error(error);
                        showMessage(error, true);
                        return;
                    }
                    var $system_activeRepo = $dialogSystem.find('#system_activeRepo');
                    $system_activeRepo.html('');
                    if (that.systemRepos && that.systemRepos.native.repositories) {
                        for (var repo in that.systemRepos.native.repositories) {
                            $system_activeRepo.append('<option value="' + repo + '">' + repo + '</option>');
                        }
                    } else {
                        $dialogSystem.find('#tab-system-repo').html(_('permissionError'));
                    }

                    $dialogSystem.find('#diagMode')
                        .val(main.systemConfig.common.diag)
                        .change(function () {
                            main.socket.emit('sendToHost', main.currentHost, 'getDiagData', $(this).val(), function (obj) {
                                $dialogSystem.find('#diagSample').html(JSON.stringify(obj, null, 2));
                            });
                        })
                        .trigger('change');

                    // collect all history instances
                    var $system_defaultHistory = $dialogSystem.find('#system_defaultHistory');
                    $system_defaultHistory.html('<option value=""></option>');
                    for (var id = 0; id < main.instances.length; id++) {
                        if (main.objects[main.instances[id]].common.type === 'storage') {
                            $system_defaultHistory.append('<option value="' + main.instances[id].substring('system.adapter.'.length) + '">' + main.instances[id].substring('system.adapter.'.length) + '</option>');
                        }
                    }

                    $dialogSystem.find('.system-settings.value').each(function () {
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

                    $dialogSystem.find('.system-le-settings.value').each(function () {
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

                    var $tabs = $dialogSystem.find('#tabs-system');
                    $tabs.find('.tabs').mtabs({
                        onShow: function (tab)  {
                            if (!tab) return;
                            var id = $(tab).attr('id');
                            // Detect materialize
                            if ((id === 'tab-system-letsencrypt' || id === 'tab-system-main' || id === 'tab-system-acl') && window.M && window.M.toast) {
                                M.updateTextFields('#' + id);
                                $dialogSystem.find('select').select();
                            } else
                            if (id === 'tab-system-certs') {
                                showMessage(_('Drop the files here'));
                            }
                        }
                    });

                    that.main.showBuildInWindow($dialogSystem, that);

                    $dialogSystem.find('.dialog-system-buttons .btn-save').unbind('click').click(onButtonSave);
                    $dialogSystem.find('.dialog-system-buttons .btn-cancel').unbind('click').click(function () {
                        that.main.hideBuildInWindow();
                    });

                    initRepoGrid();
                    initRights();
                    initCertsGrid();

                    $tabs.find('.tabs').mtabs('select', 'tab-system-main');
                });
            });
        } else {
            $('#button-system').hide();
        }
    };

    this.prepare = function () {

    };
}