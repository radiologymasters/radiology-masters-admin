var requiredModules = ["jquery", "settings", "utils", "CaseModel", "CaseMarkdownTemplateModel", "VideoModel", "loading"];

require(requiredModules, function($, settings, utils, CaseModel, CaseMarkdownTemplate, VideoModel) {

    var caseId = utils.getRouteParamValue(window.location.href);
    var deletePanel = $("#case-info-delete-container");
    var deleteWarning = $("#case-info-delete-warning");
    var deleteError = $("#case-info-delete-error-container");
    var deleteSucess = $("#case-info-delete-success");
    var deleteButton = $("#delete-case-confirm");
    var _caseInfo = null;
    
    deletePanel.startLoading();
    
    function handleCaseLoaded() {
        $("#case-title").text(_caseInfo.title);
        $("#case-options-view").prop("href", settings.viewCaseUrl + _caseInfo.caseId);
        $("#case-options-update").prop("href", settings.updateCaseUrl + _caseInfo.caseId);
        
        deletePanel.stopLoading();
    }
    
    function handleCaseError(error) {
        $("#case-error").text("An error occurred while deleting the requested case: " + error);
        
        deletePanel.hide();
        deleteError.show();
    }
    
    function handleShowSuccessMessage() {
        deleteWarning.hide();
        deleteSucess.show();
    }
    
    function handleCaseDeleted() {
        deletePanel.stopLoading({
            callback: handleShowSuccessMessage
        });
    }
    
    function deleteCaseInfo(caseInfo) {
        var user = firebase.auth().currentUser;
        return caseInfo.delete(firebase, user);
    }
    
    function deleteVideo(caseInfo) {
        
        
        // TODO REMOVE WHEN UPLOAD WOKRING AGAIN
        // var promise = new Promise(function(resolve, reject) {
        //     resolve(caseInfo);
        // });
        // return promise;
        
        console.log("Deleting video with id: " + caseInfo.videoId);
        
        // skip if video id not specified
        if (!caseInfo.videoId) {
            
            var skipDeleteVideoPromise = new Promise(function(resolve, reject) {
                resolve(caseInfo);
            });
            
            return skipDeleteVideoPromise;
        }
        
        var deleteVideoPromise = new Promise(function(resolve, reject) {
            
            var video = new VideoModel(caseInfo.videoId);
            video
                .delete()
                .then(function () {
                   resolve(caseInfo); 
                })
                .catch(function (error) {
                   reject(error); 
                });
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
                    
                    resolve(caseInfo);
                })
                .catch(function (error) {
                   reject(error); 
                });
        });
        
        return promise;
    }
    
    function handleDeleteCase() {
        
        deletePanel.startLoading({ message: "Deleting case, please wait..." });
        
        deleteVideo(_caseInfo)
            .then(deleteMarkdownTemplate)
            .then(deleteCaseInfo)
            .then(handleCaseDeleted)
            .catch(handleCaseError);
    }
    
    // Wire up the click event handler
    deleteButton.click(handleDeleteCase);
    
    // Load the case info for the specified case id
    _caseInfo = new CaseModel();
    _caseInfo
        .load(firebase, caseId)
        .then(handleCaseLoaded)
        .catch(handleCaseError);
});
