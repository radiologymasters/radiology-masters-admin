define("UserModel", ["utils"], function(utils) {

    function User() {
        this.userId = utils.guid();
        this.firstName = "";
        this.lastName = "";
        this.email = "";
        this.signupTimestamp = new Date().getTime();
        this.isEnabled = true;
        this.isAdmin = false;
        this.completedCases = [];

        var self = this;

        this.getFullName = function() {
            return self.firstName + " " + self.lastName;
        };

        function updateRemoteUserProfile(firebaseUser, callback) {

            console.log("Updating remote user profile information for user", self.userId);

            return firebaseUser.updateProfile({
                displayName: self.getFullName()
            });
        }

        function createLocalUserProfile(firebase) {

            console.log("Creating local user profile", self.userId);

            return firebase.database().ref("users/" + self.userId).set({
                userId: self.userId,
                firstName: self.firstName,
                lastName: self.lastName,
                email: self.email,
                signupTimestamp: self.signupTimestamp,
                isEnabled: self.isEnabled,
                isAdmin: self.isAdmin,
                completedCases: self.completedCases
            });
        }

        this.exists = function(firebase) {

            var promise = new Promise(function(resolve, reject) {
                firebase
                    .database()
                    .ref('/users/' + self.userId)
                    .once('value')
                    .then(function(userInfo) {
                        var isExistingUser = userInfo.val() != null;
                        resolve(isExistingUser);
                    });
            });

            return promise;
        };

        this.load = function(firebase) {
            var promise = new Promise(function(resolve, reject) {
                firebase
                    .database()
                    .ref('/users/' + self.userId)
                    .once('value')
                    .then(function(userInfo) {
                        self.firstName = userInfo.val().firstName;
                        self.lastName = userInfo.val().firstName;
                        self.email = userInfo.val().email;
                        self.isAdmin = userInfo.val().isAdmin;
                        self.isEnabled = userInfo.val().isEnabled;
                        self.signupTimestamp = userInfo.val().signupTimestamp;
                        self.completedCases = userInfo.val().completedCases || [];

                        resolve();
                    });
            });
            return promise;
        };

        this.createRemoteAccount = function(firebase, onSuccessCallback, onErrorCallback) {

            createLocalUserProfile(firebase)
                .then(function() {
                    onSuccessCallback(self);
                })
                .catch(function(error) {
                    onErrorCallback(self, error);
                });
        };

        this.createLocalAccount = function(firebase, onSuccessCallback, onErrorCallback) {

            var handleUserCreated = function(firebaseUser) {

                self.userId = firebaseUser.uid;

                console.log("User account created successfully", self.userId);

                Promise
                    .all([
                        updateRemoteUserProfile(firebaseUser),
                        createLocalUserProfile(firebase)
                    ])
                    .then(function() {
                        onSuccessCallback(self);
                    })
                    .catch(function(error) {
                        onErrorCallback(self, error);
                    });
            };

            firebase
                .auth()
                .createUserWithEmailAndPassword(self.email, self.password)
                .then(handleUserCreated)
                .catch(function(error) {
                    onErrorCallback(self, error);
                });
        };
    }
    
    return User;
});
