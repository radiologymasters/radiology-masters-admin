define("CaseMarkdownTemplateModel", ["settings", "utils", "jquery"], function(settings, utils, $) {

    function CaseMarkdownTemplate() {
        
        this.caseId = null;
        this.content = null;
        this.path = null;
        this.SHA = null;
        this.url = null;
        
        var self = this;
        
        this.create = function(caseInfo) {
            
            var promise = new Promise(function(resolve, reject) {
                
                var filename = caseInfo.caseId + ".md";
                var filePath = settings.gitHubRepositoryCaseFileBasePath + filename;
                
                var markdownTemplate = createMarkDownTemplate(caseInfo);
                self.content = window.btoa(markdownTemplate);
                
                var credentials = window.btoa(settings.gitHubUsername + ":" + settings.gitHubAccessToken);
                var url = "https://api.github.com/repos/" + settings.gitHubUsername + "/" + settings.gitHubRepositoryName + "/contents/" + filePath;
                var body = {
                    path: filePath,
                    content: self.content,
                    message: "New case file created for case id '" + caseInfo.caseId + "' by Radiology Master's Admin on behalf of user '" + caseInfo.createdByUserFullName + "'",
                    branch: settings.gitHubBranch
                };
                
                $.ajax({
                    "url": url,
                    "type": "PUT",
                    "data": JSON.stringify(body),
                    beforeSend: function(xhr) { 
                        xhr.setRequestHeader("Authorization", "Basic " + credentials);  
                    },
                }).done(function(response) {
                    
                    self.caseId = caseInfo.caseId;
                    self.path = response.content.path;
                    self.SHA = response.content.sha;
                    self.url = response.content.download_url;
                    
                    resolve();
                    
                }).fail(function (request, error) {
                    reject(error);
                });
                
            });

            return promise;
        };
        
        this.delete = function() {
            
            var promise = new Promise(function(resolve, reject) {
                
                if (!self.caseId) {
                    throw new Error("The case markdown template case Id must have a value");
                }
                
                if (!self.path) {
                    throw new Error("The case markdown template path must have a value");
                }
                
                if (!self.SHA) {
                    throw new Error("The case markdown template SHA hash must have a value");
                }
                                
                var credentials = window.btoa(settings.gitHubUsername + ":" + settings.gitHubAccessToken);
                var url = "https://api.github.com/repos/" + settings.gitHubUsername + "/" + settings.gitHubRepositoryName + "/contents/" + self.path;
                var user = firebase.auth().currentUser;
                
                var body = {
                    path: self.path,
                    sha: self.SHA,
                    message: "Case file deleted for case id '" + self.caseId + "' by Radiology Master's Admin on behalf of user '" + user.displayName + "'",
                    branch: settings.gitHubBranch
                };
                
                $.ajax({
                    "url": url,
                    "type": "DELETE",
                    "data": JSON.stringify(body),
                    beforeSend: function(xhr) { 
                        xhr.setRequestHeader("Authorization", "Basic " + credentials);  
                    },
                }).done(function(response) {
                    
                    resolve();
                    
                }).fail(function (request, error) {
                    reject(error);
                });
                
            });

            return promise;
        };
        
        function createMarkDownTemplate(caseInfo) {
        
            var specialities = settings.gitHubMarkDownTemplateSpecialityTemplate;
        
            for(var i=0; i < caseInfo.speciality.length; i++) {
                var speciality = caseInfo.speciality[i];
                specialities += settings.gitHubMarkDownTemplateSpecialityItemTemplate.format({ speciality: speciality }); 
            }
        
            var template = settings.gitHubMarkDownTemplate.format({
                caseId: caseInfo.caseId,
                title: caseInfo.title,
                speciality: specialities,
                complexity: caseInfo.complexity,
                videoUrl: caseInfo.videoUrl,
                author: caseInfo.createdByUserFullName,
                description: caseInfo.description
            });
            
            return template;
        }

    }

    return CaseMarkdownTemplate;
});
