var requiredModules = [
    "settings",
    "VimeoUpload",
    "select2",
    "jquery",
    "utils",
    "CaseModel",
    "CaseMarkdownTemplateModel",
    "trumbowyg",
    "trumbowygCleanPaste"
];

require(requiredModules, function(
    settings,
    VimeoUpload,
    select2,
    $,
    utils,
    CaseModel,
    CaseMarkdownTemplate,
    MediumEditor,
    AutoList) {
   
    var _videoFile = null;
   
    function handleFileSelected(e) {
        e.stopPropagation();
        e.preventDefault();

        var files = e.dataTransfer ? e.dataTransfer.files : $(this).get(0).files;
        _videoFile = files[0];
        
        $("#video-file-name").text(_videoFile.name);
        $("#video-info").show();
    }
    
    function uploadVideo(videoFile, caseInfo) {
        
        // TODO REMOVE WHEN UPLOAD WOKRING AGAIN
        // var promise1 = new Promise(function(resolve, reject) {
        //     caseInfo.videoId = "235614049";
        //     caseInfo.videoUrl = "https://vimeo.com/235614049";
        //     resolve(caseInfo);
        // });
        // return promise1;
        
        var promise = new Promise(function(resolve, reject) {
            
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
                    
                    caseInfo.videoId = videoId;
                    caseInfo.videoUrl = videoUrl;
                    
                    resolve(caseInfo);
                }
            });
            
            uploader.upload();
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
        
        var promise = new Promise(function(resolve, reject) {
            caseInfo
                .create(firebase)
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
    
    function handleAddCase(form, event) {
        event.preventDefault();

        $('#case-info-container').hide();
        $('#case-status-container').show();
        
        var user = firebase.auth().currentUser;
        
        var caseInfo = new CaseModel();
        caseInfo.caseId =  utils.guid(),
        caseInfo.title = $("#case-title").val(),
        caseInfo.description = $("#case-description").val();
        caseInfo.speciality = $("#case-speciality").val();
        caseInfo.complexity = $("#case-complexity").val();
        caseInfo.createdByUserId = user.uid;
        caseInfo.createdByUserFullName = user.displayName;
        
        uploadVideo(_videoFile, caseInfo)
            .then(uploadFileToGithub)
            .then(writeCaseToDatabase)
            .then(handleCaseCreationSuccess)
            .catch(function (caseInfo, error) {
                console.log("An error occurred while attempting to create the case", error);
            });
    }
    
    function handleCaseCreationSuccess(caseInfo) {
        
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
            video: "required"
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
        submitHandler: handleAddCase
    });

    var browse = document.getElementById('browse');
    browse.addEventListener('change', handleFileSelected, false);
    
    var dropZone = document.getElementById('drop_zone');
    dropZone.addEventListener('dragover', handleDragFileOver, false);
    dropZone.addEventListener('drop', handleFileSelected, false);
});