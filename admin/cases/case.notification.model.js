define("CaseNotificationModel", ["utils"], function(utils) {

    function CaseNotification(caseNotificationId) {

        this.caseNotificationId = caseNotificationId || utils.guid();
        this.caseId = "";
        this.caseTitle = "";
        this.type = "";
        this.message = "";
        this.createdByUserId = "";
        this.createdByUserFullName = "";
        this.createdTimestamp = new Date().getTime();

        var self = this;

        this.loadAll = function(firebase, limit) {
           
            var promise = new Promise(function(resolve, reject) {
                
                firebase
                    .database()
                    .ref('case-notifications/')
                    .orderByChild("timestamp")
                    .limitToFirst(limit)
                    .on('value', function(caseNotifications) {
                        
                        var notifications = [];
                        
                        caseNotifications.forEach(function(caseNotification) {
                            var notification = {
                                caseNotificationId: caseNotification.val().caseNotificationId,
                                caseId: caseNotification.val().caseId,
                                caseTitle: caseNotification.val().caseTitle,
                                message: caseNotification.val().message,
                                createdByUserId: caseNotification.val().createdByUserId,
                                createdByUserFullName: caseNotification.val().createdByUserFullName,
                                createdTimestamp: new Date(caseNotification.val().createdTimestamp),
                                type: caseNotification.val().type
                            };
                            notifications.push(notification);
                        });
                        
                        resolve(notifications);
                    });
            });

            return promise;
        };
        
        this.create = function(firebase) {
           
            var promise = new Promise(function(resolve, reject) {
               
                var notification = {
                    caseNotificationId: self.caseNotificationId,
                    caseId: self.caseId,
                    type: self.type,
                    caseTitle: self.caseTitle,
                    message: self.message,
                    createdByUserId: self.createdByUserId,
                    createdByUserFullName: self.createdByUserFullName,
                    createdTimestamp: new Date().getTime()
                };
               
                firebase
                    .database()
                    .ref("case-notifications/" + self.caseNotificationId)
                    .set(notification)
                    .then(function () {
                        resolve();
                    })
                    .catch(function (error) {
                        reject(error);
                    });
               
               resolve();
               
            });

            return promise;
        };
    }
    
    return CaseNotification;
});