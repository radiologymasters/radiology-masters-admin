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
                    
                    console.log("Cases", cases);

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
                
                console.log("case is unpublished", caseInfo);
                
                unpublishedCases.push(caseInfo);
            }
        }

        return unpublishedCases;
    }

    function updateCaseVideoProcessingStatuses() {

        console.log("Updating video statuses for all unpublished cases...");

        var videos = _table.find(".video-info");

        videos.each(function(index) {
            var videoInfoSpan = $(this);
            var videoId = videoInfoSpan.data("video-id");
            var previousProcessingStatus = videoInfoSpan.data("video-processing-status");
            var caseId = videoInfoSpan.data("case-id");
            var processingStatusSpan = $(".video-" + videoId + "-processing-status");

            // check if the video processing status is already "available" and therefore been checked before
            // and do not check again to avoid rate limiting on the Vimeo API.
            if (previousProcessingStatus && previousProcessingStatus === "available") {
                console.log("Video processing status has already been derived and is awaiting publishing, skipping processing status check.");
                return;
            }

            console.log("Getting processing status for video", videoId);

            var video = new Video(videoId);
            video.getProcessingStatus().then(function (processingStatus) { 
                
                videoSpan.data("video-processing-status", processingStatus);
                var statusText = "Processing please wait..."

                // check if the video thumbnails have been generated
                if (processingStatus === "available") {

                    statusText = "Ready to publish";
                    // allow the case to be published by showing the publish button
                    var publishButton = $(".publish-case-" + caseId);
                    publishButton.show();
                }

                processingStatusSpan.text(statusText);
            }); 
        });

        setTimeout(updateCaseVideoProcessingStatuses, settings.videoProcessingStatusPollIntervalInMilliseconds);
    }

    function publishCase(e) {
        e.preventDefault();

        var caseId = $(this).data("case-id");

        var caseInfo = _cases.filter(function(obj) {
            return obj.caseId === caseId;
        })[0];

        var video = new Video(caseInfo.videoId);
        video.getThumbnails().then(function(thumbnails) {

            caseInfo.videoThumbnailLarge = thumbnails.largeUrl;
            caseInfo.videoThumbnailMedium = thumbnails.mediumUrl;
            caseInfo.videoThumbnailSmall = thumbnails.smallUrl;

            uploadFileToGithub(caseInfo)
                .then(updateCase);
        });
    }

    function cleanUpAfterPublishingCase(caseId) {
        // TODO
        // tidy up code
        // remove the case from the _cases array
        // remove the row from the case table
        // add publishing notification and toast
    };

    function updateCase(caseInfo) {
        
        var model = new Case();
        model.load(firebase, caseInfo.caseId).then(function () {

            model.videoThumbnailLarge = caseInfo.videoThumbnailLarge;
            model.videoThumbnailMedium = caseInfo.videoThumbnailMedium;
            model.videoThumbnailSmall = caseInfo.videoThumbnailSmall;
            model.markdownTemplatePath = caseInfo.markdownTemplatePath;
            model.markdownTemplateSHA = caseInfo.markdownTemplateSHA;
            model.markdownTemplateUrl = caseInfo.markdownTemplateUrl;
            model.isPublished = true;

            var user = firebase.auth().currentUser;
            model.updatedByUserId = user.uid;
            model.updatedByUserFullName = user.displayName;
            model.updatedTimestamp = new Date().getTime();

            model.update(firebase).then(function () {
                cleanUpAfterPublishingCase(caseInfo.caseId);
            });
        });
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
                
                    resolve(caseInfo);
                
                }).catch(function (error) {
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
            var processingStatusSpan = $("<span/>", { class: "video-" + caseInfo.videoId + "-processing-status", "text": "Please wait..." }); 
            statusColumn.append(processingStatusSpan);

            var viewCaseLink = $("<a/>", { "class": "action btn btn-default", href: settings.viewCaseUrl + caseInfo.caseId, text: "View" });
            var publishLink = $("<a/>", { "class": "action btn btn-primary publish publish-case-" + caseInfo.caseId, "data-case-id": caseInfo.caseId, text: "Publish"});
           
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

       // updateCaseVideoProcessingStatuses();
    })
    .catch(function (error) {
        console.error(error);
    });
});