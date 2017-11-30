define("CaseNotificationWidget", ["jquery", "settings", "CaseNotificationModel", "timeago"], function($, settings, CaseNotification) {
    
    function CaseNotificationWidget(parent) {
        
        function handleCaseNotificationsLoaded(notifications) {
            
            var sortedNotifications = sortNotifications(notifications);
            
            var promise = new Promise(function(resolve, reject) {
            
                var listGroup = $("<ul/>", { "class": "list-unstyled" });
                
                for(var i=0; i < sortedNotifications.length; i++) {
                     
                    var notification = sortedNotifications[i];
                    
                    var li = $("<li/>", {"class": ""});
                    var span = $("<span/>", { text: notification.message });
                    li.append(span);
                    
                    var timeSince = $.timeago(notification.createdTimestamp);
                    if (!timeSince.startsWith("NaN")) {
                        var time = $("<span/>", { "class": "timeago", text: timeSince });
                        li.append(time);
                    }
                    
                    if (notification.type && 
                        (notification.type == "create" ||  notification.type == "update") &&
                        !isCaseDeleted(sortedNotifications, notification.caseId)) {
                            
                        var a = $("<a/>", { "class": "pull-right", "href": settings.viewCaseUrl + notification.caseId, text: "View", });
                        li.append(a);
                    }
                    
                    listGroup.append(li);
                }
                
                parent.append(listGroup);
                
                resolve();
            });
            
            return promise;
        }
        
        function sortNotifications(notifications) {
            var sortedNotifications = notifications.sort(function(x, y){
                return x.createdTimestamp - y.createdTimestamp;
            });
            
            return sortedNotifications.reverse();
        }
        
        function isCaseDeleted(notifications, caseId) {
            for (var i = 0; i < notifications.length; i++) {
                var notification = notifications[i];
                
                if (notification.caseId == caseId &&
                    notifications[i].type &&
                    notification.type == "delete") {
                        
                    return true;
                }
            }
        
            return false;
        }
        
        function _setup(callback) {
            new CaseNotification()
                .loadAll(firebase, 20)
                .then(handleCaseNotificationsLoaded)
                .then(callback);
        }
        
        return {
            setup: _setup
        };
    }
    
    return CaseNotificationWidget;
});