define("LoginView", ["jquery", "settings", "utils", "UserModel", "validate"], function($, settings, utils, User) {
    
    function authenticate(userInfo) {
        
        firebase.auth()
            .signInWithEmailAndPassword(userInfo.email, userInfo.password)
            .then(function(user) {
                window.location.replace(settings.homeUrl);        
            })
            .catch(function(error) {
                var errorMessage = error.message;
                
                $("#login-error").text(errorMessage).show();
            });
    }
    
    $("form[name='login']").validate({
        rules: {
            email: {
                required: true,
                email: true
            },
            password: {
                required: true
            }
        },
        messages: {
            password: {
                required: "Please enter your password"
            },
            email: "Please enter a valid email address"
        },
        submitHandler: function(form, event) {
            event.preventDefault();

            var userInfo = {
                email: $("#login-email").val(),
                password: $("#login-password").val()
            };

            authenticate(userInfo);
        }
    });
});