/*========================================================================
#   FileName: api3.0.js
#     Author: Jack
#      Email: fhmily@gmail.com
#   HomePage: http://www.fhmily.com
# LastChange: 2013-05-23 10:20:01
========================================================================*/

(function ($) {
    'use strict';

    // Cross-Origin Resource Sharing config
    var CORS = cors_config || false;
    var API_HOST = CORS ? cors_config.api_host : false;
    var API_SSL = CORS ? cors_config.api_ssl : false;

    /*
     *event list & dict
     */
    var CACHE_PREFIX = 'YM_LS:';
    var EV_LIST = ['success', 'fail', 'error', 'fatal', 'finish', 'others'];
    var EV_DICT = {}; EV_LIST.forEach(function (ev) { EV_DICT[ev] = true; });

    var LPOOL = {
        /*storageKey: api_loader*/
    };

    /*
     *Common Functions
     */

    /*restful webservice url pattern, modify if needed*/
    function DEFAULT_URL_PATTERN (ctrl, act) {
        return '/' + ctrl + '/' + act;
    }

    /*parse acceptable params formats into js objects*/
    function PARAM_PARSE (params) {
        // return {} if undefined or null
        if (!params) return {};

        // return if params is object
        if ('object' === typeof params) return params;

        // if string, test JSON or query format
        if ('string' === typeof params) {
            try {
                return JSON.parse(params);
            } catch (e) {
                var query_obj = $.query.load('?' + params).keys;

                if (!$.isEmptyObject(query_obj)) {
                    return RECURSIVE_PARSE(query_obj);
                }
            }
        }

        // do not accept other data types
        throw new Error('params format not supported');
    }

    // recursive to replace boolean true value to blank
    function RECURSIVE_PARSE (obj) {
        for (var key in obj) {
            if (true === obj[key]) {
                obj[key] = '';
            } else if (typeof obj[key] === 'object') {
                obj[key] = RECURSIVE_PARSE(obj[key]);
            }
        }

        return obj;
    }

    function API_CLEAN_CACHE () {
        for (var key in localStorage) {
            //  check if it is a related cache item
            if (CACHE_PREFIX === key.substr(0, 6)) {
                localStorage.removeItem(key);
            }
        }
    }

    /*key used in localStorage, combined with CACHE_PREFIX, DEFAULT_URL_PATTERN & JSONlized params*/
    function StorageKey (ctrl, act, params) {
            return CACHE_PREFIX + DEFAULT_URL_PATTERN(ctrl, act) + ':' + md5( JSON.stringify( PARAM_PARSE(params) ) );
    }

    /*check if a record is alive according to ttl and storage timestamp*/
    function IsAlive (ttl, timestamp) {
        var now = Date.now();

        return (now - timestamp) < ttl ? true : false;
    }

    /*
     *Loader: globally cached api loader, singleton structure for single storagekey
     */
    function Loader (ctrl, act, params, conf) {
        this.storageKey = StorageKey(ctrl, act, params || {});
        this.apiPath = DEFAULT_URL_PATTERN(ctrl, act);
        this.params = params || {};
        this.conf = conf || {};
        this.listeners = [];
        this.status = 'inited';
    }

    Loader.prototype = {
        constructor: Loader,
        bind: function (request) { // bind requests as listeners when loader get result from remote api
            // 问题：如果在request里load多次，会向load.listeners里push入多个request，导致重复的监听callback
            this.listeners.push(request);

            switch (this.status) {
                case 'inited':
                case 'fail':
                    this._ajax();
                    break;
                case 'success':
                    request.onData(this.res_obj);
                    break;
                case 'pending':
                    break;
                default:
                    throw new Error('unknow status in Loader');
                    break;
            }
        },
        unbind: function (request) { // remove certain request from the listeners list
            this.listeners.forEach(function (re, index) {
                if (request === re) this.listeners.splice(index, 1);
            }.bind(this));

            if (0 === this.listeners.length) delete LPOOL[this.storageKey];
        },
        _error: function (error) {
            this.listeners.forEach(function (request) {
                request.onError(error);
            });
        },
        _always: function() {
            this.listeners.forEach(function(request) {
                request.onFinish();
            });
        },
        _ajax: function () { // execute ajax api activities
            // if ttl > 0, read localCache first
            if (this.conf.ttl || this.conf.ttl >0) {
                var item = localStorage.getItem(this.storageKey);
                if (item) {
                    // cache hit
                    var data_obj = JSON.parse(item);
                    if (IsAlive(this.conf.ttl, data_obj.ttl)) {
                        // cache alive
                        var res_obj = data_obj.cache;
                        this._onData(res_obj, 'cache');
                        return;
                    }
                }
            }

            // need to complete request method and params
            var ajax_options = {
                url: this.apiPath,
                dataType: this.conf.dataType || 'json',
                data: this.params,
                type: this.conf.type || 'get',
                cache: false,
                timeout: (this.conf.timeout || 30) * 1000
            };

            // if host is set, use CORS
            if (API_HOST) {
                if (API_SSL) {
                    ajax_options.url = 'https://' + API_HOST + ajax_options.url;
                } else {
                    ajax_options.url = 'http://' + API_HOST + ajax_options.url;
                }

                // enable CORS
                ajax_options.xhrFields = {
                    withCredentials: true
                };
                ajax_options.crossDomain = true;
            }

            this.ajax = $.ajax(ajax_options);

            this.status = 'pending';

            // cache loader object in "LPOOL"
            //LPOOL[this.storageKey] = this;

            // 200 response
            this.ajax.done(function (res_obj) {
                console.log(res_obj);
                if (!('flag' in res_obj) || !('msg' in res_obj)) {
                    // not supported api format
                    // handle global format error here

                    this._error('ajax response missing field: "flag" || "msg"');
                } else {
                    this.status = 'success';
                    this.res_obj = res_obj;
                    // cache only when needed
                    if (res_obj.flag === 'success' && this.conf.ttl && this.conf.ttl > 0) {
                        localStorage.setItem(this.storageKey, JSON.stringify({
                            ttl: Date.now() + this.conf.ttl * 1000, cache: res_obj
                        }));
                    }

                    //if have no authority, then check if is logined
                    if (res_obj.flag === 'fail' && res_obj.msg === 'You do not have the authority to operate!') {
                        var isLogined = new API({
                            Passport: {
                                getTypeById: {type: 'GET', ttl: 10}
                            }
                        });
                        
                        var isLogined_check = isLogined.Passport.getTypeById();
                        isLogined_check.on({
                            fail: function(msg, data) {
                                window.location.href = 'login.html';
                            }
                        }).load();
                    }
                    
                    this._onData(res_obj, 'ajax');
                }
            }.bind(this));

            // Error
            this.ajax.fail(function (jqXHR, textStatus) {
                this.status = 'fail';
                // handle global ajax error
                this._error('Ajax request failed with textStatus: ' + textStatus);
            }.bind(this));

            // always
            this.ajax.always(function() {
                var textStatus = arguments[1] || false;
                if (textStatus && textStatus.indexOf('timeout') != -1) {
                    // var pop_up = $('<div class="dypop-up alert-info"><strong>INFO: </strong> Request API ('+ ajax_options.url.replace((API_SSL ? 'https://' : 'http://') + API_HOST, '') +') Timeout.</div>');
                    var pop_up = $('<div class="dypop-up alert-info"><strong>INFO: </strong> The network is busy.</div>');
                    $('body').prepend(pop_up);
                    pop_up.show().delay(5000).animate({height:0, opacity:0}, {duration: 300, complete: function(){$(this).remove()}});
                }
                this._always();
            }.bind(this));
        },
        _onData: function (res_obj, type) {
            this.listeners.forEach(function (request) {
                request.onData(res_obj);
            });
        }
    };

    function LoaderFactory (ctrl, act, params, conf, force_reload) {
        var storageKey = StorageKey(ctrl, act, params);

        if (storageKey in LPOOL) {
            if (force_reload) LPOOL[storageKey].status = 'inited';
            return LPOOL[storageKey];
        }

        var loader_instance = new Loader(ctrl, act, params, conf);
        LPOOL[storageKey] = loader_instance;

        return loader_instance;
    }

    /*
     *Request
     */
    function Request (ctrl, act, conf) {
        this.ctrl = ctrl; this.act = act; this.conf = conf;
        this.params = {}; this.ev_listener = {};
    }

    Request.prototype = {
        constructor: Request,
        setParam: function (pairs) {
            this.params = PARAM_PARSE(pairs);

            return this;
        },
        updateParam: function (pairs) {
            pairs = PARAM_PARSE(pairs);
            // copy value into this.params
            for (var key in pairs) {
                this.params[key] = pairs[key];
            }
            return this;
        },
        on: function (ev_list) {
            for (var ev in ev_list) {
                var handler = ev_list[ev];
                var type = 'always';

                /*if ev_name ended with 'Once', add listener only execute once*/
                if ('Once' === ev.substr( -4 )) {
                    type = 'Once';
                    ev = ev.substr(0, ev.length - 4);
                }

                this._addListener(ev, handler, type);
            }

            return this;
        },
        off: function () {
            if (this.loader) {
                this.loader.unbind(this);
            }

            return this;
        },
        load: function (force_reload) {
            this.loader = LoaderFactory(this.ctrl, this.act, this.params, this.conf, force_reload);
            this.loader.bind(this);

            return this;
        },
        getXHR: function () {
            return this.loader.ajax;
        },
        onData: function (res_obj) {
            var args = []; args.push(res_obj.msg);
            if (res_obj.data) args.push(res_obj.data);

            this._fireListener(res_obj.flag, args);
            this._fireListener('finish');
        },
        onError: function (error) {
            this._fireListener('fatal', [error]);
            this._fireListener('finish', [error]);
        },
        onFinish: function() {
            this._fireListener('finish');
        },
        _addListener: function (ev, handler, type) { // handler will be triggered if ev happened
            if (!this.ev_listener[ev]) {
                this.ev_listener[ev] = [];

                /*default event type should be 'once' or 'always'*/
                this.ev_listener[ev].push({handler: handler, enable: true, type: type || 'always'});
            }
        },
        _fireListener: function (ev, args) { // fire event listeners binded on certain event
            if (ev in this.ev_listener) {
                this.ev_listener[ev].forEach(function (listener) {
                    if ('Once' === listener.type) {
                        listener.enable = false;
                    }

                    listener.handler.apply(listener, args);
                });
            }
        }
    };

    /*
     * API manager
     */
    function API (api_list) {
        this.api_list = api_list;
        this.api_ins = [];

        /*use api_list build oop style api accessers*/
        for (var ctrl in api_list) {
            this[ctrl] = {};
            for (var act in api_list[ctrl]) {
                this[ctrl][act] = function (ctrl, act, conf) {
                    return function (params) {
                        var request_ins = new Request(ctrl, act, conf, params);
                        this.api_ins.push(request_ins);
                        return request_ins;
                    }.bind(this);
                }.bind(this)(ctrl, act, api_list[ctrl][act]);
            }
        }
    }

    API.prototype = {
        constructor: API,
        off: function () {
            this.api_ins.forEach(function (request) {
                request.off();
            });
        },
        require: function () {
        },
        clean_cache: function () {
            API_CLEAN_CACHE();
        }
    };

    if (typeof define === 'function' && define.amd) {
        define(function () {
            return API;
        });
    } else {
        $.fn.API = API;
    }

}(window.jQuery));
