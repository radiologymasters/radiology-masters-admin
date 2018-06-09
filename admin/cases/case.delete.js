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
        
        var promise = null;

        if (!caseInfo.previousVideoId) {

            console.log("No previous video exists, skipping delete...");

            promise = new Promise(function(resolve, reject) {
                resolve(caseInfo);
            });

        } else {

            console.log("Deleting old video with id: " + caseInfo.previousVideoId);
            
            promise = new Promise(function(resolve, reject) {
            
                var video = new VideoModel(caseInfo.previousVideoId);
                video
                    .delete()
                    .then(function () {
                        
                        caseInfo.previousVideoId = null;

                        resolve(caseInfo); 
                    })
                    .catch(function (error) {

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
                
                markdownTemplate
                    .delete()
                    .then(function () {
                        
                        console.log("Markdown template deleted.");

                        resolve(caseInfo);
                    })
                    .catch(function (error) {
                        
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
