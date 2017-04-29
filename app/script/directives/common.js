define(['api', 'moment', 'sweetalert'], function (YM, language) {
    // check if browser support console function
    if (!window.console) {
        window.console = {}
        window.console.log = function () {
        }
        window.console.debug = function () {
        }
    }

    Array.prototype.contains = function (obj) {
        var i = this.length;
        while (i--) {
            if (this[i] === obj) {
                return true;
            }
        }
        return false;
    }
    /*
     loading window
     for user to indicate an ajax operation in running
     */

    var loading = {
        show: function (dom) {
            if (!dom)
                dom = $('main');
            else 
                dom = $(dom);
            if (dom.find('.loading').length == 0) {
                dom.append('<div class="loading"></div>');
            }
        },
        hide: function (dom) {
            if (!dom)
                dom = $('main');
            else 
                dom = $(dom);
            if (dom.find('.loading').length > 0) {
                dom.children('.loading').fadeOut(500, function () {
                    $(this).remove();
                });
            }
        }
    };

    /*
     page header notify message
     for user to indicate an ajax operation result or other infomation
     */
    var msgs = {
        theme: 'swal',
        swal: function(msg, msg_type) {
            switch (msg_type) {
                case "error": 
                        swal("失败", msg, "error")
                    break;
                case "success":
                    swal({   
                        title: "成功",
                        text: msg,
                        type: "success",
                        timer: 2000,
                        showConfirmButton: false
                    });
                    break;
            }
        },
        new_msg: function (msg, msg_type, dom) {
            msg = msg || 'Unknow error occured.';
            msg_type = msg_type || 'error';
            dom = dom || '#msg_placeholder';

            var alert = $('<div class="alert alert-' + msg_type + ' fade in"><img src="app/theme/default/images/err_ico.png">' + msg_type.toUpperCase() + ': ' + msg + '</div>');
            var alert_dom = $(dom).find('.alert');

            if (alert_dom.size() > 0) {
                alert_dom.hide();
            }

            if (dom != '#msg_placeholder') {
                $(dom).find('.box-container').prepend(alert);
            } else {
                $(dom).prepend(alert);
            }
            $('html, body').animate({scrollTop: $(dom).offset().top - 10}, 800);
            alert.delay(5000).animate({height: 0, opacity: 0}, {
                duration: 300, complete: function () {
                    $(this).remove()
                }
            });
        },
        pop_up: function (msg, msg_type, dom, hide) {
            if (msgs.theme == "swal" && msg_type == 'error') {
                msgs.swal(msg, msg_type);
                return;
            }
            msg = msg || 'Unknow error occured.';
            msg_type = msg_type || 'error';
            dom = dom || '#msg_placeholder';

            var pop_up = $('<div class="dypop-up alert-' + msg_type + '"><img src="app/theme/default/images/err_ico.png" style="margin-left: -15px; width:70px;">' + msg + '</div>');
            var pop_up_dom = $(dom).find('.dypop-up');

            if (pop_up_dom.size() > 0) pop_up_dom.remove();

            $(dom).prepend(pop_up);
            pop_up.show();
            if (!hide) {
                pop_up.delay(5000).animate({height:0, opacity:0}, {duration: 300, complete: function(){$(this).remove()}});
            }
        },
        success: function (msg, dom) {
            msgs.new_msg(msg, 'success', dom);
        },
        error: function (msg, dom) {
            msgs.new_msg(msg, 'error', dom);
        },
        hide: function (dom) {
            var alert_dom = $(dom).find('.alert');
            alert_dom.alert('close');
        },
        login: function (msg, msg_type, dom) {

            msg = msg || 'Unknow error occured.';
            msg_type = msg_type || 'error';
            dom = dom || '#msg_placeholder';

            var alert = $('<div class="alert alert-' + msg_type + ' fade in"><span style="width:16px; height: 16px; background-color: red;border-radius:50%; color:#26c3ff; line-height:16px; text-align:16px; display:inline-block;">!</span> ' + msg + '</div>');
            var alert_dom = $(dom).find('.alert');

            if (alert_dom.size() > 0) {
                alert_dom.hide();
            }

            if (dom != '#msg_placeholder') {
                $(dom).find('.box-container').prepend(alert);
            } else {
                $(dom).prepend(alert);
            }
            $('html, body').animate({scrollTop: $(dom).offset().top - 10}, 800);
            alert.delay(20000).animate({height: 0, opacity: 0}, {
                duration: 2000, complete: function () {
                    $(this).remove()
                }
            });
        }
    };

    //文本自适应行数
    $.fn.extend({
        textAreaAutoSize : function () {
            var text = $(this).val(),
            matches = text.match(/\n/g),
            breaks = matches ? matches.length : 1;
            $(this).attr('rows',breaks);
            return $(this);
        }
    });

    //公共校验
    var check = {
        isNum: function (str, min, max) {
            var p = "^[0-9]{" + min + "," + max + "}$";
            var normalReg = new RegExp(p);
            return normalReg.test(str);
        },
        isAccountContent: function (str, min, max) {
            var p = "^[\.a-zA-Z0-9\@]{" + min + "," + max + "}$";
            var normalReg = new RegExp(p);
            return normalReg.test(str);
        },
        isNumAndLetter: function (str, min, max) {
            var p = "^[a-zA-Z0-9]{" + min + "," + max + "}$";
            var normalReg = new RegExp(p);
            return normalReg.test(str);
        },
        isLetter: function (str, min, max) {
            var p = "^[a-zA-Z]{" + min + "," + max + "}$";
            var normalReg = new RegExp(p);
            return normalReg.test(str);
        },
        isCampainNameRight: function (str, min, max) {
            var p = "^[a-zA-Z0-9_\\-\\s]{" + min + "," + max + "}$";
            var normalReg = new RegExp(p);
            return normalReg.test(str);
        },
        isAccountNameRight: function (str, min, max) {
            var p = "^[a-zA-Z0-9_]{" + min + "," + max + "}$";
            var normalReg = new RegExp(p);
            return normalReg.test(str);
        },
        isUrl: function (str) {
            var p = "^(http)\://([a-zA-Z0-9\u4e00-\u9fa5\.\-]+(\:[a-zA-Z0-9\u4e00-\u9fa5\.&amp;%\$\-]+)*@)?((25[0-5]|2[0-4][0-9]|[0-1]{1}[0-9]{2}|[1-9]{1}[0-9]{1}|[1-9])\.(25[0-5]|2[0-4][0-9]|[0-1]{1}[0-9]{2}|[1-9]{1}[0-9]{1}|[1-9]|0)\.(25[0-5]|2[0-4][0-9]|[0-1]{1}[0-9]{2}|[1-9]{1}[0-9]{1}|[1-9]|0)\.(25[0-5]|2[0-4][0-9]|[0-1]{1}[0-9]{2}|[1-9]{1}[0-9]{1}|[0-9])|([a-zA-Z0-9\u4e00-\u9fa5\-]+\.)*[a-zA-Z0-9\u4e00-\u9fa5\-]+\.[a-zA-Z\u4e00-\u9fa5]{2,4})(\:[0-9]+)?(/[^/][a-zA-Z0-9\u4e00-\u9fa5\.\,\?\'\\/\+&amp;%\$#\=~_\-@]*)*$";
            var normalReg = new RegExp(p);
            return normalReg.test(str);
        },
        isEmail: function (email) {
            //var p = "^(\w)+(\.\w+)*@(\w)+((\.\w+)+)$";
            var p = "^[\.a-zA-Z0-9_-]+@[a-zA-Z0-9_\\-]+(\.[a-zA-Z0-9_-]+)+$";
            var normalReg = new RegExp(p);
            return normalReg.test(email);
        },
        isPhone: function (phone) {
            //var p = "^(([0-9]{0,}[\\-]{0,}[0-9]{3,}[\\-][0-9]{6,})|([0-9]{3,}))$";
            //var normalReg = new RegExp( p);
            var reg = ['+', '-', '', ' ', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
            var str = phone;

            var flag = false;
            if (str) {
                for (var i = 0; i < str.length; i++) {
                    flag = (reg.indexOf(str.charAt(i)) > -1 ? true : false);
                    if (!flag) {
                        break;
                    }
                }
            } else {
                flag = true;
            }

            //return normalReg.test(phone);
            return flag;
        },
        isNumber: function (s) {
            var p = /^(([1-9][0-9]*)|([0]))(\.\d{0,})?$/;
            return p.test(s);
        },
        isNumberWithPrecision: function (str, precision) {
            var p1 = "^[1-9][0-9]*(\\.[0-9]{0," + precision + "})?$"
            var normalReg1 = new RegExp(p1);
            var p2 = "^[0](\\.[0-9]{0," + precision + "})?$"
            var normalReg2 = new RegExp(p2);
            return normalReg1.test(str) || normalReg2.test(str);
        },
        isLength: function (s, minLength, maxlength, type) {

            if (type == 0) {
                if (s.length <= maxlength) {
                    return true;
                }
            }
            else if (type == 1) {
                if (s.length <= maxlength && s.length >= minLength) {
                    return true;
                }
            }

            return false;
        },
        formatNumber: function (element, max, precision) {
            element.unbind().on('keyup', function (e) {
                e.preventDefault();
                var _this = $(this);
                var value = _this.val();

                if ('' == value) {
                    return false;
                }

                var cV = value.replace(/[^0-9^\\.]/g, '');
                var initIndex = cV.indexOf("\.", cV.indexOf("\.") + 1);
                var index = initIndex > 0 ? initIndex : cV.length - 1;
                var cV1 = cV.substring(0, index);
                var finalV = cV;
                if (!check.isNumber(cV) && check.isNumber(cV1)) {
                    var finalV = cV1;
                }

                //window.alert(finalV);
                //判断是否是数字
                if (check.isNumber(finalV)) {
                    if (finalV > max) {
                        $(this).val(max);
                        return false;
                    }

                    //判断是否精确到3为，否则精确到三位
                    if (!check.isNumberWithPrecision(finalV, precision)) {
                        $(this).val(Number(finalV).toFixed(precision));
                    }
                    else {
                        $(this).val(finalV);
                    }
                } else {
                    $(this).val('');
                }

            }).on('blur', function (e) {
                e.preventDefault();
                var iV = $(this).val();

                if ('' == iV) {
                    $(this).val('');
                }
            });

        },
        formatInteger: function (element, maxValue) {
            element.unbind().on('keyup', function (e) {
                e.preventDefault();
                var iV = $(this).val();

                if ('' == iV) {
                    return false;
                }
                var cV = iV.replace(/[^0-9]/g, '');
                var numV = Number(cV);
                //window.alert(numV);
                if (numV > maxValue) {
                    $(this).val(100);
                }
                else {
                    $(this).val(numV);
                }
            }).on('blur', function (e) {
                var iV = $(this).val();

                if ('' == iV) {
                    $(this).val(0);
                }
            });
        }
    }
    return {
        loading: loading,
        msgs: msgs,
        check: check,
    }
})