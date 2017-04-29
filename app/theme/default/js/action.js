function messageBoard () {
	$('#message_bell').on('mouseenter', function(){
        $(this).addClass('hoverBg');
        $('div.v-line').css('background-color','#333');
        $('#messageBoard').removeClass('hide');
    });
    $('#message_bell').on('mouseleave', function(){
        $(this).removeClass('hoverBg');
        $('div.v-line').css('background-color','#ccc');
        $('#messageBoard').addClass('hide');
    });

    $('#timeAndZone').on('click', function() {
        window.location.hash = "#!/manage/setting"
    })
}

var widNavAnimate = function() {
        var showAnimate = function (){
            $('#show-nav-icon').unbind();
            $('#logoutBox, #passwordBox, #settingBox, #profileBox').removeClass('hide')
            setTimeout(function(){
                $('img', '#photoDiv').animate({
                    width: "45px",
                    height: "45px"
                }, 120, "linear", function () {
                    $('img', '#photoDiv').animate({
                        width: "49px",
                        height: "49px"
                    }, 100, "linear", function () {
                        $('img', '#photoDiv').animate({
                            width: "46px",
                            height: "46px"
                        }, 80, "linear", function () {
                            $('img', '#photoDiv').animate({
                                width: "48px",
                                height: "48px"
                            }, 60, "linear", function () {
                                $('img', '#photoDiv').animate({
                                    width: "47px",
                                    height: "47px"
                                }, 40)
                                $('#userActionBox').animate({
                                    width: "47px",
                                    height: "47px",
                                    left: "37px"
                                }, 40, "linear", function () {
                                    $('#userActionBox').removeClass('hide');
                                });
                            })
                        })
                    })
                });
                

                $('#profileBox').animate({
                    top: "68px",
                    left: "10px"
                }, 120, "linear", function () {
                    $('#profileBox').css('z-index','1001');
                    $('#profileBox').animate({
                        top: "62px",
                        left: "10px"
                    }, 100, "linear", function () {
                        $('#profileBox').animate({
                            top: "67px",
                            left: "10px"
                        }, 80, "linear", function () {
                            $('#profileBox').animate({
                                top: "63px",
                                left: "10px"
                            }, 60, "linear", function () {
                                $('#profileBox').animate({
                                    top: "66px",
                                    left: "10px"
                                }, 40, "linear", function () {
                                    $('#profileBox').animate({
                                        top: "65px",
                                        left: "10px"
                                    }, 20);
                                });
                            });
                        });
                    });
                });

                setTimeout(function(){
                    $('#settingBox').animate({
                        top: "93px", 
                        left: "31px"
                    }, 120, "linear", function () {
                        $('#settingBox').css('z-index','1001');
                            $('#settingBox').animate({
                            top: "87px", 
                            left: "31px"
                        }, 100, "linear", function () { 
                            $('#settingBox').css('z-index','1001');
                                $('#settingBox').animate({
                                top: "92px", 
                                left: "31px"
                            }, 80, "linear", function () { 
                                $('#settingBox').css('z-index','1001');
                                    $('#settingBox').animate({
                                    top: "88px", 
                                    left: "31px"
                                }, 60, "linear", function () { 
                                    $('#settingBox').css('z-index','1001');
                                        $('#settingBox').animate({
                                        top: "91px", 
                                        left: "31px"
                                    }, 40, "linear", function () { 
                                        $('#settingBox').css('z-index','1001');
                                            $('#settingBox').animate({
                                            top: "90px", 
                                            left: "31px"
                                        }, 20);
                                    });
                                });
                            });
                        });
                    });
                    setTimeout(function(){
                        $('#passwordBox').animate({
                            top: "93px", 
                            left: "65px"
                        }, 120, "linear", function () {
                            $('#passwordBox').css('z-index','1001');
                            $('#passwordBox').animate({
                                top: "87px", 
                                left: "65px"
                            }, 100, "linear", function () {
                                $('#passwordBox').animate({
                                    top: "92px", 
                                    left: "65px"
                                }, 80, "linear", function () {
                                    $('#passwordBox').animate({
                                        top: "88px", 
                                        left: "65px"
                                    }, 60, "linear", function () {
                                        $('#passwordBox').animate({
                                            top: "91px", 
                                            left: "65px"
                                        }, 40, "linear", function () {
                                            $('#passwordBox').animate({
                                                top: "90px", 
                                                left: "65px"
                                            }, 20);
                                        });
                                    });
                                });
                            });
                        });
                        setTimeout(function(){
                            $('#logoutBox').animate({
                                top: "68px",
                                left: "86px"
                            }, 120, "linear", function () {
                                $('#logoutBox').css('z-index','1001');
                                $('#logoutBox').animate({
                                    top: "62px",
                                    left: "86px"
                                }, 100, "linear", function () {
                                    $('#logoutBox').animate({
                                        top: "67px",
                                        left: "86px"
                                    }, 80, "linear", function () {
                                        $('#logoutBox').animate({
                                            top: "63px",
                                            left: "86px"
                                        }, 60, "linear", function () {
                                            $('#logoutBox').animate({
                                                top: "66px",
                                                left: "86px"
                                            }, 40, "linear", function () {
                                                $('#logoutBox').animate({
                                                    top: "65px",
                                                    left: "86px"
                                                }, 20, "linear", function () {
                                                    $('#photoDiv').one('mouseleave', function (e) {
                                                        hideAnimate();
                                                    })
                                                    if($('#show-nav-icon').hasClass('widNav')){
                                                        changeNavStatus();
                                                    }else if($('#show-nav-icon').hasClass('miniNav')){
                                                        miniNavEvent();
                                                    }
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        }, 70)
                    }, 70)
                }, 70)
            }, 100) 
        }
        var hideAnimate = function (){
            $('#show-nav-icon').unbind();
            setTimeout(function(){
                $('#logoutBox').animate({
                    top: "60px",
                    left: "45px"
                }, 120, "linear", function () {
                    $('#logoutBox').css('z-index','-1');
                });
                setTimeout(function(){
                    $('#passwordBox').animate({
                        top: "60px",
                        left: "45px"
                    }, 120, "linear", function () {
                        $('#passwordBox').css('z-index','-1');
                    });
                    setTimeout(function(){
                        $('#settingBox').animate({
                            top: "60px",
                            left: "45px"
                        }, 120, "linear", function () {
                            $('#settingBox').css('z-index','-1');
                        });
                        setTimeout(function(){
                            $('img', '#photoDiv').animate({
                                width: "72px",
                                height: "72px"
                            }, 120);
                            $('#userActionBox').animate({
                                width: "72px",
                                height: "72px",
                                left: "24px"
                            }, 120, "linear", function () {
                                $('#userActionBox').addClass('hide');
                            });
                            $('#profileBox').animate({
                                top: "60px",
                                left: "45px"
                            }, 120, "linear", function () {
                                $('#profileBox').css('z-index','-1');
                                if($('#show-nav-icon').hasClass('widNav')){
                                    changeNavStatus();
                                }else if($('#show-nav-icon').hasClass('miniNav')){
                                    miniNavEvent();
                                }
                                $('#logoutBox, #passwordBox, #settingBox, #profileBox').addClass('hide');
                                $('#photoDiv').unbind().one('mouseenter', function (e) {
                                    showAnimate();
                                })
                            });
                        }, 70)
                    }, 70)
                }, 70)
            }, 100)
        }
        $('#photoDiv').unbind().one('mouseenter', function() {
            showAnimate();
        })
    }
            
var miniNavAnimate = function() {                
    var showAnimate = function (){
        $('#show-nav-icon').unbind();
        $('#logoutBox, #passwordBox, #settingBox, #profileBox').removeClass('hide')
        setTimeout(function(){
            $('#userActionBox').removeClass('hide');
            $('#logoutBox').animate({
                top: "50px",
                left: "170px"
            }, 120, "linear", function () {
                $('#logoutBox').css('z-index','1001');
                $('#logoutBox').animate({
                    top: "50px",
                    left: "164px"
                }, 100, "linear", function () {
                    $('#logoutBox').animate({
                        top: "50px",
                        left: "169px"
                    }, 80, "linear", function () {
                        $('#logoutBox').animate({
                            top: "50px",
                            left: "165px"
                        }, 60, "linear", function () {
                            $('#logoutBox').animate({
                                top: "50px",
                                left: "168px"
                            }, 40, "linear", function () {
                                $('#logoutBox').animate({
                                    top: "50px",
                                    left: "167px"
                                }, 20);
                            });
                        });
                    });
                });
            });
            
            setTimeout(function(){
                $('#passwordBox').animate({
                    top: "50px",
                    left: "136px"
                }, 120, "linear", function () {
                    $('#passwordBox').css('z-index','1001');
                    $('#passwordBox').animate({
                        top: "50px",
                        left: "130px"
                    }, 100, "linear", function () {
                        $('#passwordBox').animate({
                            top: "50px",
                            left: "135px"
                        }, 80, "linear", function () {
                            $('#passwordBox').animate({
                                top: "50px",
                                left: "131px"
                            }, 60, "linear", function () {
                                $('#passwordBox').animate({
                                    top: "50px",
                                    left: "134px"
                                }, 40, "linear", function () {
                                    $('#passwordBox').animate({
                                        top: "50px",
                                        left: "133px"
                                    }, 20);
                                });
                            });
                        });
                    });
                });
                setTimeout(function(){
                    $('#settingBox').animate({
                        top: "50px",
                        left: "102px"
                    }, 120, "linear", function () {
                        $('#settingBox').css('z-index','1001');
                        $('#settingBox').animate({
                            top: "50px",
                            left: "86px"
                        }, 100, "linear", function () {
                            $('#settingBox').animate({
                                top: "50px",
                                left: "101px"
                            }, 80, "linear", function () {
                                $('#settingBox').animate({
                                    top: "50px",
                                    left: "97px"
                                }, 60, "linear", function () {
                                    $('#settingBox').animate({
                                        top: "50px",
                                        left: "100px"
                                    }, 40, "linear", function () {
                                        $('#settingBox').animate({
                                            top: "50px",
                                            left: "99px"
                                        }, 20);
                                    });
                                });
                            });
                        });
                    });
                    setTimeout(function(){
                        $('#profileBox').animate({
                            top: "50px",
                            left: "68px"
                        }, 120, "linear", function () {
                            $('#profileBox').css('z-index','1001');
                            $('#profileBox').animate({
                                top: "50px",
                                left: "62px"
                            }, 100, "linear", function () {
                                $('#profileBox').animate({
                                    top: "50px",
                                    left: "67px"
                                }, 80, "linear", function () {
                                    $('#profileBox').animate({
                                        top: "50px",
                                        left: "63px"
                                    }, 60, "linear", function () {
                                        $('#profileBox').animate({
                                            top: "50px",
                                            left: "66px"
                                        }, 40, "linear", function () {
                                            $('#profileBox').animate({
                                                top: "50px",
                                                left: "65px"
                                            }, 20, "linear", function () {
                                                $('#photoDiv').one('mouseleave', function (e) {
                                                    $('#photoDiv').css('width', '60px');
                                                    hideAnimate();
                                                })
                                                if($('#show-nav-icon').hasClass('widNav')){
                                                    changeNavStatus();
                                                }else if($('#show-nav-icon').hasClass('miniNav')){
                                                    miniNavEvent();
                                                }
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    }, 70)
                }, 70)
            }, 70)
        }, 100) 
    }
    var hideAnimate = function (){
        $('#show-nav-icon').unbind();
        setTimeout(function(){
            $('#logoutBox').animate({
                top: "50px",
                left: "19px"
            }, 120, "linear", function () {
                $('#logoutBox').css('z-index','-1');
            });
            setTimeout(function(){
                $('#passwordBox').animate({
                    top: "50px",
                    left: "19px"
                }, 120, "linear", function () {
                    $('#passwordBox').css('z-index','-1');
                });
                setTimeout(function(){
                    $('#settingBox').animate({
                        top: "50px",
                        left: "19px"
                    }, 120, "linear", function () {
                        $('#settingBox').css('z-index','-1');
                    });
                    setTimeout(function(){
                        $('#userActionBox').addClass('hide');
                        $('#profileBox').animate({
                            top: "50px",
                            left: "19px"
                        }, 120, "linear", function () {
                            $('#profileBox').css('z-index','-1');
                            $('#photoDiv').unbind().one('mouseenter', function (e) {
                                $('#photoDiv').css('width', '250px');
                                showAnimate();
                            })
                            if($('#show-nav-icon').hasClass('widNav')){
                                changeNavStatus();
                            }else if($('#show-nav-icon').hasClass('miniNav')){
                                miniNavEvent();
                            }
                            $('#logoutBox, #passwordBox, #settingBox, #profileBox').addClass('hide')
                        });
                    }, 70)
                }, 70)
            }, 70)
        }, 100)
    }
    $('#photoDiv').unbind().one('mouseenter', function() {
        $('#photoDiv').css('width', '250px');
        showAnimate();
    })
}

var changeNavStatus = function () {
    $('.widNav').unbind().on('click', function() {
        $('main','body').css('margin-left','60px');
        $('div.logo').css('margin-left', '80px');
        $(this).removeClass('widNav').addClass('miniNav');
        $('li', '#navBar').css('line-height', '58px');
        $('div.userBottom').css('text-align', 'center');
        $('#photoDiv').find('img').css({position: 'absolute', left:'7px'});
        $('span.fontSpan').addClass('hide');
        $('#welcomUser').parent().addClass('hide');
        $('a[data-toggle="tooltip"], div[data-toggle="tooltip"]').on('mouseenter', function(){
            $(this).tooltip('show');
        })
        $('a[data-toggle="tooltip"], div[data-toggle="tooltip"]').on('mouseleave', function() {
            $(this).tooltip('hide');
        });
        $('.title-fixed').animate({'left': '60px'}, 'fast', function () {
            resizeTable();
        });
        $('div.versionBtn').addClass('hide');
        $('header').animate({
            width:'60px'
        }, 'fast')
        $('img', '#photoDiv').stop().animate({
            width: '47px',
            height: '47px'
        }, 'fast');
        $('#userActionBox').stop().animate({
            width: '47px',
            height: '47px',
            left: '7px'
        }, 'fast').addClass('hide')
        $('#logoutBox, #passwordBox, #settingBox, #profileBox').stop().animate({
            top: '50px',
            left: '19px'
        }, 'fast')
        miniNavAnimate();
        miniNavEvent();
    })
}

var miniNavEvent = function(){
    $('.miniNav').unbind().on('click', function() {
            $('li', '#navBar').css('line-height', '26px');
            $('div.userBottom').css('text-align', 'left');
            $('main','body').css('margin-left','120px');
            $('div.logo').css('margin-left', '140px');
            // $('#chartStatistics').highcharts().reflow();
            $(this).removeClass('miniNav').addClass('widNav');
            $('a[data-toggle="tooltip"], div[data-toggle="tooltip"]').unbind();
            $('div.versionBtn').removeClass('hide');
            $('.title-fixed').animate({'left': '120px'}, 'fast', function () {
                resizeTable();
            });
            $('header').animate({
                width:'120px'
            }, 'fast', 'linear', function() {
                $('#photoDiv').css('width', '120px').find('img').css({position: 'relative', left: '0'});
                $('span.fontSpan').removeClass('hide');
                $('#welcomUser').parent().removeClass('hide');
                
            })
            $('img', '#photoDiv').stop().animate({
                width: '72px',
                height: '72px'
            }, 'fast');
            $('#userActionBox').stop().animate({
                width: '72px',
                height: '72px',
                left: '24px'
            }, 'fast').addClass('hide')
            $('#logoutBox, #passwordBox, #settingBox, #profileBox').stop().animate({
                top: '50px',
                left: '45px'
            }, 400)
            widNavAnimate();
            changeNavStatus();
        })
}

var resizeTable = function () {
    var _tab = $('#cp_tab thead tr');
    var _table = $('#redirect_list thead tr');
    var _w = $('section').width();
    if (_tab.length == 1) {
        _tab.children('th:eq(0)').width(_w*0.03);
        _tab.children('th:eq(1)').width(_w*0.08);
        _tab.children('th:eq(2)').width(_w*0.08);
        _tab.children('th:eq(3)').width(_w*0.08);
        _tab.children('th:eq(4)').width(_w*0.08);
        _tab.children('th:eq(5)').width(_w*0.08);
        _tab.children('th:eq(6)').width(_w*0.08);
        _tab.children('th:eq(7)').width(_w*0.08);
        _tab.children('th:eq(8)').width(_w*0.1);
        _tab.children('th:eq(9)').width(_w*0.09);
        _tab.children('th:eq(10)').width(_w*0.09);
        _tab.children('th:eq(11)').width(_w*0.08);
        _tab.children('th:eq(12)').width(_w*0.05);
    }

    if (_table.length == 1) {
        _table.children('th:eq(0)').width(_w*0.05);
        _table.children('th:eq(1)').width(_w*0.15);
        _table.children('th:eq(2)').width(_w*0.50);
        _table.children('th:eq(3)').width(_w*0.15);
        _table.children('th:eq(4)').width(_w*0.15);
    }
}