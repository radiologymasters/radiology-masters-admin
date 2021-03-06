define("CaseModel", ["utils", "CaseNotificationModel"], function(utils, CaseNotification) {

    function Case() {

        this.caseId = utils.guid();
        this.title = "";
        this.description = "";
        this.speciality = "";
        this.complexity = "";
        this.hasContentChanged = false;
        this.hasVideoChanged = false;
        this.previousVideoId = null;
        this.videoId = null;
        this.videoUrl = "";
        this.videoThumbnailSmall = "";
        this.videoThumbnailMedium = "";
        this.videoThumbnailLarge = "";
        this.markdownTemplatePath = "";
        this.markdownTemplateSHA = "";
        this.markdownTemplateUrl = "";
        this.createdByUserId = null;
        this.createdByUserFullName = "";
        this.createdTimestamp = new Date().getTime();
        this.updatedByUserId = null;
        this.updatedByUserFullName = "";
        this.updatedTimestamp = "";
        this.isPublished = false;
        
        this.stats = {
            views: 0,
            completed: 0
        };

        var self = this;

        this.load = function(firebase, caseId) {

            var promise = new Promise(function(resolve, reject) {

                if (!caseId) {
                    throw new Error("The case id must not be null");
                }

                console.log("Loading case with id: " + caseId);

                firebase
                    .database()
                    .ref('/cases/' + caseId)
                    .once('value')
                    .then(function(caseInfo) {

                        if (!caseInfo || !caseInfo.val()) {
                            reject("Unable to find case with id: " + caseId);
                        }

                        self.caseId = caseId;
                        self.title = caseInfo.val().title;
                        self.description = caseInfo.val().description;
                        self.speciality = caseInfo.val().speciality;
                        self.complexity = caseInfo.val().complexity;
                        self.hasContentChanged = caseInfo.val().hasContentChanged;
                        
                        self.hasVideoChanged = caseInfo.val().hasVideoChanged;
                        self.videoId = caseInfo.val().videoId;
                        self.videoUrl = caseInfo.val().videoUrl;
                        self.previousVideoId = caseInfo.val().previousVideoId || null;
                        self.videoThumbnailSmall = caseInfo.val().videoThumbnailSmall;
                        self.videoThumbnailMedium = caseInfo.val().videoThumbnailMedium;
                        self.videoThumbnailLarge = caseInfo.val().videoThumbnailLarge;

                        self.markdownTemplatePath = caseInfo.val().markdownTemplatePath;
                        self.markdownTemplateSHA = caseInfo.val().markdownTemplateSHA;
                        self.markdownTemplateUrl = caseInfo.val().markdownTemplateUrl;

                        self.createdByUserId = caseInfo.val().createdByUserId;
                        self.createdByUserFullName = caseInfo.val().createdByUserFullName;
                        self.createdTimestamp = new Date(caseInfo.val().createdTimestamp);
                        
                        self.updatedByUserId = caseInfo.val().updatedByUserId || null,
                        self.updatedByUserFullName = caseInfo.val().updatedByUserFullName,
                        self.updatedTimestamp = new Date(caseInfo.val().updatedTimestamp);
                        
                        self.isPublished = caseInfo.val().isPublished;

                        self.stats = caseInfo.val().stats;

                        console.log("Case with id: " + caseId + ", successfully loaded");
                        
                        resolve();
                    });
            });

            return promise;
        };

        this.create = function(firebase) {

            var promise = new Promise(function(resolve, reject) {

                var caseInfo = {
                    caseId: self.caseId,
                    title: self.title,
                    description: self.description,
                    speciality: self.speciality,
                    complexity: self.complexity,
                    hasContentChanged: self.hasContentChanged,
                    hasVideoChanged: self.hasVideoChanged,
                    videoId: self.videoId,
                    previousVideoId: self.previousVideoId,
                    videoUrl: self.videoUrl,
                    videoThumbnailSmall: self.videoThumbnailSmall,
                    videoThumbnailMedium: self.videoThumbnailMedium,
                    videoThumbnailLarge: self.videoThumbnailLarge,
                    markdownTemplatePath: self.markdownTemplatePath,
                    markdownTemplateSHA: self.markdownTemplateSHA,
                    markdownTemplateUrl: self.markdownTemplateUrl,
                    createdByUserId: self.createdByUserId,
                    createdByUserFullName: self.createdByUserFullName,
                    createdTimestamp: new Date().getTime(),
                    updatedByUserId: self.updatedByUserId,
                    updatedByUserFullName: self.updatedByUserFullName,
                    updatedTimestamp: self.updatedTimestamp,
                    isPublished: self.isPublished,
                    stats: self.stats
                };

                firebase
                    .database()
                    .ref("cases/" + caseInfo.caseId)
                    .set(caseInfo)
                    .then(function() {

                        var notification = new CaseNotification();
                        notification.caseId = self.caseId;
                        notification.caseTitle = self.title;
                        notification.type = "create";
                        notification.message = "A new case '{title}' was added by {author}".format({ title: self.title, author: self.createdByUserFullName });
                        notification.createdByUserId = self.createdByUserId;
                        notification.createdByUserFullName = self.createdByUserFullName;

                        notification
                            .create(firebase)
                            .then(resolve);
                    })
                    .catch(function(error) {
                        reject(error);
                    });
            });

            return promise;
        };
        
         this.update = function(firebase) {

           var promise = new Promise(function(resolve, reject) {

                var caseInfo = {
                    caseId: self.caseId,
                    title: self.title,
                    description: self.description,
                    speciality: self.speciality,
                    complexity: self.complexity,
                    hasContentChanged: self.hasContentChanged,
                    hasVideoChanged: self.hasVideoChanged,
                    videoId: self.videoId,
                    previousVideoId: self.previousVideoId,
                    videoUrl: self.videoUrl,
                    videoThumbnailSmall: self.videoThumbnailSmall,
                    videoThumbnailMedium: self.videoThumbnailMedium,
                    videoThumbnailLarge: self.videoThumbnailLarge,
                    markdownTemplatePath: self.markdownTemplatePath,
                    markdownTemplateSHA: self.markdownTemplateSHA,
                    markdownTemplateUrl: self.markdownTemplateUrl,
                    createdByUserId: self.createdByUserId,
                    createdByUserFullName: self.createdByUserFullName,
                    createdTimestamp: new Date().getTime(),
                    updatedByUserId: self.updatedByUserId,
                    updatedByUserFullName: self.updatedByUserFullName,
                    updatedTimestamp: self.updatedTimestamp,
                    isPublished: self.isPublished,
                    stats: self.stats
                };

                firebase
                    .database()
                    .ref("cases/" + caseInfo.caseId)
                    .set(caseInfo)
                    .then(function() {

                        var notification = new CaseNotification();
                        notification.caseId = self.caseId;
                        notification.caseTitle = self.title;
                        notification.type = "update";
                        notification.message = "The case '{title}' was updated by {author}".format({ title: self.title, author: self.createdByUserFullName });
                        notification.createdByUserId = self.createdByUserId;
                        notification.createdByUserFullName = self.createdByUserFullName;

                        notification
                            .create(firebase)
                            .then(resolve);
                    })
                    .catch(function(error) {
                        reject(error);
                    });
            });

            return promise;
        };

        this.delete = function(firebase, user) {

            var promise = new Promise(function(resolve, reject) {

                if (!self.caseId) {
                    throw new Error("The case id must not be null");
                }

                console.log("Deleting case with id: " + self.caseId);

                firebase
                    .database()
                    .ref('/cases/' + self.caseId)
                    .remove()
                    .then(function() {

                        console.log("The case with id: " + self.caseId + " has been deleted");

                        var notification = new CaseNotification();
                        notification.caseId = self.caseId;
                        notification.caseTitle = self.title;
                        notification.type = "delete";
                        notification.message = "The case '{title}' was deleted by {author}".format({ title: self.title, author: user.displayName });
                        notification.createdByUserId = user.uid;
                        notification.createdByUserFullName = user.displayName;
                        
                        notification
                            .create(firebase)
                            .then(resolve);
                    });
            });

            return promise;
        };
    }

    return Case;
});
