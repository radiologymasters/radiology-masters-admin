requirejs.config({
    paths: {
        // VENDOR
        jquery: "/node_modules/jquery/dist/jquery.min",
        // INTERNAL
        settings: '/shared/settings',
        utils: '/shared/utils',
        UserModel: "/shared/user.model",
        SignupOAuthView: "/account/signup.oauth"
    }
});

require(["jquery", "settings", "SignupOAuthView"], function($, settings) {
    console.log("OAuth signup view loaded");
});