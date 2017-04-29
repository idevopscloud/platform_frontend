define(['api', 'common',  ], function (YM, common, Ant) {
    'use strict';

    var widget = function (p_dom, p_path) {
        this.dom = p_dom;
        this.path = p_path;
    };

    widget.prototype = $.extend(widget.prototype, {
        init: function (query) {
            var self = this;
        }
    });

    return widget;
});
