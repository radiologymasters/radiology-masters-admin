requirejs.config({
    shim: {
        select2: {
            deps: ["jquery"],
            exports: "$.fn.select2"
        },
        timeago: ['jquery'],
        bootstrap:['jquery'],
        validate:['jquery'],
        sammy:['jquery'],
        loading: ["jquery"],
        CaseModel: ["CaseNotificationModel"],
        trumbowygCleanPaste: ["trumbowyg"]
    },
    paths: {
        // VENDOR
        jquery: "../node_modules/jquery/dist/jquery.min",
        trumbowyg: "../node_modules/trumbowyg/dist/trumbowyg.min",
        trumbowygCleanPaste: "../node_modules/trumbowyg/dist/plugins/cleanpaste/trumbowyg.cleanpaste.min",
        bootstrap: "../node_modules/bootstrap/dist/js/bootstrap.min",
        validate: "../node_modules/jquery-validation/dist/jquery.validate.min",
        sammy: "../node_modules/sammy/lib/sammy",
        VimeoUpload: "../node_modules/vimeo-upload/vimeo-upload",
        VimeoApi: "../node_modules/vimeo/lib/vimeo",
        dynatable: "js/vendor/jquery-dynatable/jquery.dynatable",
        select2: "../node_modules/select2/dist/js/select2.min",
        timeago: "../node_modules/timeago/jquery.timeago",
        // INTERNAL
        settings: '../shared/settings',
        firebaseConfig: '../shared/settings.firebase',
        utils: '../shared/utils',
        loading: "js/plugins/loading",
        CaseModel: "cases/case.model",
        CaseNotificationModel: "cases/case.notification.model",
        CaseMarkdownTemplateModel: "cases/case.markdown.template",
        CaseNotificationWidget: "cases/case.notification.widget",
        UserModel: "../shared/user.model",
        VideoModel: "cases/video.model"
    }
});

var requiredModules = [
    "firebaseConfig",
    "jquery",
    "sammy",
    "settings",
    "UserModel",
    "validate",
    "bootstrap"
];

require(requiredModules, function(firebaseConfig, $, sammy, settings, User) {
    console.log("Application modules loaded.");

    firebase.auth().onAuthStateChanged(function(firebaseUser) {
        if (firebaseUser) {
            
            var user = new User();
            user.userId = firebaseUser.uid;
            
            user.load(firebase).then(function () {
                
                if (!user.isAdmin) {
                    window.location.replace(settings.unauthorizedUrl);
                } else {
                    $('#loading').delay(1000).fadeOut();
                } 
            });
        }
        else {
            window.location.replace(settings.loginUrl);
        }
    });
    
    var sammyApp = sammy(function() {
        this.get("#/", function() {
          $("#viewport").load("dashboard.html");
        });
        
        this.get("#/cases", function() {
          $('#viewport').load("cases/all.html");
        });
        
        this.get("#/cases/add", function() {
          $("#viewport").load("cases/add.html");
        });
        
        this.get("#/cases/view/:caseId", function() {
          $("#viewport").load("cases/view.html");
        });
        
        this.get("#/cases/update/:caseId", function() {
          $("#viewport").load("cases/update.html");
        });
        
        this.get("#/cases/delete/:caseId", function() {
          $("#viewport").load("cases/delete.html");
        });
        
        this.get("#/cases/test", function() {
          $("#viewport").load("cases/test.html");
        });
        
      });
      
    $(function() {
        sammyApp.run();
   
        firebase.auth().onAuthStateChanged(function(user) {
            if (user) {
                $("#user-display-name").text(user.displayName);
            } 
        });
        
        $("#logout").click(function(e) {
            e.preventDefault();
    
            firebase.auth().signOut()
                .then(function() {
                    window.location.replace(settings.loginUrl);
                }).catch(function(error) {
                    console.error("Unable to signout", error);
                });
        });
    });
});