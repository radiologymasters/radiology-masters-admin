define("SignupView", ["jquery", "settings", "UserModel", "validate"], function($, settings, User) {

    function handleFormSubmitted(form, event) {
        event.preventDefault();

        var user = new User();
        user.firstName = $("#signup-firstname").val();
        user.lastName = $("#signup-lastname").val();
        user.email = $("#signup-email").val();
        user.password = $("#signup-password").val();

        user.createLocalAccount(firebase, handleSuccessfulRedirect, handleUserAccountCreationError);
    }

    function handleSuccessfulRedirect(user) {

        console.log("Redirecting user to success page", user.userId);

        setTimeout(function() {
            window.location.replace(settings.homeUrl);
        }, 1000);
    }

    function handleUserAccountCreationError(user, errorMessage) {
        $("#signup-error").text(errorMessage).show();
    }
    
    $("form[name='signup']").validate({
        rules: {
            firstname: "required",
            lastname: "required",
            email: {
                required: true,
                email: true
            },
            password: {
                required: true,
                minlength: 5
            }
        },
        messages: {
            firstname: "Please enter your firstname",
            lastname: "Please enter your lastname",
            password: {
                required: "Please provide a password",
                minlength: "Your password must be at least 5 characters long"
            },
            email: "Please enter a valid email address"
        },
        submitHandler: handleFormSubmitted
    });
});