define(['api', 'common'], function (YM, common) {
    'use strict';

    var widget = function (p_dom, p_path) {
        this.dom = p_dom;
        this.path = p_path;

        this.api = new YM();
        this.api.API_LIST({
        });
    };
    widget.prototype = $.extend(widget.prototype, {
        init: function () {
            var self = this;
            
            $('#copyYear').text(new Date().getFullYear());

            $('#hide-nav-icon,#show-nav-icon').on('click',function(){
                var _this = $(this);
                if( _this.attr('id') == 'hide-nav-icon' ){
                    $('header','body').hide();
                    _this.addClass('hide').next().removeClass('hide');
                    $('footer','body').css('left','0');
                    $('main','body').css('margin-left','0');
                    $('.messageBox').css('margin-left', '20px');
                }else{
                    $('header','body').show();
                    _this.addClass('hide').prev().removeClass('hide');
                    $('footer','body').css('left','120px');
                    $('main','body').css('margin-left','120px');
                    $('.messageBox').css('margin-left', '150px');
                }

                $('#chartStatistics').highcharts().reflow();
            })
        },
        dispose: function () {
            
        }
    });

    return widget;
 });