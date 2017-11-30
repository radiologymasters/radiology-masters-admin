$.fn.startLoading = function(options) {

    var defaults = {
        message: "Loading, please wait...",
        callback: function () {}
    };
    
    var settings = $.extend(defaults, options);
    
    var parent = this.find(".panel-body");
    var overlay = createOverlay(parent, settings);
    
    overlay.show();
    
    settings.callback();
};

$.fn.stopLoading = function(options) {

    var defaults = {
        delay: 800,
        callback: function () {}
    };
    
    var settings = $.extend(defaults, options);
    var parent = $(this).find(".panel-body");
    var overlay = createOverlay(parent, settings);
    
    overlay.fadeOut(settings.delay, settings.callback);
};

function createOverlay(parent, settings) {
    
    var overlay = parent.find('.panel-overlay');
    if (overlay.length > 0) {
        
        overlay
            .find("span")
            .text(settings.message);
        
        return overlay;
    }
    
    overlay = $("<div/>", { "class": "panel-overlay", "style": "display:none;" });
    
    var message = $("<div/>", { "class": "message" });
    var messageValue = $("<span/>", { text: settings.message });
    var icon = $("<img />", { src: "/admin/img/flask-spinner.gif", "class": "spinner" });
    
    message.append(messageValue, icon);
    overlay.append(message);
    parent.append(overlay);
    
    return overlay;
}