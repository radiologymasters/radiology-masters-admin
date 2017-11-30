require(["settings", "dynatable", "jquery", "loading"], function(settings, dynatable, $) {
    
    var container = $("#case-info-container");
    var _table = $("#cases-table");
    var tbody = _table.find("tbody");
    
    container.startLoading();
    
    function loadAllCases() {
         var promise = new Promise(function(resolve, reject) {
            firebase
                .database()
                .ref('/cases')
                .once('value')
                .then(function(data) {
                    var cases = data.val();
                    console.log("Cases loaded", cases);
                    
                    resolve(cases);
                });
        });
        return promise;
    }
    
    loadAllCases().then(function (cases) {
        
        for(var key in cases) {
            var caseInfo = cases[key];
            
            var row = $("<tr/>");
            var columns = [];
            
            var titleColumn = $("<td/>").text(caseInfo.title);
            var authorColumn = $("<td/>").text(caseInfo.createdByUserFullName);
            var specialityColumn = $("<td/>").text(caseInfo.speciality);
            var complexityColumn = $("<td/>").text(caseInfo.complexity);
            
            var viewCaseLink = $("<a/>", { "class": "action", href: settings.viewCaseUrl + caseInfo.caseId, text: "View" });
            var updateCaseLink = $("<a/>", { "class": "action", href: settings.updateCaseUrl + caseInfo.caseId, text: "Update" });
            var deleteCaseLink = $("<a/>", { "class": "action", href: settings.deleteCaseUrl + caseInfo.caseId, text: "Delete" });
            
            var actionsColumn = $("<td/>")
                .append(viewCaseLink, updateCaseLink, deleteCaseLink);
            
            columns.push(titleColumn, authorColumn, specialityColumn, complexityColumn, actionsColumn);
            
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