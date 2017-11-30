var requiredModules = ["settings", "utils", "CaseModel", "jquery", "loading"];

require(requiredModules, function(settings, utils, CaseModel, $) {

    var caseId = utils.getRouteParamValue(window.location.href);
    var caseInfoPanel = $("#case-info-container");
    var caseInfoErrorPanel = $("#case-info-error-container");
    
    caseInfoPanel.startLoading();
    
    function handleCaseLoaded() {
        $("#case-title").text(caseInfo.title);
        $("#case-description").html(caseInfo.description);
        $("#case-options-delete").prop("href", settings.deleteCaseUrl + caseInfo.caseId);
        $("#case-options-update").prop("href", settings.updateCaseUrl + caseInfo.caseId);
        
        var specialities = $("#case-specialities");
        
        for(var i=0; i < caseInfo.speciality.length; i++) {
            var speciality = $("<span/>", { "class": "label label-info", text: caseInfo.speciality[i] });
            specialities.append(speciality);
        }
        
        $("#case-video-embed").prop("src", "https://player.vimeo.com/video/" + caseInfo.videoId).fadeIn();
        $("#case-author").text(caseInfo.createdByUserFullName);
        
        if (caseInfo.complexity.toLowerCase() == "easy") {
            $("#case-complexity").addClass("label-success");
        } else if (caseInfo.complexity.toLowerCase() == "medium") {
            $("#case-complexity").addClass("label-warning");
        } else {
            $("#case-complexity").addClass("label-danger");
        }
        
        $("#case-complexity").text(caseInfo.complexity);
        $("#case-views").text(caseInfo.stats.views);
        $("#case-completed").text(caseInfo.stats.completed);
        
        caseInfoPanel.stopLoading();
    }
    
    function handleCaseError(error) {
        caseInfoPanel.hide();
        
        $("#case-error").text("An error occurred while loading the requested case: " + error);
        
        caseInfoErrorPanel.show();
    }
    
    function getCaseIdRouteParam(url) {
        var urlParts = url.split("/");
        var paramIndex = urlParts.length;
        return urlParts[paramIndex -1];
    }
    
    var caseInfo = new CaseModel();
    caseInfo
        .load(firebase, caseId)
        .then(handleCaseLoaded)
        .catch(handleCaseError);

});
