require(["settings", "jquery", "loading"], function(settings, $) {
    
    $(function () {

        firebase.auth().onAuthStateChanged(function(firebaseUser) {
            
            if (firebaseUser) {
                
                load(function () {
                    var user = new User();
                    user.userId = firebaseUser.uid;
                    
                    user.load(firebase).then(function () {
                        $(document).trigger("user-authenticated", user)
                    });
                    
                });
                
            } else {
                $(document).trigger("user-unauthenticated");
            }
        });
        
        $(document).on("user-logout", function () {
            firebase.auth().signOut();
        });
    });
    
    function User() {
        this.userId = "";
        this.firstName = "";
        this.lastName = "";
        this.displayName = "";
        this.email = "";
        this.signupDate;
        this.isEnabled = false;
        this.completedCases = [];
        
        var self = this;
        
        this.load = function(firebase) {
        
            var promise = new Promise(function(resolve, reject) {
                
                firebase
                    .database()
                    .ref('/users/' + self.userId)
                    .once('value')
                    .then(function(userInfo) {
                        
                        self.firstName = userInfo.val().firstName;
                        self.lastName = userInfo.val().lastName;
                        self.displayName = toTitleCase(self.firstName + " " + self.lastName);
                        self.email = userInfo.val().email;
                        self.isAdmin = userInfo.val().isAdmin;
                        self.isEnabled = userInfo.val().isEnabled;
                        self.signupTimestamp = new Date(userInfo.val().signupTimestamp);
                        self.completedCases = userInfo.val().completedCases || [];
                        
                        resolve();
                    });
            });
            
            return promise;
        };
        
        this.hasCompletedCase = function (caseId) {
            if (!self.completedCases) {
                return false;
            }
    
            return self.completedCases.indexOf(caseId) > -1;
        };
        
        this.markCaseAsComplete = function (firebase, caseId) {
            
            var promise = new Promise(function(resolve, reject) {
                if (self.completedCases.indexOf(caseId) > -1) {
                    resolve();
                    return;
                }
                
                self.completedCases.push(caseId);
                
                firebase.database()
                    .ref("users/" + self.userId + "/completedCases")
                    .set(self.completedCases)
                    .then(resolve)
                    .catch(reject);
            });
            
            return promise;
        };
        
        this.markCaseAsUncomplete = function (firebase, caseId) {
        
            var promise = new Promise(function(resolve, reject) {
            var caseIndex = self.completedCases.indexOf(caseId);
                
                
            if (caseIndex == -1) {
                resolve();
                return;
            }
            
            self.completedCases.splice(caseIndex, 1);
            
            firebase.database()
                .ref("users/" + self.userId + "/completedCases")
                .set(self.completedCases)
                .then(resolve)
                .catch(reject);
        });
        
        return promise;
    };
        
        function toTitleCase(value)
        {
            return value.replace(/\w\S*/g, function(text){
                return text.charAt(0).toUpperCase() + text.substr(1).toLowerCase();
            });
        }
    }
    
    function loadAllCases() {
        var promise = new Promise(function(resolve, reject) {
            firebase
                .database()
                .ref('/cases')
                .once('value')
                .then(function(data) {
                        var cases = data.val();
                        console.log("Cases loaded", cases);
                        
                        resolve(cases);
                });
        });
        return promise;
    }
    
    function load(callback) {
        var container = $("#test-container");
        var list = $("#cases");
        
        container.startLoading();
        
        loadAllCases().then(function (cases) {
            
            for(var key in cases) {
                var caseInfo = cases[key];
                
                var li = $("<li/>", { style: "padding:5px;" });
                
                var title = $("<span/>", { text: caseInfo.title, style: "margin-right:20px;" });
                var button = $("<a/>", { "class": "mark-as-complete", "data-caseId": caseInfo.caseId });
                
                li.append(title, button);
                
                list.append(li);
            }
            
            $(".mark-as-complete").each(function(index) {
                var caseId = $(this).data("caseid");
                console.log(caseId);
                $(this).markComplete({ 
                    "caseId": caseId
                });
            });
            
            container.stopLoading();
            
            callback();
        })
        .catch(function (error) {
            console.error(error);
        });
        
        $("#overall-progress").displayProgress();
        
        $("#musculoskeletal-progress").displayProgress({
            speciality: "Gastrointestinal"
        });
    }
});