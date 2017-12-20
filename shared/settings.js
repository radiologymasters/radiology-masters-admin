define("settings", function() {  
    return {
        homeUrl: "../admin/#/",
        loginUrl: "../account",
        unauthorizedUrl: "unauthorized.html",
        signupOAuthUrl: "../account/oauth-signup.html",
        viewCaseUrl: "#/cases/view/",
        updateCaseUrl: "#/cases/update/",
        deleteCaseUrl: "#/cases/delete/",
        
        vimeoClientId: "0ad8cfad61144eb7ace74df7d1ed9b3780abd2a8",
        vimeoClientSecret: "KVW7EiyQRXqqAy8aF8vGmZzcAtGw3pR2e2vmTRjd7uaEn6qHO9mZx2qHHM2OKtwoGJcC5+vS+YklrDgWU6KVt6nNWW34YKUfbHmtyX7d31Mb8w3ZvXO6tAJAPnm1qEf2",
        // The Vimeo access token must have the delete, create and upload scopes.
        vimeoAccessToken: "5f82fbe07a5a1bf1828f37a7f464d90e",
        // This needs to be stored in reverse otherwise GitHub will remove it each time it is checked in.
        gitHubAccessTokenReversed: "91700385406048c11c03c2d4fef4d5bd01b7165a",
        gitHubUsername: "radiologymasters",
        gitHubRepositoryName: "radiology-masters",
        gitHubBranch: "master",
        gitHubRepositoryCaseFileBasePath: "_cases/",
        gitHubMarkDownTemplate: "---\r\nCaseId: {caseId}\r\nTitle: {title}\r\n{speciality}Complexity: {complexity}\r\nVideoUrl: {videoUrl}\r\nAuthor: {author}\r\n---\r\n\r\n{description}",
        gitHubMarkDownTemplateSpecialityTemplate: "Speciality:\r\n",
        gitHubMarkDownTemplateSpecialityItemTemplate: "  - {speciality}\r\n"
    };
});