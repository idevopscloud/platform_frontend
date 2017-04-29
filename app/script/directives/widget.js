(function ($) {
    'use strict';
    
    if (!$) throw new Error('widget lib erro: need jQuery');

    var Widget = function (dom, settings) {
        this.dom = dom; settings = settings || {};
        this.noCache = ['', 'index/header', 'index/title'];
        this.noCacheScript = '';
        this.randomId = function () {
            return Array.apply(0, Array(15)).map(function() {
                return (function(charset){
                    return charset.charAt(Math.floor(Math.random() * charset.length));
                }('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'));
            }).join('');
        }();

        // get attributes start with widget- as start settings
        var dom_settings = {};
        var ajax_settings = {};

        $.each(dom.attributes, function(index, attr) {
            if ('widget-' === attr.name.substr(0, 7).toLowerCase()) dom_settings[attr.name.substr(7)] = attr.value;
            if ('ajax-' === attr.name.substr(7).substr(0, 5)) ajax_settings[attr.name.substr(12)] = attr.value;
        }); 

        // overwrite dom_settings with settings
        this.settings = $.extend(dom_settings, settings);

        var default_ajax_settings = {
            timeout: 60000, cache: true, type: 'GET'
        };

        this.ajax_settings = $.extend(default_ajax_settings, ajax_settings);

        this.basePath = this.settings.basePath || '';
        this.loading = {};
        this.loaded = {};

        this.interval_pool = []; this.timeout_pool = [];
    }


    Widget.prototype = $.extend(Widget.prototype, {
        create: function (cb, args) {
            this.cb = cb || this.ready;
            this.args = args || {};

            if ('package' in this.settings) {
                // package mode:
                // JS: basePath/script.js
                // CSS: basePath/style.css
                // HTML: basePath/tpl.html

                var path = this.basePath + this.settings.package;
                if ('/' !== path.substr(-1)) path += '/';

                this.loading.script = path + 'script.js';
                this.loading.style = path + 'style.css';
                this.loading.tpl = path + 'tpl.html';
                var _packageName = this.settings.package;
                var _noCache = this.noCache;
                var _hasCache = _noCache.indexOf(_packageName);
                if (_hasCache < 0) {
                    this.noCacheScript = this.loading.script;
                }
                $('style[data_clear]').remove();

            } else {
                ['script', 'style', 'tpl'].forEach(function (type) {
                    if (type in this.settings) {
                        this.loading[type] = this.basePath + this.settings[type];
                    }
                }.bind(this));
            }
            
            //规避select2 插件bug
            $('.select2-drop, .select2-drop-mask').remove();
            this.loadWidget();

            return this;
        },

        destroy: function () {
            // destroy priorities: script -> dom -> css
            if (this.widgetInstance) {
                try {
                    this.interval_pool.forEach(function (timer) {
                        clearInterval(timer);
                    });
                    this.timeout_pool.forEach(function (timer) {
                        clearTimeout(timer);
                    });
                    this.widgetInstance.dispose();
                } catch (e) {
                    console.log('widget destroy Exception:' + e);
                }
            }

            if (this.widgetStyle) $(this.widgetStyle).remove();
            if (this.dom) $(this.dom).remove();
        },
        flush: function() {
            $('script[src="'+ this.noCacheScript+'"]').remove();
        },

        setInterval: function (handler, interval) {
            this.interval_pool.push(setInterval(handler, interval));
        },

        setTimeout: function (handler, interval) {
            this.timeout_pool.push(setTimeout(handler, interval));
        },

        ready: function () {
        },

        fail: function (err) {
            // $(this.dom).remove();
            this.cb();
            console.log(err);
            // todo comment this line after debuged
            throw err;
        },

        loadWidget: function () {
            // TODO: check this.settings.type (default: in)
            // in || before || after || replace

            // load html -> css -> js
            //

            if (this.loading.tpl) {
                this.loadHTML(this.loading.tpl, this.dom, function (err, dom) {
                    if (err) {
                        console.log('tpl load error: ' + this.loading.tpl);
                        this.fail(err);
                        this.loadWidget();//by scot
                    } else {
                        this.loaded.tpl = this.loading.tpl;
                        delete(this.loading.tpl);
                        
                        if (this.loading.style) {
                            this.loadCSS(this.loading.style, function (err, errMsg) {
                                if(err){
                                    this.loadCSS(this.loading.style, this.dataLoaded());
                                }else{
                                    this.dataLoaded()
                                }
                            }.bind(this));
                        } else {
                            this.dataLoaded();
                        }
                    }
                }.bind(this))
            } else {
                if (this.loading.style) {
                    this.loadCSS(this.loading.style, function (err, errMsg) {
                        if(err){
                            this.loadCSS(this.loading.style, this.dataLoaded());
                        }else{
                            this.dataLoaded()
                        }
                    }.bind(this));
                } else {
                    this.dataLoaded();
                }
            }

        },

        dataLoaded: function (err) {
            if (err) {
                this.fail(err);
            } else {
                // load js here
                if ('function' === typeof requirejs) {
                    this.flush();//清除页面重复widget
                    requirejs([this.loading.script], function (handler) {
                        if (handler) {
                            this.loaded.script = this.loading.script;
                            delete(this.loading.script);
                            if ('function' === typeof handler) {
                                try {
                                    var widget = this.widgetInstance = new handler(this.dom, this.settings);
                                    widget.init(this.args);
                                    $('body').scrollTop(0);
                                } catch (e) {
                                    this.fail(e);
                                }
                            }
                            this.cb();
                        } else {
                            this.fail('script load error: ' + this.loading.script);
                        }
                    }.bind(this));
                } else {
                    // manually
                    $.getScript(this.loading.script)
                    .done(function (script) {
                        this.loaded.script = this.loading.script;
                        delete(this.loading.script);
                        this.cb();
                    })
                    .fail(function (xhr, settings, exception) {
                        this.fail([xhr, settings, exception]);
                    })
                }
            }

        },

        insertCSS: function (css, randomId) {
            // avoid css conflict
            var new_css = css.replace(/^(.*?)({.*?)$/gm, function (match, p1, p2) {
                // use /*keep*/ after the css you don't want to add the random id
                if ("/*keep*/" === match.substr(-8)) {
                    return match;
                }
                // add randomId to the css, avoid css conflict
                return match.split(',').map(function (value) {
                    return '#tpl_' + randomId + ' ' + value;
                }).join(', ');
            });

            // loaded widget use css_randomId as it's css id
            var container = this.widgetStyle = $("#" + randomId);

            var _packageName = this.settings.package;
            var _noCache = this.noCache;
            var _hasCache = _noCache.indexOf(_packageName);
            var _attr = {
                media: 'all',
                type: 'text/css',
                id: randomId
            }

            if (_hasCache < 0) {
                _attr.data_clear = 'yes';
            }

//            if (!container.length) {
//                container = $("<style></style>").appendTo('head').attr(_attr);
//            }

            container = $('<style>'+ new_css +'</style>').appendTo('head').attr(_attr);
            // add styleSheet
//            var containerDomElem = container[0];
//            if (containerDomElem.styleSheet !== undefined && containerDomElem.styleSheet.cssText !== undefined) { // IE
//                containerDomElem.styleSheet.cssText = new_css;
//            } else {
//                container.text(new_css); //Others
//            }

            return container;
        },

        loadCSS: function (path, cb) {
            path += "?"+requirejs.s.contexts._.config.urlArgs;
            // load css by ajax from given url path
            $.ajax(
                $.extend({url: path, dataType: 'text'}, this.ajax_settings)
            )
            .done(function (css) {
                var dom = this.insertCSS(css, this.randomId);
                this.loaded.style = this.loading.style;
                delete(this.loading.style);
                cb(null, dom);
            }.bind(this))
            .fail(function (xhr, errMsg, err) {
                console.log('style load error: ' + this.loading.style);
                cb([xhr, errMsg, err]);
            }.bind(this));

        },

        loadHTML: function (path, dom, cb) {
            path += "?"+requirejs.s.contexts._.config.urlArgs;
            // load html by ajax from given url path
            $.ajax(
                $.extend({url: path, dataType: 'HTML'}, this.ajax_settings)
            )
            .done(function (html) {
                $(dom).html(html);
                $(dom).attr('id', 'tpl_' + this.randomId);
                cb(null, dom);
            }.bind(this))
            .fail(function (xhr, errMsg, err) {
                cb([xhr, errMsg, err]);
            })
        }
    })

    if (typeof define === 'function' && define.amd) {
        define(function () {
            return Widget;
        });
    } else {
        $.fn.Widget = Widget;
    }
}(window.jQuery))
