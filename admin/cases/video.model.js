define("VideoModel", ["settings", "utils", "jquery"], function(settings, utils, $) {

    function Video(videoId) {

        this.videoId = videoId;

        var self = this;

        this.delete = function() {

            if (!self.videoId) {
                throw new Error("The video id must not be null");
            }

            console.log("Deleting video with id: " + self.videoId);

            var promise = new Promise(function(resolve, reject) {

                $.ajax({
                    "url": "https://api.vimeo.com/videos/{videoId}".format({ videoId: self.videoId }),
                    "type": "DELETE",
                    beforeSend: function(xhr) {
                        xhr.setRequestHeader("Authorization", "Bearer " + settings.vimeoAccessToken);
                    },
                }).done(function(response) {
                    
                    console.log("DELETE VIDEO SUCCESS", response);
                    
                    resolve();

                }).fail(function(request, error) {
                    
                    reject("Unable to delete the video with id: " + self.videoId);
                });
            });

            return promise;
        };

    }

    return Video;
});
