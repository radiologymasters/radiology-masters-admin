define("SignupOAuthView", ["jquery", "settings", "UserModel"], function($, settings, User) {

    function handleSuccessfulRedirect(user) {
        console.log("Redirecting user to success page", user.userId);
        window.location.href = settings.homeUrl;
    }

    function handleUserAccountCreationError(user, error) {
        console.log('error', error);
        $("#account-creation-error").text("An error occurred while setting up your account: " + error);
    }

    firebase.auth().onAuthStateChanged(function(firebaseUser) {
        if (firebaseUser) {
            var nameParts = firebaseUser.displayName.split(" ");

            var user = new User();
            user.userId = firebaseUser.uid;
            user.exists(firebase)
                .then(function(isExistingUser) {

                    if (isExistingUser) {
                        console.log("User already exists, skipping local account creation...", user.userId);

                        handleSuccessfulRedirect(user);
                        return;
                    }

                    $("#account-creation-message").text("Please wait while we finish setting up your account.");

                    user.firstName = nameParts[0] || "";
                    user.lastName = nameParts[1] || "";
                    user.email = firebaseUser.email;
                    user.isAdmin = true;

                    user.createRemoteAccount(firebase, handleSuccessfulRedirect, handleUserAccountCreationError);
                })
                .catch(function(error) {
                    handleUserAccountCreationError(user, error);
                });
        }
    });
});
