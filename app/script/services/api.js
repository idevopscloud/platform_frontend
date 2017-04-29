/**
 * this requirejs model require jquery, md5
 */
define(['jquery', 'md5'], function ($, md5) {
    'use strict';

    // Cross-Origin Resource Sharing config
    var CORS = cors_config || false;
    var API_HOST = CORS ? cors_config.api_host : false;
    var API_SSL = CORS ? cors_config.api_ssl : false;
    var TEST_DATA_POWER = CORS ? cors_config.isTest : false;//TEST DATA
    var ajax_options = null;

    var YM = {
        // prefix for localstorage name
        API_PREFIX: 'YM_LS:',
        /**
         * api format: /Controller/Action
         */ 
        API_PATTERN: function (ctrl, act) {
            return '/' + ctrl + '/' + act;
        },
        /**
         * check cache timeout time on every api request
         * and refresh api response to cache
         * @param boolean [clean]: whether force refresh cache
         */
        API_CHECK_CACHE: function (clean) {
            var clean = clean || false;

            for (var key in localStorage) {
                //  check if it is a related cache item
                if (YM.API_PREFIX === key.substr(0, 6)) {
                    // force clean
                    if (clean) {
                        localStorage.removeItem(key);
                    }else{
                        // check ttl
                        var item_obj = JSON.parse(localStorage.getItem(key));
                        if (item_obj.ttl && item_obj.ttl <= Date.now()) {
                            // remove timeout cache
                            localStorage.removeItem(key);
                        }
                    }
                }
            }
        },
        // deprecated
        API_REQUIRE: function (api_objects, cb) {
            var wait_list = {};
            var wait_counter = api_objects.length;
            var response_list = [];

            api_objects.forEach(function (api, index) {
                // add each api into a list, waiting for process and record status and response
                wait_list[api] = {status: 'waiting', msg: null, data: null, type:null};
                // load api
                api.load({
                    success: function (msg, data) {
                        // if success, change status and data
                        wait_list[this].msg = msg;
                        wait_list[this].data = data;
                        wait_list[this].status = 'success';
                        wait_counter -= 1;

                        if (0 === wait_counter) {
                            // if all succeed, call with no error
                            cb(null, wait_list);
                        }
                    }.bind(api),
                    else: function (type, msg) {
                        wait_list[this].status = 'else';
                        wait_list[this].type = type;
                        wait_list[this].msg = msg;

                        // if else
                        api_objects.forEach(function (api) {
                            if ('pending' === wait_list[api].status) {
                                // stop pending
                                api.ajax.abort();
                                wait_list[api].status = 'abort';
                            }
                        });

                        // call with wait_list as error
                        cb(wait_list);
                    }.bind(api)
                });

                wait_list[api].status = 'pending';
            })
        },
        // parse all params into object
        /**
         * parse input into object
         * @params string, object [params]
         */
        API_PARAM_PARSE: function (params) {
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

                    // using jquery func to test query_obj
                    // if query_obj is not empty
                    if (!$.isEmptyObject(query_obj)) {
                        return YM.RECURSIVE_PARSE(query_obj);
                    }
                }
            }

            // do not accept other data types
            throw new Error('params format not supported');
        },
        /**
         * replace boolean true value to blank recursively
         * @params object [obj]
         */
        RECURSIVE_PARSE: function (obj) {
            for (var key in obj) {
                if (true === obj[key]) {
                    obj[key] = '';
                } else if (typeof obj[key] === 'object') {
                    obj[key] = YM.RECURSIVE_PARSE(obj[key]);
                }
            }

            return obj;
        }
    }

    /**
     * api construct function
     * @params string [ctrl] controller name
     * @params string [act] action name
     * @params string, object [params] parameters for api request
     * @params object [options] controller name
     */
    var API = function (ctrl, act, params, options, YM) {
        this.YM = YM;
        this.ctrl = ctrl; this.act = act;
        this.ajax = null;

        params = this.YM.API_PARAM_PARSE(params);
        this.params = $.extend({}, params); // use clone instead of copy, avoid refer change effect

        if (ctrl in this.YM.apiList && act in this.YM.apiList[ctrl]) {
            this.api = this.YM.apiList[ctrl][act];

            // overwrite api options like ttl/timeout
            if (!options) options = {};
            this.options = $.extend(options, this.api);

        } else {
            // api not exist in the list
            throw new Error('API not exist: ' + ctrl + '/' + act);
        }
        var apiUrl = this.YM.apiList[ctrl][act]['url'];
        if(apiUrl && apiUrl != ''){
            this.apiPath = '/' + apiUrl;
        }else{
            this.apiPath = this.YM.API_PATTERN(ctrl, act);
        }
    }

    /**
     * api prototype function
     * return request api localstorage key
     */
    API.prototype.storageKey = function () {
        return this.YM.API_PREFIX + this.apiPath + ':' + md5(JSON.stringify(this.params));
    }

    /**
     * api prototype function
     * update api parameters
     * will update old params and add new params
     * @params string, object [pairs]
     */
    API.prototype.update = function (pairs) {
        pairs = this.YM.API_PARAM_PARSE(pairs);
        // copy value into this.params
        for (var key in pairs) {
            this.params[key] = pairs[key];
        }
    }

    /**
     * api prototype function
     * set api parameters
     * will remove old params and set new params
     * @params string, object [pairs] 
     */
    API.prototype.set = function (pairs) {
        pairs = this.YM.API_PARAM_PARSE(pairs);
        // clone pairs into this.params
        this.params = $.extend({}, pairs);
    }

    /**
     * api prototype function
     * remove api localstorage
     */
    API.prototype.clearCache = function () {
        localStorage.removeItem(this.storageKey());
    }

    /**
     * api prototype function
     * reload api
     * @params function [cb] callback for load function
     */
    API.prototype.reload = function (cb) {
        this.clearCache();
        return this.load(cb);
    }

    /**
     * api prototype function
     * check wheather api cache is timeout
     */
    API.prototype.isAlive = function (ttl, timeline) {
        return ttl && (ttl * 1000 > (Date.now() - timeline));
    }

    /**
     * api prototype function
     * handle all api response.flag is not success
     * @params string [type] type name
     * @params string [msg] type message
     */
    API.prototype.defaultElse = function (type, msg) {
        console.log(type, msg);
    }

    /**
     * api prototype function
     * return Xml Http Request object
     */
    API.prototype.getXHR = function () {
        if(this.options.async != undefined || this.options.async != null){
            this.options.async = this.options.async;
        }else{
            this.options.async = true;
        }
        // need to complete request method and params
        ajax_options = {
            url: this.apiPath,
            dataType: this.options.dataType || 'json',
            data: this.params,
            type: this.options.type || 'get',
            cache: false,
            timeout: (this.options.timeout || 30) * 1000,
            async: this.options.async
        }
        if (this.options.jsonpCallback){
            ajax_options.jsonpCallback = this.options.jsonpCallback;
        }
        if(TEST_DATA_POWER){
            ajax_options.dataType = 'json';
            ajax_options.url ='./test'+ ajax_options.url + '.json';
        }else{
            if (API_HOST) {
			    var tokenParam =  localStorage.getItem("token") || '';
                if (API_SSL) {
				    ajax_options.url = 'https://' + API_HOST + ajax_options.url + '?token=' + tokenParam;
                } else {
                    ajax_options.url = 'http://' + API_HOST + ajax_options.url + '?token=' + tokenParam;
                }

                // enable CORS
                // ajax_options.xhrFields = {
                //     withCredentials: true
                // }
                ajax_options.crossDomain = true;
            }
        }
        

        this.ajax = $.ajax(ajax_options);
        
        return this.ajax;
    }

    /**
     * api prototype function
     * process api request
     * @params object [cb] callback function object
     */
    API.prototype.load = function (cb) {

        if (!cb) cb = this.options.cb || {};
        var self = this;

        if (cb && 'beforeSend' in cb) {
            cb['beforeSend']();
        }
        // if not success, call Else
        if (!('else' in cb)) cb.else = this.defaultElse;

        // if ttl > 0, read localCache first
        if (this.options.ttl || this.options.ttl >0) {
            var item = localStorage.getItem(this.storageKey());
            if (item) {
                // cache hit
                var data_obj = JSON.parse(item);
                if (this.isAlive(this.options.ttl, data_obj.ttl)) {
                    // cache alive
                    var res_obj = data_obj.cache;
                    this.onSuccess(res_obj, cb, 'cache');
                    return;
                } else {
                    // cache died
                    this.clearCache();
                }
            }
        }

        this.ajax = this.getXHR();
        this.ajax
        .done(function (res_obj) {
            if (!res_obj) {
                return;
            }
            if (!('flag' in res_obj) || !('msg' in res_obj)) {
                // not supported api format
                // handle global format error here

                if (cb && 'apiError' in cb) {
                    return cb['apiError'](res_obj);
                } else {
                    cb['else']('apiError', 'flag or msg missing in response');
                }
            }

            //当无登录权限需要：需要清空登录信息并且重新登录
            if (res_obj.flag === 'deny'){
                localStorage.removeItem('token');
                localStorage.removeItem('uName');
                localStorage.removeItem('userId');
                localStorage.removeItem('photo');
                window.location.href = "login.html?query="+window.location.hash;
            }

            // cache only when needed
            if (res_obj.flag === 'success' && self.api.ttl && self.api.ttl > 0) {
                localStorage.setItem(self.storageKey(), JSON.stringify({
                    ttl: Date.now() + self.api.ttl * 1000, cache: res_obj
                }));
            }

            self.flag = res_obj.flag;
            self.msg = res_obj.msg;
            self.data = res_obj.data;
            self.code = res_obj.code
            return self.onSuccess(res_obj, cb, 'ajax');
        })
        .fail(function (jqXHR, textStatus) {
            // handle global ajax error

            if (cb && 'ajaxFail' in cb) {
                return cb['ajaxFail'](textStatus);
            } else {
                cb['else']('ajaxFail', textStatus, jqXHR);
            }
        })
        .always(function (jqXHR, textStatus) {
            // handle global ajax complete event
            
            var textStatus = arguments[1] || false;
            if (textStatus && textStatus.indexOf('timeout') != -1) {
                console.log('*****  The network is busy. *****')
            }

            if (cb && 'ajaxComplete' in cb) {
                return cb['ajaxComplete'](textStatus);
            }
        });

        return this.ajax;
    }

    /**
     * api prototype function
     * process api request: on response success
     * @params object [res_obj] api response
     * @params object [cb] callback function object
     * @params string [type] type name
     */
    API.prototype.onSuccess = function (res_obj, cb, type) {
        if ('success' !== res_obj.flag) {
            if ('notSuccess' in cb) {
                cb['notSuccess'](res_obj.flag, res_obj.msg);
            } else {
                cb['else']('responseError: ' + res_obj.flag, res_obj.msg);
            }
        }

        // pre online 2013-9-16
        // if (res_obj.flag === 'fail' && res_obj.msg === 'You do not have the authority to operate!') {
        //     var auth = new Handler();
        //     auth.API_LIST({
        //         Passport: {
        //             getTypeById: {type: 'GET', ttl: 10}
        //         }
        //     });
        //     var auth_read_api = auth.API('Passport', 'getTypeById');
        //     auth_read_api.load({
        //         fail: function(msg, data){
        //             window.location.href = 'login.html?query='+window.location.hash;
        //         }
        //     })
        // }

        if (cb && res_obj.flag in cb) {
            return cb[res_obj.flag](res_obj.msg, res_obj.data, res_obj.code || [], type, res_obj.code);
        }
    }

    /**
     * define a Handler class
     */
    var Handler = function () {
        this.apiList = {};
        this.api = null;
    }

    /**
     * pass api list object to constructor
     * @params object [list]
     */
    Handler.prototype.API_LIST = function (list) {
        this.apiList = list;
    }

    /**
     * create an api instance
     * @params string [ctrl]
     * @params string [act]
     * @params string, object [params]
     * @params object [options]
     */
    Handler.prototype.API = function (ctrl, act, params, options) {
        var self = this;
        this.api = new API(ctrl || '', act || '', params || {}, options || {}, self);

        return this.api;
    }

    /**
     * extend Handler with YM
     */
    Handler.prototype = $.extend(Handler.prototype, YM);

    return Handler;

})

