define(['api', 'common'], function (YM, common, Ant) {
    'use strict';

    var widget = function (p_dom, p_path) {
        this.dom = p_dom;
        this.path = p_path;

        this.api = new YM();
        this.api.API_LIST({
            home: {
                getStatistics: {type: 'POST', dataType: 'JSON', timeout: 60}
            }
        });
    };

    widget.prototype = $.extend(widget.prototype, {
        init: function () {
        },
        dispose: function () {
        }
    });

    return widget;
});