require(["jquery", "settings", "CaseNotificationWidget", "loading"], function($, settings, CaseNotificationWidget) {
    
    $(function () {
        
        var caseNotificationsPanel = $("#case-notifications");
        var caseNotificationsPanelBody = caseNotificationsPanel.find(".panel-body");
        
        caseNotificationsPanel.startLoading();
        
        var caseNotifications = new CaseNotificationWidget(caseNotificationsPanelBody);
        caseNotifications.setup(function () {
            caseNotificationsPanel.stopLoading();
        });
    });
});