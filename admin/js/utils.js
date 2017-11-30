define("utils", function() {  
    
    function _guid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0,
                v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    
    function _getRouteParamValue(url) {
        var urlParts = url.split("/");
        var paramIndex = urlParts.length;
        return urlParts[paramIndex -1];
    }
    
    return {
        getRouteParamValue: _getRouteParamValue,
        guid: _guid
    };
});

String.prototype.format = function (o) {
    return this.replace(/{([^{}]*)}/g,
        function (a, b) {
            var r = o[b];
            return typeof r === 'string' || typeof r === 'number' ? r : a;
        }
    );
};