// Image selection Dialog
var imageSelect = {
    // possible settings
    settings: {
        iwidth:      32,
        iheight:     32,
        withName:    false,
        onselect:    null,
        onselectArg: null,
        result:      "",
        current:     null,   // current image
        parent:      $('body'),
        elemName:    "idialog_",
        zindex:      5050,
        filter:      null    // filter
    },
    translate: function (text) {
        if (typeof dui != "undefined") {
            return dui.translate (text);
        }
        return text;
    },

    _pictDir:    "img/",
    _rootDir:    null,
    _curDir:     null,
    _selectText: "",
    _cancelText: "",
    _titleText:  "",
    _dirImage:   "kde_folder.png",
    _soundImage: "sound.png",
    _curImage:   "",
    _sock:       null,

    Show:  function (options, sock) {
        var i = 0;

        imageSelect._sock = sock;

        if (this._selectText == "") {
            this._selectText = imageSelect.translate ("Select");
            this._cancelText = imageSelect.translate ("Cancel");
            this._uploadText = imageSelect.translate ("Upload");
            this._titleText  = imageSelect.translate ("Selected image: ");
        }

        if (!options.elemName || options.elemName == "") {
            options.elemName = "idialog_";
        }
        if (!options.parent) {
            options.parent = $('body');
        }

        if (document.getElementById (options.elemName) != undefined) {
            $('#'+options.elemName).remove ();
        }
        options.parent.append("<div class='dialog' id='imageSelect' title='" + this._titleText + "'></div>");
        var htmlElem = document.getElementById ("imageSelect");
        htmlElem.settings = {};
        htmlElem.settings = $.extend (htmlElem.settings, this.settings);
        htmlElem.settings = $.extend (htmlElem.settings, options);
        $(htmlElem).css({'z-index': htmlElem.settings.zindex});

        // Define dialog buttons
        var dialog_buttons = {};
        if ($(htmlElem).dropzone) {
            dialog_buttons[this._uploadText] = function() {
                $( this ).trigger('click');
            }
        }
        dialog_buttons[this._selectText] = function() {
            $( this ).dialog( "close" );

            if (this.settings.onselect)
                this.settings.onselect (imageSelect._pictDir+this.settings.result, this.settings.onselectArg);
            $( this ).remove ();
        }
        dialog_buttons[this._cancelText] = function() {
            $( this ).dialog( "close" );
            $( this ).remove ();
        }
        $(htmlElem).dialog({
            resizable: true,
            height: $(window).height(),
            modal: true,
            width: 600,
            buttons: dialog_buttons,
            close: dialog_buttons[this._cancelText]
        });

        if ($(htmlElem).dropzone) {
            $(htmlElem).dropzone({
                url: "/upload?path=./www/dashui/img/",
                acceptedFiles: "image/*",
                uploadMultiple: false,
                previewTemplate: '<div class="dz-preview dz-file-preview"><div class="dz-details"><div class="dz-filename"><span data-dz-name></span></div><br/>' +
                    '<div class="dz-size" data-dz-size></div><br/><img data-dz-thumbnail /></div><div class="dz-progress"><span class="dz-upload" data-dz-uploadprogress></span></div>' +
                    '<div class="dz-error-message"><span data-dz-errormessage></span></div></div>',
                previewsContainer: "#uploadPreview",
                clickable: true,
                dragover: function (e) {
                    var el = $(e.toElement);
                    $(e.toElement).closest("li.ui-li").addClass("upload-start");
                },
                dragleave: function (e) {
                    $(e.toElement).closest("li.ui-li").removeClass("upload-start");
                },
                drop: function (e, ui) {
                    var closest = $(e.toElement).closest("li.ui-li");
                    closest.removeClass("upload-start");

                },
                complete: function (e) {
                    if (this.element.settings.onselect) {
                        this.element.settings.onselect ("img/"+imageSelect._curDir+ e.name, this.element.settings.onselectArg);
                    }
                    $(this.element).dialog( "close" );
                    $(this.element).remove ();
                },
                init: function () {
                    this.on("processing", function() {
                        this.options.url = "/upload?path=./www/dashui/img/"+imageSelect._curDir;
                    });
                }
            });
        }
        // Show wait icon
        if (!document.getElementById ('dashui-waitico'))
            $(htmlElem).append("<p id='dashui-waitico'>Please wait...</p>");

        $('#dashui-waitico').show();
        this._rootDir = this._rootDir || "www/dashui/img/";
        this._curDir = "";
        htmlElem.settings.result = htmlElem.settings.current;
        // Find current directory
        if (htmlElem.settings.result && htmlElem.settings.result != "") {
            var str = htmlElem.settings.result;
            if (str.substring (0, this._pictDir.length) == this._pictDir) {
                str = str.substring (this._pictDir.length);
            }
            if (str.indexOf ('/') != -1) {
                var disr = str.split ("/");
                for (var z=0; z < disr.length -1; z++)
                    this._curDir += disr[z]+"/";
            }
        }

        this.getFileList (htmlElem, imageSelect._sock);
    },
    getFileList: function (htmlElem, sock) {
        // find selected image
        imageSelect._curImage = "";

        if (htmlElem.settings.result && htmlElem.settings.result != "") {
            var str = htmlElem.settings.result;
            if (str.substring (0, imageSelect._pictDir.length) == imageSelect._pictDir) {
                str = str.substring (imageSelect._pictDir.length);
            }
            if  (str.substring (0, imageSelect._curDir.length) == imageSelect._curDir) {
                str = str.substring (imageSelect._curDir.length);
                if (str.indexOf ('/') == -1) {
                    imageSelect._curImage = str;
                }
            }
        }

        // Load directory
        sock.emit('readdir', this._rootDir + this._curDir, function(dirArr) {
            imageSelect.showImages(dirArr, htmlElem);
        });
    },
    showImages: function (aImages, obj) {
        // Remove wait icon
        $('#dashui-waitico').hide ();
        obj.settings.columns = Math.floor (($(obj).width()-30) / (obj.settings.iwidth+5));
        obj.settings.rows    = Math.floor (aImages.length / obj.settings.columns) + 2;

        if (document.getElementById (obj.settings.elemName+"_tbl0")) {
            $('#'+obj.settings.elemName+"_tbl0").remove ();
        }
        if (document.getElementById (obj.settings.elemName+"_tbl1")) {
            $('#'+obj.settings.elemName+"_tbl1").remove ();
        }

        // Remove directory image and place directories first
        var bImages = new Array ();
        var j = 0;
        if (imageSelect._curDir != null && imageSelect._curDir != "") {
            bImages[j++] = "..";
        }

        for (var i = 0; i < aImages.length; i++) {
            if (aImages[i].indexOf ('.') == -1) {
                bImages[j++] = aImages[i];
            }
        }

        for (var i = 0; i < aImages.length; i++) {
            if (aImages[i].indexOf ('.') != -1 && aImages[i] != imageSelect._dirImage) {
                bImages[j++] = aImages[i];
            }
        }

        aImages = bImages;

        var sText = "<table id='"+obj.settings.elemName+"_tbl0'>";
        var row;
        var col;
        var id = 0;
        var filters = null;
        if (obj.settings.filter != null && obj.settings.filter != '') {
            filters = obj.settings.filter.split(';');
        }

        for (row = 0; row < obj.settings.rows; row++) {
            sText += "<tr>";
            var isDirs = (aImages[id].indexOf ('.') == -1);
            for (col = 0; col < obj.settings.columns; col++) {
                if (aImages.length > id) {
                    var isDir = (aImages[id].indexOf ('.') == -1) || (aImages[id] == "..");

                    // Start from new line if directories shown
                    if (isDirs && !isDir) {
                        if (col != 0) {
                            sText += "<td colspan='"+(obj.settings.columns-col)+"'></td>";
                        }
                        sText += "</tr></table><table id='"+obj.settings.elemName+"_tbl1'>";
                        break;
                    }
                    if (!isDir && filters) {
                        var isFound = false;
                        for(var i = 0; i < filters.length; i++) {
                            if (aImages[id].indexOf(filters[i]) != -1) {
                                isFound = true;
                                break;
                            }
                        }
                        if (!isFound) {
                            id++;
                            continue;
                        }
                    }

                    sText += "<td id='"+obj.settings.elemName+"_"+id+"' style='text-align: center; width:"+obj.settings.iwidth+";height:"+obj.settings.iheight+"'>";

                    if (obj.settings.withName || isDir) {
                        sText += "<table><tr><td>";
                    }

                    sText += "<img id='"+obj.settings.elemName+"_img"+id+"'";
                    // File or directory
                    if (aImages[id] == "..") {
                        sText += " src=\""+imageSelect._pictDir+imageSelect._dirImage+"\" title='"+imageSelect.translate ("Back")+"'";
                    }
                    else
                    if (isDir) {
                        sText += " src=\""+imageSelect._pictDir+imageSelect._dirImage+"\" title='"+aImages[id]+"' ";
                    }
                    else
                    if (aImages[id].indexOf(".wav") != -1 || aImages[id].indexOf(".mp3") != -1) {
                        sText += " src=\""+imageSelect._pictDir+imageSelect._soundImage+"\" title='"+aImages[id]+"' ";
                    }
                    else {
                        sText += "title='"+aImages[id]+"' ";
                    }
                    sText += " />";

                    if (obj.settings.withName || isDir) {
                        sText += "</td></tr><tr><td style='font-size:0.6em;font-weight:normal'>";
                        if (aImages[id] == "..") {
                            sText += "<span class='ui-icon ui-icon-arrowreturnthick-1-w' style='top:50%; left:50%'></span>";
                        }
                        else {
                            sText += aImages[id];
                        }
                        sText += "</td></tr></table>";
                    }
                    id++;
                    sText += "</td>";
                }
                else {
                    sText += "<td colspan='"+(obj.settings.columns-col)+"'></td>";
                    break;
                }
            }
            sText += "</tr>";
            if (id >= aImages.length) {
                break;
            }
        }

        sText += "</table>";//</div>";

        $(obj).append (sText);
        $(obj).css ({overflow: 'auto'});
        var table = $('#'+obj.settings.elemName+'_tbl0').addClass("hq-no-select");
        table.css({padding: 0, 'mapping': 0});
        table = $('#'+obj.settings.elemName+'_tbl1');
        if (table) {
            table.addClass("hq-no-select");
            table.css({padding: 0, 'mapping': 0});
        }

        obj.curElement = null;

        for (i = 0; i < aImages.length; i++) {
            var img   = $('#'+obj.settings.elemName+"_"+i);
            var image = $('#'+obj.settings.elemName+'_img'+i);
            img.addClass ("ui-state-default ui-widget-content").css({width: obj.settings.iwidth+4, height: obj.settings.iheight+4});
            img.parent = obj;
            img.result = aImages[i];
            image.parent = img;
            image.iwidth = obj.settings.iwidth;
            image.iheight = obj.settings.iheight;
            image.i = i;
            image.isLast = (i == aImages.length-1);
            img.image = image;
            if (imageSelect._curImage == aImages[i]) {
                obj.settings.curElement = img;
                img.removeClass ("ui-state-default").addClass ("ui-state-active");
            }

            if (image.isLast && obj.settings.curElement) {
                image.current = obj.settings.curElement;
            }

            image.bind ("load", {msg: image}, function (event) {
                var obj_ = event.data.msg;
                if (obj_.width() > obj_.iwidth || obj_.height() > obj_.iheight) {
                    if (obj_.width() > obj_.height()) {
                        obj_.css ({height: (obj_.height() / obj_.width())  *obj._iwidth,  width:  obj_.iwidth});
                    } else {
                        obj_.css ({width:  (obj_.width()  / obj_.height()) *obj_.iheight, height: obj_.iheight});
                    }
                }
                if (obj_.isLast && obj_.current) {
                    $(obj_.parent.parent).animate ({scrollTop: obj_.current.image.position().top + obj_.current.image.height()}, 'fast');
                }
            });
            image.error (function () {
                $(this).hide();
            });
            img.bind ("mouseenter", {msg: img}, function (event) {
                var obj = event.data.msg;
                obj.removeClass("ui-state-default").removeClass("ui-state-active").addClass("ui-state-hover");
            });
            img.bind ("mouseleave", {msg: img}, function (event) {
                var obj = event.data.msg;
                obj.removeClass("ui-state-hover");
                if (obj == obj.parent.settings.curElement) {
                    obj.addClass  ("ui-state-active");
                } else {
                    obj.addClass  ("ui-state-default");
                }
            });
            img.bind ("click", {msg: img}, function (event) {
                var obj_ = event.data.msg;
                // back directory
                if (obj_.result == "..") {
                    var dirs = imageSelect._curDir.split ('/');
                    imageSelect._curDir = "";
                    for (var t = 0; t < dirs.length - 2; t++)
                        imageSelect._curDir += dirs[t]+"/";
                    imageSelect.getFileList (obj, imageSelect._sock);
                } else if (obj_.result.indexOf ('.') == -1) {
                    imageSelect._curDir += obj_.result+"/";
                    imageSelect.getFileList (obj, imageSelect._sock);
                } else {
                    obj.settings.result = imageSelect._curDir+obj_.result;
                    if (obj.settings.curElement) {
                        obj.settings.curElement.removeClass("ui-state-active").addClass("ui-state-default");
                    }
                    obj.settings.curElement = obj_;
                    obj_.removeClass("ui-state-hover").addClass ("ui-state-active");
                    $(obj).dialog('option', 'title', imageSelect._titleText + obj.settings.result);
                }
            });
            img.bind ("dblclick", {msg: img}, function (event) {
                var obj_ = event.data.msg;
                obj.settings.result = imageSelect._pictDir + imageSelect._curDir + obj_.result;
                if (obj.settings.onselect) {
                    console.log(obj);
                    obj.settings.onselect (obj.settings.result, obj.settings.onselectArg);
                }
                $( obj ).dialog( "close" );
                $( obj ).remove ();
            });
            // If File
            if (aImages[i] != ".." && aImages[i].indexOf ('.') != -1 && aImages[i].indexOf(".wav") == -1 && aImages[i].indexOf(".mp3") == -1) {
                image.attr('src', imageSelect._pictDir+imageSelect._curDir+aImages[i]);
            }
        }
        // Show active image
        if (imageSelect._curImage != null && imageSelect._curImage != "") {
            $(obj).dialog('option', 'title', imageSelect._titleText + imageSelect._curDir + imageSelect._curImage);
        }
        else {
            $(obj).dialog('option', 'title', imageSelect._titleText + imageSelect._curDir);
        }
    },
    // Returns only file name of root directory is _pictDir or root
    GetFileName: function (path, root) {
        if (path != null && path != "") {
            if (root == undefined || root === null) {
                root = imageSelect._pictDir;
            } else if (path.length >= root.length) {
                if (path.substring(0, root.length) == root) {
                    path = path.substring (root.length);
                }
            }
        }
        return path;
    }
};
