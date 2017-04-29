define(['api', 'common', 'json.human', 'select2', 'select2.lang.zh', 'pages', 'jquery.validate', 'validate_localization/messages_zh', 'filesaver', 'semantic'], function(YM, common, JsonHuman) {
    'use strict';

    var widget = function(p_dom, p_path) {
        this.dom = p_dom;
        this.path = p_path;

        this.api = new YM();
        this.api.API_LIST({
            user: {
                info: {
                    type: 'GET',
                    dataType: 'JSON',
                    timeout: 60,
                    url: 'v1/user/mime'
                }
            },
            app: {
                list: {
                    type: 'GET',
                    dataType: 'JSON',
                    timeout: 60,
                    url: 'third/app/apps'
                },
            },
            registries: {
                build: {
                    type: 'POST',
                    dataType: 'JSON',
                    timeout: 60,
                    url: 'third/registry/base_image'
                },
                list: {
                    type: 'GET',
                    dataType: 'JSON',
                    timeout: 60,
                    url: 'third/registry/registries'
                },
                destroy_image: {
                    type: 'DELETE',
                    dataType: 'JSON',
                    timeout: 60,
                    url: 'third/registry/registries'
                },
            },
            posts: {
                list: {
                    type: 'GET',
                    dataType: 'JSON',
                    timeout: 60,
                    url: 'third/registry/posts'
                },
                stop_build: {
                    type: 'POST',
                    dataType: 'JSON',
                    timeout: 60,
                    url: 'third/registry/posts'
                },
            },
            console: {
                log: {
                    type: 'GET',
                    dataType: 'JSON',
                    timeout: 60,
                    url: 'third/registry/console'
                }
            },
            clusters: {
                list: {
                    type: 'GET',
                    dataType: 'JSON',
                    timeout: 60,
                    url: 'third/app/app/clusters'
                },
            }
        });

        this.api.loadHooks = {
            beforeSend: function() {},
            fail: function(msg, data, code) {
                try {
                    msg = JSON.parse(msg);
                } catch (e) {
                    console.log(e);
                }
                if (typeof msg == 'object') {
                    var msgs = '';
                    $.each(msg, function(field, error) {
                        msgs += error + "\n";
                    });
                    msg = msgs;
                }
                common.msgs.pop_up(msg, 'error');
            },
            ajaxFail: function(msg) {
                common.msgs.pop_up(msg, 'error');
            },
            ajaxComplete: function(textStatus) {}
        }
    };

    widget.prototype = $.extend(widget.prototype, {
        init: function(query) {
            var self = this;
            self.images = {};
            self.registry_id = null;
            self.preLoad();
            self.bindEvent();
            $.fn.extend({
                textAreaAutoSize: function() {
                    var text = $(this).val(),
                        matches = text.match(/\n/g),
                        breaks = matches ? matches.length : 2;
                    $(this).attr('rows', breaks + 4);
                    return $(this);
                }
            });
        },
        preLoad: function() {
            var self = this;
            self.getUserInfo();
            self.getPosts();
            self.loadBaseImages();
        },
        getUserInfo: function() {
            var self = this;
            var userInfoApi = self.api.API('user', 'info');
            var hooks = $.extend({}, self.api.loadHooks);
            hooks.beforeSend = function() {};
            hooks.success = function(msg, data) {
                self.company = data.company_id;
            }
            userInfoApi.options.async = false;
            userInfoApi.load(hooks);
        },
        getPosts: function() {
            var self = this;
            var postsListApi = self.api.API('posts', 'list', {
                type: 'base_img'
            });
            var hooks = $.extend({}, self.api.loadHooks);
            hooks.beforeSend = function() {
                common.loading.show($(".post-panel"));
            };
            hooks.success = function(msg, data) {
                var box = $("#post-box").empty();
                if (data.data && data.data.length > 0) {
                    $.each(data.data, function(n, post) {
                        var status_style = "";
                        var stop_build = "";
                        switch (post.status) {
                            case 0:
                                {
                                    post.status = "PENDING";
                                    break;
                                }
                            case 1:
                                {
                                    post.status = "IN_PROGRESS";
                                    stop_build = "<button class='btn btn-red btn-default btn-fill-horz stop-build'>停止构建</button>"
                                    break;
                                }
                            case 2:
                                {
                                    post.status = "FAILURE";
                                    break;
                                }
                            case 4:
                                {
                                    post.status = "ABORTED";
                                    break;
                                }
                            case 8:
                                {
                                    post.status = "SUCCESS";
                                    break;
                                }
                            default:
                                {
                                    post.status = '-';
                                    break;
                                }
                        }
                        var tr = "<tr class='console-listener' data-id='" + post.id + "' data-build-num='" + post.build_num + "'>\
                            <td>" + post.image + ":" + post.tag + "</td>\
                            <td class='" + post.status.toLowerCase() + "'>" + post.status + "</td>\
                            <td>" + post.base_image + "</td>\
                            <td>" + post.user_name + "</td>\
                            <td>" + post.created_at + "</td>\
                            <td>\
                                <button class='btn btn-default show-console " + (post.build_num ? "btn-green btn-fill-horz" : "disabled") + "'>构建日志</button>\
                                " + stop_build + "\
                            </td>\
                        </tr>";
                        box.append(tr);
                    });
                }
            };
            hooks.ajaxComplete = function() {
                common.loading.hide(".post-panel");
            };
            postsListApi.load(hooks);
        },
        loadBaseImages: function() {
            var self = this,
                getRegistryApi = self.api.API('registries', 'list', {name: 'platform'}),
                hooks = $.extend({}, self.api.loadHooks);
            hooks.success = function(msg, data) {
                /*if (data.clusters) {
                    $('#cluster').empty();
                    $.each(data.clusters, function(i, cluster){
                        $("#cluster").append($("<option>").text(cluster.name).val(cluster.registry_id));
                    });
                    $('#cluster').select2({minimumResultsForSearch: -1,width: '100%'})
                        .on('select2:select', function(){
                            self.registry_id = $(this).val();
                            self.getLibBaseImages(self.registry_id);
                            self.getUserBaseImages(self.registry_id);
                        })
                        .trigger('select2:select');
                }*/
                if (data.id) {
                    self.registry_id = data.id;
                    self.getLibBaseImages(data.id);
                    self.getUserBaseImages(data.id);
                }
            };
            getRegistryApi.load(hooks);
        },
        getLibBaseImages: function(registry_id) {
            var self = this,
                imgListApi = self.api.API('registries', 'list', {
                    action: 'images',
                    type: 'lib'
                }),
                hooks = $.extend({}, self.api.loadHooks);
            imgListApi.apiPath += '/' + registry_id;
            hooks.beforeSend = function() {};
            hooks.success = function(msg, data) {
                var img_sel = $("#select_base_image");
                img_sel.empty().select({width: '100%'}).select2('data', {});
                if (data.images && data.images.length > 0) {
                    $.each(data.images, function(n, img) {
                        self.images[img.name] = img.tags;
                        img_sel.append($("<option>").val(img.name).text(img.short_name));
                    });
                    img_sel.select2({width: '100%'}).trigger('select2:select');
                }
            };
            imgListApi.load(hooks);
        },
        getUserBaseImages: function(registry_id) {
            var self = this,
                box = $('#image-box').empty(),
                namespace = self.company,
                imgListApi = self.api.API('registries', 'list', {
                    action: 'images',
                    type: 'app_base',
                    app_name: namespace
                }),
                hooks = $.extend({}, self.api.loadHooks);
            imgListApi.apiPath += '/' + registry_id;
            hooks.beforeSend = function() {
                common.loading.show($(".image-panel"));
            };
            hooks.success = function(msg, data) {
                if (data.images && data.images.length > 0) {
                    $.each(data.images, function(n, img) {
                        var rowspan = '';
                        if (img.tags.length !== 1) {
                            rowspan = 'rowspan="' + img.tags.length + '"';
                        }
                        var str = '<tr data-namespace="' + namespace + '" data-name="' + img.short_name + '" data-registry="' + registry_id + '">\
                                <td ' + rowspan + '>' + img.short_name + '</td>';

                        $.each(img.tags, function(j, tag) {
                            if (!tag.user_name) {
                                tag.user_name = tag.created_at = '-';
                            }
                            if (j != 0)
                                str += '<tr data-namespace="' + namespace + '" data-name="' + img.short_name + '" data-registry="' + registry_id + '">';
                            str += '<td>' + tag.name + '</td>\
                                <td>' + tag.user_name + '</td>\
                                <td>' + tag.created_at + '</td>\
                                <td>\
                                    <button data-tag="' + tag.name + '"" class="btn btn-green btn-default btn-fill-horz image-detail" data-loading-text="Dockerfile <i class=\'fa fa-circle-o-notch fa-spin\'></i>">\
                                        Dockerfile <i class="fa fa-info-circle" aria-hidden="true"></i>\
                                    </button>\
                                    <button data-tag="' + tag.name + '"" class="btn btn-red btn-default btn-fill-horz image-destroy">删除</button>\
                                </td>\
                            </tr>';
                        });

                        box.append(str);
                    });
                }
            };
            hooks.ajaxComplete = function() {
                common.loading.hide(".image-panel");
            };
            imgListApi.load(hooks);
        },
        buildImage: function(params) {
            var self = this;
            params['registry_id'] = self.registry_id;
            params['namespace'] = self.company;
            var registryBuildApi = self.api.API('registries', 'build', params);
            var hooks = $.extend({}, self.api.loadHooks);
            hooks.success = function(msg, data) {
                $('#modal-setting').modal('hide');
                common.msgs.pop_up("发起构建成功", 'success');
                self.getPosts();
            };
            registryBuildApi.load(hooks);
            $('#modal-setting').modal('hide');
        },
        bindEvent: function() {
            var self = this,
                close = 0,
                start = 0,
                url,
                xhr = new XMLHttpRequest(),
                reconnect = function(url) {
                    xhr.open('GET', url + "&start=" + start, true);
                    xhr.onprogress = function() {
                        if (xhr.readyState != 2 && xhr.readyState != 3 && xhr.readyState != 4)
                            return;
                        if (xhr.readyState == 3 && xhr.status != 200) {
                            close = 1;
                            return;
                        }

                        start = xhr.getResponseHeader('x-text-size');
                        var info = xhr.response.replace(/\\r\\n|\\n|\\r/g, "<br />").replace(/["]+/g, '');
                        if (info == 'false') {
                            return;
                        }
                        $("<div>").html(info).hide().appendTo(".console-log").fadeIn(1500);
                        setTimeout(function() {
                            $('.console-log').show().animate({
                                scrollTop: $(".console-log").prop('scrollHeight')
                            }, 1000)
                        }, 1000);
                        if (info.search('Finished:') > 0) {
                            close = 1;
                        }
                    }
                    xhr.send();
                };
            xhr.onload = function() {
                console.log("reconnecting...");
                if (!close) {
                    setTimeout(function(){reconnect(url);}, 3000);
                }
            }
            xhr.onerror = function() {
                console.log("reconnecting after error...");
                if (!close)
                    reconnect(url);
            }
            xhr.onabort = function() {}
                    
            $('.modal').modal({closable: false, onHide:function() {
                xhr.abort();
                close = 1;
            }});

            $("#select_apps, #select_base_image, #select_base_image_tag").select2({
                width: '100%',
                language: "zh-CN"
            });
            $('.build-image').on('click', function() {
                $('#modal-setting').modal('show');
            });

            $('#post-box').delegate('button.stop-build', 'click', function() {
                var tr = $(this).parents('tr.console-listener'),
                    id = tr.data('id'),
                    build_num = tr.data('build-num');
                swal({
                        title: "确定停止构建?",
                        text: "停止的构建将无法重启!",
                        type: "warning",
                        showCancelButton: true,
                        cancelButtonText: "取消",
                        confirmButtonColor: "#DD6B55",
                        confirmButtonText: "是的，停止!",
                        showLoaderOnConfirm: true,
                        closeOnConfirm: false,
                        animation: "slide-from-top",
                    },
                    function() {
                        var stopBuildApi = self.api.API('posts', 'stop_build', {
                            build_num: build_num,
                            type: 'base_img'
                        });
                        stopBuildApi.apiPath += '/' + id + '/stop';
                        var hooks = $.extend({}, self.api.loadHooks);
                        hooks.success = function(msg, data) {
                            swal("完成！", "停止构建成功", "success");
                            self.getPosts();
                        };
                        stopBuildApi.load(hooks);
                    }
                );
            });
            $("#select_base_image").on('select2:select', function() {
                var image = $(this).val(),
                    tags = self.images[image],
                    tag_sel = $('#select_base_image_tag').empty();
                $.each(tags, function(_, tag) {
                    tag_sel.append($("<option>").val(tag.name).text(tag.name));
                });
                tag_sel.select2({width: '100%'}).trigger('select2:select')
            });

            // build image
            $('#modal-setting').delegate('#do-post', 'click', function() {
                var params = {};
                $.each($('#modal-form-new').serializeArray(), function(_, kv) {
                    params[kv.name] = kv.value;
                });
                self.buildImage(params);
            });

            // destroy image 
            $("#image-box").delegate('button.image-destroy', 'click', function() {
                var row = $(this).parent().parent('tr');
                var registry_id = row.data('registry');
                var app_name = row.data('namespace');
                var name = row.data('name');
                var version = $(this).data('tag');
                swal({
                        title: "确定删除镜像?",
                        text: "删除的镜像将无法恢复!",
                        type: "warning",
                        showCancelButton: true,
                        cancelButtonText: "取消",
                        confirmButtonColor: "#DD6B55",
                        confirmButtonText: "是的，删除!",
                        showLoaderOnConfirm: true,
                        closeOnConfirm: false,
                        animation: "slide-from-top",
                    },
                    function() {
                        var imgDestroyApi = self.api.API('registries', 'destroy_image', {
                            action: 'images',
                            type: 'app_base',
                            name: name,
                            app_name: app_name,
                            version: version
                        });
                        imgDestroyApi.apiPath += '/' + registry_id;
                        var hooks = $.extend({}, self.api.loadHooks);
                        hooks.success = function(msg, data) {
                            swal("完成！", "删除成功", "success");
                            self.getUserBaseImages(self.registry_id);
                        };
                        imgDestroyApi.load(hooks);
                    }
                );
            });

            // image detail modal
            $("#image-box").delegate('button.image-detail', 'click', function() {
                var btn = $(this),
                    tr = $(this).parents('tr'),
                    registry_id = tr.data('registry'),
                    app_name = tr.data('namespace'),
                    name = tr.data('name'),
                    version = $(this).data('tag'),
                    hooks = $.extend({}, self.api.loadHooks),
                    postSearchApi = self.api.API('posts', 'list', {
                        action: 'search',
                        status: 8,
                        type: 'base_img',
                        image: name,
                        namespace: app_name,
                        tag: version
                    });
                hooks.success = function(msg, data) {
                    if (data.data && data.data.length > 0) {
                        $('.docker-file').html(data.data[0].docker_file).css("overflow-y", "scroll").textAreaAutoSize();
                        $('#modal-docker-file').modal('show');
                    }
                    btn.button('reset');
                };
                postSearchApi.load(hooks);
                btn.button('loading');
            });

            // export dockerfile
            $('#do-save-as').on('click', function() {
                saveAs(
                    new Blob([$(".docker-file").html()], {
                        type: "text/plain;charset=utf8"
                    }),
                    'Dockerfile'
                );
            });

            // refresh image list
            $(".image-refresh").on('click', function(event) {
                event.preventDefault();
                event.stopPropagation();
                self.getUserBaseImages(self.registry_id);
            });

            // show build log
            $("#post-box").delegate('button.show-console', 'click', function(event) {
                if ($(this).hasClass('disabled'))
                    return;

                event.stopPropagation();
                $('.console-log').empty();
                // xhr = new XMLHttpRequest();

                var tr = $(this).parents('tr.console-listener'),
                    build_num = tr.data('build-num');
                url = 'http://' + cors_config.registry_host + '/console/' + build_num + '?token=' + window.localStorage.token;
                start = 0;
                close = 0;
                
                reconnect(url);
                $('#modal-console').modal('show');
            });

            // refresh post list
            $(".post-refresh").on('click', function(event) {
                event.preventDefault();
                event.stopPropagation();
                self.getPosts();
            });

            $(".chevron-down").on('click', function() {
                var self = $(this);
                var table = $(this).parents(".panel").children("table");
                if (table.is(":visible")) {
                    table.slideUp();
                } else {
                    table.slideDown();
                }
            });
        },
        dispose: function() {

        }

    });

    return widget;
});