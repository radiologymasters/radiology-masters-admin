requirejs.config({
    shim: {
        bootstrap:['jquery'],  
        validate:['jquery']
    },
    paths: {
        // VENDOR
        jquery: "/node_modules/jquery/dist/jquery.min",
        bootstrap: "/node_modules/bootstrap/dist/js/bootstrap.min",
        validate: "/node_modules/jquery-validation/dist/jquery.validate.min",
        // INTERNAL
        settings: '/shared/settings',
        utils: '/shared/utils',
        UserModel: "/shared/user.model",
        SignupView: "/account/signup",
        LoginView: "/account/signin"
    }
});

require(["jquery", "validate", "settings", "utils", "SignupView", "LoginView"], function($, validate, settings, utils) {
    
    $('ul.tabs li').click(function() {
        var tab_id = $(this).attr('data-tab');

        $('ul.tabs li').removeClass('current');
        $('.tab-content').removeClass('current');

        $(this).addClass('current');
        $("#" + tab_id).addClass('current');
    });
    
    if(utils.getQueryStringParamValue("type") == "signup") {
        $("#signup-tab").click();
    } else {
        $("#signin-tab").click();
    }
    
    var firebaseUIConfig = {
        signInSuccessUrl: settings.signupOAuthUrl,
        signInOptions: [
            firebase.auth.GoogleAuthProvider.PROVIDER_ID
        ]
    };
    
    var firebaseUI = new firebaseui.auth.AuthUI(firebase.auth());
    firebaseUI.start('#firebaseui-auth-container', firebaseUIConfig);
});