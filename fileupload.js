/* globals $:true */
/*!
 * jQuery Plugin for html5 file upload with drag & drop support
 *
 * @author Luis Serralheiro
 * @requires jQuery
 */
(function ($) {
  $.fn.fileUpload = function (options) {
    var that = $(this);
    var _$form;
    var _$iframe;
    var _$fileInput;
    var id = new Date().getTime() + '';

    var settings = $.extend({
      url: 'http://localhost',
      button: ".browse-btn",
      dropArea: ".drop-area",
      hoverClass: "drop-hover",
      maxSize: 30000,
      verify: function (file, verified) {
        verified();
      },
      invalid: function (file, msg) {
        window.console.log("jQuery File Upload: Invalid", file.name, msg);
      },
      success: function (xhr, file) {
        window.console.log("jQuery File Upload: Success", file.name);
      },
      failure: function (xhr, file) {
        window.console.log("jQuery File Upload: Failure", file.name);
      },
      error: function (xhr, file) {
        window.console.log("jQuery File Upload: Error", file.name);
      },
      complete: function (xhr, file) {
        window.console.log("jQuery File Upload: Complete", file.name);
      },
      mimeTypes: null, // array of supported mime types
      mimeMap: {}
    }, options);

    var getContentTypeFromExtension = function (filename) {
      if (filename && filename.indexOf(".") >= 0) {
        var mime = settings.mimeMap[filename.substring(filename.lastIndexOf(".") + 1, filename.length)];
        return mime ? mime : null;
      } else {
        return null;
      }
    };

    var _upload = function (file, useHtml5) {
      settings.verify(
        file,
        function () {
          if (useHtml5) {

            var req = new XMLHttpRequest();
            req.withCredentials = true;
            req.open('POST', settings.url, true);

            var fd = new FormData();
            fd.append("file", file);
            if (file.type === '') {
              fd.append("content-type", getContentTypeFromExtension(file.name));
            }
            req.onreadystatechange = function () {
              if (req.readyState !== 4) {
                return;
              }
              var type = Math.floor(req.status / 100);
              if (type === 2) {
                settings.success(req, file);
              } else if (type === 4) {
                settings.failure(req, file);
              } else if (type === 5) {
                settings.error(req, file);
              }
              settings.complete(req, file);
            };
            req.send(fd);

          } else {

            if (!file || file.type === '') {
              _$form.find('input[type=hidden]').val(getContentTypeFromExtension(_$fileInput.val()));
            }
            _$form.submit();
            _$form.bind('');
            $("#" + id).val('');

          }
        },
        function () {
          $("#" + id).val('');
        }
      );
    };

    var fileSelectionHandler = function (files, useHtml5) {
      if (!files) {
        _upload(null, false);
      } else {
        for (var i = 0; i < files.length; i++) {
          var file = files[i];
          if (file.type === '' || (settings.mimeTypes && $.inArray(file.type, settings.mimeTypes) === -1)) {
            settings.invalid(file, "unsupported file type");
          }
          else if (file.size > settings.maxSize) {
            settings.invalid(file, "too large");
          } else if (file.size === 0) {
            settings.invalid(file, "empty file");
          } else {
            _upload(file, useHtml5);
          }
        }
      }
    };

    var _dragOverHandler = function (e) {
      e.stopPropagation();
      e.preventDefault();
      if ($.inArray("Files", e.originalEvent.dataTransfer.types) !== -1) {
        that.addClass(settings.hoverClass);
        e.originalEvent.dataTransfer.dropEffect = 'copy';
      }
    };

    var _dragLeaveHandler = function (e) {
      e.stopPropagation();
      e.preventDefault();
      if ($.inArray("Files", e.originalEvent.dataTransfer.types) !== -1) {
        that.removeClass(settings.hoverClass);
      }
    };

    var _dropHandler = function (e) {
      e.stopPropagation();
      e.preventDefault();
      that.removeClass(settings.hoverClass);
      fileSelectionHandler(e.originalEvent.dataTransfer.files, true);
    };

    var _init = function () {
      //disable the default browser behaviour of opening the files directly
      $(document.body).on('dragover dragleave drop', function (e) {
        e.preventDefault();
      });

      _$fileInput = $('<input id="' + id + '" name="file" type="file">');
      _$form = $('<form target="hidden-iframe" action="' + settings.url + '" method="POST" enctype="multipart/form-data" style="display:none;"><input type="hidden" name="content-type"></form>');
      _$iframe = $('<iframe name="hidden-iframe" style="display:none;"></iframe>');

      _$form.append(_$fileInput);

      that.append(_$form);
      that.append(_$iframe);

      var firstLoad = !!window.mozIndexedDB || !!window.msIndexedDB;
      _$iframe.load(function () {
        if (!firstLoad) {
          settings.complete(null, {name: _$fileInput.val()});
        } else {
          firstLoad = false;
        }
      });

      that.find(settings.button).click(function () {
        document.getElementById(id).click();
      });

      document.getElementById(id).onchange = function (e) {
        fileSelectionHandler(e.target.files, false);
      };

      that.on('dragover', _dragOverHandler);
      that.on('dragleave', _dragLeaveHandler);
      that.on('drop', _dropHandler);
    };
    _init();

    return {
      setUrl: function (url) {
        _$form.attr('action', url);
        settings.url = url;
      }
    };
  };
}(jQuery));