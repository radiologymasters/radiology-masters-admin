var requiredModules = [
    "settings",
    "VimeoUpload",
    "select2",
    "jquery",
    "utils",
    "CaseModel",
    "CaseMarkdownTemplateModel",
    "VideoModel",
    "trumbowyg",
    "trumbowygCleanPaste",
    "loading"
];

require(requiredModules, function(
    settings,
    VimeoUpload,
    select2,
    $,
    utils,
    CaseModel,
    CaseMarkdownTemplate,
    VideoModel) {
   
    var _videoFile = null;
    var _caseId = null;
    var _caseInfo = null;
    var _caseInfoPanel = null;
    var _caseInfoErrorPanel = null;
    var _hasVideoChanged = false;
    var _previousVideoId = null;
   
    function handleFileSelected(e) {
        e.stopPropagation();
        e.preventDefault();
        
        var files = e.dataTransfer ? e.dataTransfer.files : $(this).get(0).files;
        _videoFile = files[0];
        
        _hasVideoChanged = true;
        _previousVideoId = _caseInfo.videoId;
        
        $("#video-file-name").text(_videoFile.name);
        $("#video-info").show();
    }
    
    function uploadVideo(videoFile, caseInfo) {

        var promise = new Promise(function(resolve, reject) {

            if (!_hasVideoChanged) {
                
                $("#video-upload-status").addClass("success");
                $("#video-upload-status .message").text("Video has not changed, skipping...");
                
                resolve(caseInfo);
                
            } else {
                
                updateUploadProgress(0);
    
                var uploader = new VimeoUpload({
                    name: caseInfo.title,
                    description: caseInfo.description,
                    private: false,
                    file: videoFile,
                    token: settings.vimeoAccessToken,
                    upgrade_to_1080: false,
                    onError: function(data) {
                        console.log("Vimeo Upload return an error", data);
                        
                        var error = JSON.parse(data).error;
                        $("#video-upload-status .error").text("An error occurred while uploading video: " + error);
                        reject(caseInfo, error);
                    },
                    onProgress: function(data) {
                        updateUploadProgress(data.loaded / data.total);
                    },
                    onComplete: function(videoId, index) {
                        var videoUrl = 'https://vimeo.com/' + videoId;
        
                        if (index > -1) {
                            /* The metadata contains all of the uploaded video(s) details see: https://developer.vimeo.com/api/endpoints/videos#/{video_id} */
                            videoUrl = this.metadata[index].link;
                        }
                        
                        $("#video-upload-status").addClass("success");
                        $("#video-upload-status .message").text("Completed successfully!");
                        
                        console.log("Video upload details", videoId, videoUrl);
                        
                        caseInfo.videoId = videoId;
                        caseInfo.videoUrl = videoUrl;
                        
                        resolve(caseInfo);
                    }
                });
                
                uploader.upload();
            }
        });
        
        return promise;
    }
    
    function updateUploadProgress(percentComplete) {
        percentComplete = Math.floor(percentComplete * 100);
        var progress = document.getElementById('progress');
        progress.setAttribute('style', 'width:' + percentComplete + '%');
        progress.innerHTML = percentComplete + '%';
    }
    
    function uploadFileToGithub(caseInfo) {
        
        console.log("uploading file to GitHub...");
        
        var promise = new Promise(function(resolve, reject) {
        
            var markdownTemplate = new CaseMarkdownTemplate();
            markdownTemplate
                .create(caseInfo)
                .then(function () {
        
                    caseInfo.markdownTemplatePath = markdownTemplate.path;
                    caseInfo.markdownTemplateSHA = markdownTemplate.SHA;
                    caseInfo.markdownTemplateUrl = markdownTemplate.url;
                
                    $("#github-write-status").addClass("success");
                    $("#github-write-status .message").text("Completed successfully!");
                    
                    resolve(caseInfo);
                
                }).catch(function (error) {
                    $("#github-write-status .error").text("An error occurred while uploading markdown template: " + error);
                    reject(caseInfo, error);
                });
        });
        
        return promise;
    }
    
    function writeCaseToDatabase(caseInfo) {
        
        console.log("Update the case in the database", caseInfo);
        
        var promise = new Promise(function(resolve, reject) {
            caseInfo
                .update(firebase)
                .then(function () {
                   
                    $("#db-write-status").addClass("success");
                    $("#db-write-status .message").text("Completed successfully!");
                     
                     resolve(caseInfo);
                })
                .catch(function (error) {
                    $("#db-write-status .error").text("An error occurred while saving the case: " + error.message);
                    
                    reject(caseInfo, error);
                });
        });
        
        return promise;
    }
    
    function handleUpdateCase(form, event) {
        event.preventDefault();

        $('#case-info-container').hide();
        $('#case-status-container').show();
        
        var user = firebase.auth().currentUser;
        
        _caseInfo.title = $("#case-title").val(),
        _caseInfo.description = $("#case-description").val();
        _caseInfo.speciality = $("#case-speciality").val();
        _caseInfo.complexity = $("#case-complexity").val();
        _caseInfo.updatedByUserId = user.uid;
        _caseInfo.updatedByUserFullName = user.displayName;
        _caseInfo.updatedTimestamp = new Date().getTime();
        
        uploadVideo(_videoFile, _caseInfo)
            .then(deleteMarkdownTemplate)
            .then(uploadFileToGithub)
            .then(writeCaseToDatabase)
            .then(deleteVideo)
            .then(handleCaseUpdated)
            .catch(function (caseInfo, error) {
                console.log("An error occurred while attempting to create the case", error);
                handleCaseError(error);
            });
    }
    
    function handleCaseUpdated(caseInfo) {
        
        setTimeout(function () {
            $('#case-status-steps').hide();
            $('#case-status-sucess').show();
        }, 1000);
    }
    
    function handleDragFileOver(e) {
        e.stopPropagation();
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    }
    
    function loadCase() {
        _caseInfo = new CaseModel();
        _caseInfo
            .load(firebase, _caseId)
            .then(handleCaseLoaded)
            .catch(handleCaseError);
    }
    
    function handleCaseLoaded() {
        $("#case-title").val(_caseInfo.title);
        $("#case-options-delete").prop("href", settings.deleteCaseUrl + _caseInfo.caseId);
        $('#case-description').trumbowyg("html", _caseInfo.description);
        $("#case-video-embed").prop("src", "https://player.vimeo.com/video/" + _caseInfo.videoId).fadeIn();
        $("#case-speciality").val(_caseInfo.speciality).trigger('change');
        $("#case-complexity").val(_caseInfo.complexity);
        $("#case-author").text(_caseInfo.createdByUserFullName);
        
        _caseInfoPanel.stopLoading();
    }
    
    function handleCaseError(error) {
        _caseInfoPanel.hide();
        
        $("#case-error").text("An error occurred while loading the requested case: " + error);
        
        _caseInfoErrorPanel.show();
    }
    
    function deleteVideo(caseInfo) {
        
        console.log("Deleting video with id: " + _previousVideoId);
        
        var deleteVideoPromise = new Promise(function(resolve, reject) {
            
            if (!_hasVideoChanged) {
                
                $("#video-delete-status").addClass("success");
                $("#video-delete-status .message").text("Video has not changed, skipping...");
                
                resolve(caseInfo);
                
            } else {
                
                var video = new VideoModel(_previousVideoId);
                video
                    .delete()
                    .then(function () {
                        
                        $("#vimeo-delete-status").addClass("success");
                        $("#vimeo-delete-status .message").text("Completed successfully!");
                        
                        resolve(caseInfo); 
                    })
                    .catch(function (error) {
                        
                        $("#vimeo-delete-status .error").text("An error occurred while deleting the previous video: " + error.message);
                        
                        reject(error); 
                    });
            }
        });
        
        return deleteVideoPromise;
    }
    
    function deleteMarkdownTemplate(caseInfo) {
        
        console.log("Deleting markdown template at path: " + caseInfo.markdownTemplatePath);
        
        var promise = new Promise(function(resolve, reject) {
            
            var markdownTemplate = new CaseMarkdownTemplate();
            markdownTemplate.caseId = caseInfo.caseId;
            markdownTemplate.path = caseInfo.markdownTemplatePath;
            markdownTemplate.SHA = caseInfo.markdownTemplateSHA;
            
            markdownTemplate
                .delete()
                .then(function () {
                    
                    console.log("Markdown template deleted.");
                    
                    $("#github-delete-status").addClass("success");
                    $("#github-delete-status .message").text("Completed successfully!");
                    
                    resolve(caseInfo);
                })
                .catch(function (error) {
                    
                    $("#github-delete-status .error").text("An error occurred while deleting the case template: " + error.message);
                    
                    reject(error); 
                });
        });
        
        return promise;
    }
    
    function setup() {
        
        _caseId = utils.getRouteParamValue(window.location.href);
        _caseInfoPanel = $("#case-info-container");
        _caseInfoErrorPanel = $("#case-info-error-container");
        _caseInfoPanel.startLoading();
        
        loadCase();
        
        $("#case-speciality").select2();
        $('#case-description').trumbowyg({
            btns: ['h1', 'h2', 'h3', 'h4', 'p', 'blockquote', 'strong', 'em', 'link', 'unorderedList', 'orderedList'],
            autogrow: true
        });
        // This will set `ignore` for all validation calls
        // NOTE: this is important because jquery validate will try to validate the MediumEditor incorrectly and error.
        $.validator.setDefaults({
          // This will ignore all hidden elements alongside `contenteditable` elements
          // that have no `name` attribute
          ignore: "[contenteditable='true']:not([name])"
        });
        
        $("form[name='add-case-form']").validate({
            rules: {
                title: "required",
                description: "required",
                video: {
                    required: function(element) {
                        return _hasVideoChanged;
                    }
                }
            },
            messages: {
                title: "Please enter a case title",
                description: "Please enter a case description",
                video: "Please select a video file to upload"
            },
            errorPlacement: function(error, element) {
                if (element.attr("name") == "video" ) {
                    error.insertAfter("#video-error");
                } else if (element.attr("id") == "case-description") {
                  error.insertAfter(".trumbowyg-box");
                } else {
                    error.insertAfter(element);
                }
            },
            submitHandler: handleUpdateCase
        });
    
        var browse = document.getElementById('browse');
        browse.addEventListener('change', handleFileSelected, false);
        
        var dropZone = document.getElementById('drop_zone');
        dropZone.addEventListener('dragover', handleDragFileOver, false);
        dropZone.addEventListener('drop', handleFileSelected, false);
        
    }
    
    setup();
});