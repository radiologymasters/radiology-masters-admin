define("VideoModel", ["settings", "utils", "jquery"], function(settings, utils, $) {

    function Video(videoId) {

        this.videoId = videoId;
        this.thumbnails = null;
        this.processingStatus = null;

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

        this.getThumbnails = function() {

            if (!self.videoId) {
                throw new Error("The video id must not be null");
            }

            var promise = new Promise(function(resolve, reject) {
                $.getJSON('https://www.vimeo.com/api/v2/video/' + self.videoId + '.json?callback=?', { format: "json" }, function(data) {
                    self.thumbnails = {
                        largeUrl: data[0].thumbnail_large,
                        mediumUrl: data[0].thumbnail_medium,
                        smallUrl: data[0].thumbnail_small
                    };
                    resolve(self.thumbnails);
                })
                .fail(function(jqXHR, textStatus, errorThrown) {
                    reject(errorThrown);
                });
            });

            return promise;
        }

        this.getProcessingStatus = function() {

            if (!self.videoId) {
                throw new Error("The video id must not be null");
            }

            var promise = new Promise(function(resolve, reject) {
                $.ajax({
                    method: "GET",
                    url: "https://api.vimeo.com/videos/" + self.videoId + "?fields=status",
                    beforeSend: function(request) {
                        var bearerToken = "Bearer " + settings.vimeoAccessToken;
                        request.setRequestHeader("Authorization", bearerToken);
                    },
                }).done(function(response) {
                    self.processingStatus = response.status;
                    resolve(self.processingStatus);
                }).fail(function(jqXHR, textStatus, errorThrown) {
                    reject(errorThrown);
                });
            });

            return promise;
        }

    }

    return Video;
});
