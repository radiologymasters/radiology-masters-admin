require(["settings", "dynatable", "jquery", "VideoModel","CaseMarkdownTemplateModel", "CaseModel", "loading"],
 function(settings, dynatable, $, Video, CaseMarkdownTemplate, Case) {
    
    var _container = $("#case-info-container");
    var _table = $("#cases-table");
    var _tbody = _table.find("tbody");
    var _cases = [];

    _container.startLoading();
    
    function loadAllDraftCases() {
         var promise = new Promise(function(resolve, reject) {
            firebase
                .database()
                .ref('/cases')
                .once('value')
                .then(function(data) {
                    var cases = data.val();
                    var unpublishedCases = filterUnpublishedCases(cases);
                    resolve(unpublishedCases);
                });
        });
        return promise;
    }

    function filterUnpublishedCases(cases) {
        var unpublishedCases = [];

        for(var caseId in cases) {
            var caseInfo = cases[caseId];
            
            if (caseInfo.hasOwnProperty("isPublished") && !caseInfo.isPublished) {
                unpublishedCases.push(caseInfo);
            }
        }

        return unpublishedCases;
    }

    function updateCaseVideoProcessingStatuses() {
        var videos = _table.find(".video-info");

        videos.each(function(index) {
            var videoInfoSpan = $(this);
            var videoId = videoInfoSpan.data("video-id");
            var previousProcessingStatus = videoInfoSpan.data("video-processing-status");
            var caseId = videoInfoSpan.data("case-id");
            var processingStatusText = $(".video-" + videoId + "-processing-status .processing-status-text");

            // check if the video processing status is already "available" and therefore been checked before
            // and do not check again to avoid rate limiting on the Vimeo API.
            if (previousProcessingStatus && previousProcessingStatus === "available") {
                console.log("Video processing status has already been derived and is awaiting publishing, skipping processing status check.");
                return;
            }

            console.log("Getting processing status for video", videoId);

            var video = new Video(videoId);
            video.getProcessingStatus().then(function (processingStatus) { 
                
                videoInfoSpan.data("video-processing-status", processingStatus);
                var statusText = "Processing video"

                // check if the video thumbnails have been generated
                if (processingStatus === "available") {

                    statusText = "Ready to publish";
                    // allow the case to be published by showing the publish button
                    var publishButton = $(".publish-case-" + caseId);
                    publishButton.show();
                }

                processingStatusText.text(statusText);
                
            }); 
        });

        setTimeout(updateCaseVideoProcessingStatuses, settings.videoProcessingStatusPollIntervalInMilliseconds);
    }

    function publishCase(e) {
        e.preventDefault();

        $(this).hide();

        var caseId = $(this).data("case-id");
        
        var caseVideoInfo = _cases.filter(function(obj) {
            return obj.caseId === caseId;
        })[0];

        var processingStatusText = $(".video-" + caseVideoInfo.videoId + "-processing-status .processing-status-text");
        var processingStatusSpinner = $(".video-" + caseVideoInfo.videoId + "-processing-status .processing-status-spinner");
        
        processingStatusText.addClass("in-progress").text("Publishing");
        processingStatusSpinner.show();

        var caseInfo = new Case();
        caseInfo.load(firebase, caseId).then(function () {

            console.log("Publishing case info", caseInfo);

            var video = new Video(caseVideoInfo.videoId);
            video.getThumbnails().then(function(thumbnails) {

                caseInfo.videoThumbnailLarge = thumbnails.largeUrl;
                caseInfo.videoThumbnailMedium = thumbnails.mediumUrl;
                caseInfo.videoThumbnailSmall = thumbnails.smallUrl;

                deleteMarkdownTemplate(caseInfo)
                    .then(uploadFileToGithub)
                    .then(deleteVideo) 
                    .then(updateCase);
            });
        });
    }

    function updateCase(caseInfo) {
        
        var model = new Case();
        model.load(firebase, caseInfo.caseId).then(function () {

            model.videoThumbnailLarge = caseInfo.videoThumbnailLarge;
            model.videoThumbnailMedium = caseInfo.videoThumbnailMedium;
            model.videoThumbnailSmall = caseInfo.videoThumbnailSmall;
            model.markdownTemplatePath = caseInfo.markdownTemplatePath;
            model.markdownTemplateSHA = caseInfo.markdownTemplateSHA;
            model.markdownTemplateUrl = caseInfo.markdownTemplateUrl;
            model.previousVideoId = caseInfo.previousVideoId;

            // Mark as published.
            model.isPublished = true;

            var user = firebase.auth().currentUser;
            model.updatedByUserId = user.uid;
            model.updatedByUserFullName = user.displayName;
            model.updatedTimestamp = new Date().getTime();

            model.update(firebase).then(function () {
                
                var processingStatusText = $(".video-" + caseInfo.videoId + "-processing-status .processing-status-text");
                var processingStatusSpinner = $(".video-" + caseInfo.videoId + "-processing-status .processing-status-spinner");
                
                processingStatusText.removeClass("in-progress").addClass("success").text("Publishing complete");
                processingStatusSpinner.hide();

                setTimeout(function () {
                    _cases = _cases.filter(function(obj) {
                        return obj.caseId !== caseInfo.caseId;
                    });

                    var videoRow = processingStatusText.closest("tr");
                    videoRow.remove();

                }, 5000);
            });
        });
    }

    function uploadFileToGithub(caseInfo) {
        
        console.log("uploading file to GitHub...");
        
        var promise = new Promise(function(resolve, reject) {
        
            var processingStatusText = $(".video-" + caseInfo.videoId + "-processing-status .processing-status-text");

            processingStatusText.text("Uploading file to GitHub");

            var markdownTemplate = new CaseMarkdownTemplate();
            markdownTemplate
                .create(caseInfo)
                .then(function () {
                    
                    caseInfo.markdownTemplatePath = markdownTemplate.path;
                    caseInfo.markdownTemplateSHA = markdownTemplate.SHA;
                    caseInfo.markdownTemplateUrl = markdownTemplate.url;
                    caseInfo.hasContentChanged = false;
                    
                    processingStatusText.text("File uploaded to GitHub");

                    resolve(caseInfo);
                
                }).catch(function (error) {

                    processingStatusText.removeClass("progress").addClass("error").text("Unable to upload file to GitHub");

                    console.log("An error occurred while uploading the case template: " + error.message);
                    
                    reject(error); 
                });
        });
        
        return promise;
    }

    loadAllDraftCases().then(function (cases) {

        _cases = cases;

        for(var key in _cases) {
            var caseInfo = _cases[key];
            
            var row = $("<tr/>");
            var columns = [];
            
            var titleColumn = $("<td/>").text(caseInfo.title);
            var videoInfoSpan = $("<span/>", { class: "video-info", "data-video-id": caseInfo.videoId, "data-case-id": caseInfo.caseId });
            titleColumn.append(videoInfoSpan);

            var statusColumn = $("<td/>");
            var processingStatusSpan = $("<span/>", { class: "video-" + caseInfo.videoId + "-processing-status" }); 
            var processingStatusText = $("<span/>", { class: "processing-status-text", "text": "Please wait..." }); 
            var processingStatusSpinner = $("<img/>", { class: "processing-status-spinner", src:"/admin/img/flask-spinner.gif", style:"height:25px; width:25px; display:none;" });
            processingStatusSpan.append(processingStatusText, processingStatusSpinner);
            statusColumn.append(processingStatusSpan);

            var viewCaseLink = $("<a/>", { "class": "action btn btn-default", href: settings.viewCaseUrl + caseInfo.caseId, text: "View" });
            var publishLink = $("<a/>", { "class": "action btn btn-primary publish publish-case-" + caseInfo.caseId, style: "display:none;", "data-case-id": caseInfo.caseId, text: "Publish"});
           
            var actionsColumn = $("<td/>")
                .append(viewCaseLink, publishLink);
            
            columns.push(titleColumn, statusColumn, actionsColumn);
            
            row.append(columns);
            
            _tbody.append(row);
        }
        
        _table.dynatable({
            features: {
                pushState: false
            }
        });

        $(".publish").on("click", publishCase);
        
        _container.stopLoading();

        updateCaseVideoProcessingStatuses();
    })
    .catch(function (error) {
        console.error(error);
    });

    function deleteVideo(caseInfo) {
        
        var promise = null;

        if (!caseInfo.previousVideoId) {

            console.log("No previous video exists, skipping delete...");

            promise = new Promise(function(resolve, reject) {
                resolve(caseInfo);
            });

        } else {

            console.log("Deleting old video with id: " + caseInfo.previousVideoId);
            
            promise = new Promise(function(resolve, reject) {
            
                var processingStatusText = $(".video-" + caseInfo.videoId + "-processing-status .processing-status-text");

                processingStatusText.text("Deleting old video");

                var video = new Video(caseInfo.previousVideoId);
                video
                    .delete()
                    .then(function () {
                        
                        processingStatusText.text("Old video deleted");
                        
                        caseInfo.previousVideoId = null;

                        resolve(caseInfo); 
                    })
                    .catch(function (error) {
                        
                        processingStatusText.removeClass("progress").addClass("error").text("Unable to delete old video");

                        console.log("An error occurred while deleting the previous video: " + error.message);
                        
                        reject(error); 
                    });
            });
        }
        
        return promise;
    }
    
    function deleteMarkdownTemplate(caseInfo) {
        
        var promise = null;

        if (caseInfo.markdownTemplatePath) {

            console.log("Deleting old markdown template", caseInfo.previousMarkdownTemplatePath, caseInfo.previousMarkdownTemplateSHA);
            
            promise = new Promise(function(resolve, reject) {
                
                var markdownTemplate = new CaseMarkdownTemplate();
                markdownTemplate.caseId = caseInfo.caseId;
                markdownTemplate.path = caseInfo.markdownTemplatePath;
                markdownTemplate.SHA = caseInfo.markdownTemplateSHA;
                
                var processingStatusText = $(".video-" + caseInfo.videoId + "-processing-status .processing-status-text");
                processingStatusText.text("Deleting file from GitHub");

                markdownTemplate
                    .delete()
                    .then(function () {
                        
                        console.log("Markdown template deleted.");
                        
                        processingStatusText.text("File deleted from GitHub");
                        
                        resolve(caseInfo);
                    })
                    .catch(function (error) {
                        
                        processingStatusText.removeClass("progress").addClass("error").text("Unable to delete file from GitHub");

                        console.log("An error occurred while deleting the case template: " + error.message);
                        
                        reject(error); 
                    });
            });
        } else {
            console.log("No previous markdown template exists, skipping delete...");

            promise = new Promise(function(resolve, reject) {
                resolve(caseInfo);
            });
        }
        
        return promise;
    }
});