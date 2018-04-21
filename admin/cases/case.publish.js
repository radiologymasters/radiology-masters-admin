require(["settings", "dynatable", "jquery", "loading"], function(settings, dynatable, $) {
    
    var container = $("#case-info-container");
    var _table = $("#cases-table");
    var tbody = _table.find("tbody");
    
    container.startLoading();
    
    function loadAllDraftCases() {
         var promise = new Promise(function(resolve, reject) {
            firebase
                .database()
                .ref('/cases')
                .once('value')
                .then(function(data) {
                    var cases = data.val();
                    var draftCases = filterDraftCases(cases);
                    resolve(draftCases);
                });
        });
        return promise;
    }

    function filterDraftCases(cases) {
        var draftCases = [];

        for(var i=0; i < cases.length; i++) {
            var caseInfo = cases[i];
            if (caseInfo.hasOwnProperty(isPublished) && !caseInfo.isPublished) {
                draftCases.push(caseInfo);
            }
        }

        return draftCases;
    }

    loadAllDraftCases().then(function (cases) {
        
        for(var key in cases) {
            var caseInfo = cases[key];
            
            var row = $("<tr/>");
            var columns = [];
            
            var titleColumn = $("<td/>").text(caseInfo.title);
            var statusColumn = $("<td/>").text("Processing");
            
            var viewCaseLink = $("<a/>", { "class": "action", href: settings.viewCaseUrl + caseInfo.caseId, text: "View" });
            var publishLink = $("<a/>", { "class": "action", text: "Publish" });
            
            var actionsColumn = $("<td/>")
                .append(viewCaseLink, publishLink);
            
            columns.push(titleColumn, statusColumn, actionsColumn);
            
            row.append(columns);
            
            tbody.append(row);
        }
        
        _table.dynatable({
            features: {
                pushState: false
            }
        });
        
        container.stopLoading();
    })
    .catch(function (error) {
        console.error(error);
    });
});