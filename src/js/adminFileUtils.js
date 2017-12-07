function fileHandler(event) {
    event.preventDefault();
    var file = event.dataTransfer ? event.dataTransfer.files[0] : event.target.files[0];

    var $dz      = $(this).find('.drop-zone');
    var callback = $(this).data('drop-zone-cb');
    var limit    = $(this).data('limit');
    if (file.size > (limit || 10000)) {
        callback && callback(_('File is too big!'));
        $dz.hide();
        return false;
    }
    $dz.show();
    var reader = new FileReader();
    reader.onload = function (evt) {
        $dz.hide();
        callback && callback(null, evt.target.result);
    };
    reader.readAsDataURL(file);
}

/**
 * Install file upload on some div
 * @param {object} $dropZone is jquery object of the div (DOM element) where the drop zone must be installed
 * @param {number} limit is maximal size of file in bytes
 * @param {function} callback is callback in form function (err, fileDataBase64) {}
*/
function installFileUpload($dropZone, limit, callback) {
    if (typeof window.FileReader !== 'undefined' && !$dropZone.data('installed')) {
        $dropZone.data('installed', true);
        $dropZone.prepend('<div class="drop-zone" style="display: none"><input type="file" class="drop-file" style="display: none" /></div>');
        var $dz = $dropZone.find('.drop-zone');
        $dropZone[0].ondragover = function() {
            $dz.unbind('click');
            $dz.show();
            return false;
        };

        $dz[0].ondragleave = function() {
            $dz.hide();
            return false;
        };

        $dz[0].ondrop = fileHandler.bind($dropZone[0]);
    }
    $dropZone.data('drop-zone-cb', callback);
    $dropZone.data('limit', limit);
    $dropZone.find('.drop-file').change(fileHandler.bind($dropZone[0]));
}