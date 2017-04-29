
requirejs.config({
	'baseUrl': 'app/script/',
	'urlArgs': 'v=1.0.1&d=201604152011',
	'waitSeconds': 60,
	'paths': {
		'libs': '../libs',
		'jquery': '../libs/jquery.min',
		'bootstrap': '../libs/bootstrap/js/bootstrap.min',
		'datetimepicker': '../libs/bootstrap-datetimepicker/bootstrap-datetimepicker.min',
		// 'select2': '../libs/select2/select2.min',
		'select2': '../libs/select2/v4/js/select2.min',
		'select2.lang.zh': '../libs/select2/v4/js/i18n/zh-CN',
		'chosen': '../libs/chosen/chosen.jquery.min',
		'crossroads': 'directives/crossroads.min',
		'signals': 'directives/signals.min',
		'api': 'services/api',
		'api3.0': 'services/api3.0',
		'app': 'app',
        'moment': 'directives/moment',
        'ckeditor': '../libs/ckeditor/ckeditor',
        'jquery.query': 'directives/jquery.query',
        'md5': 'directives/md5',
        'underscore': 'directives/underscore',
        'widget': 'directives/widget',
        'common': 'directives/common',
        'easypiechart': '../libs/easypiechart/jquery.easypiechart.min',
        'animate': 'directives/jquery.animateNumbers',
        'pages': 'directives/global_page',
		'json.human': '../libs/json.human/json.human',
		'draggable': '../libs/jquery.draggable',
		'plupload': '../libs/plupload/plupload.full.min',
		'jtopo': '../libs/jtopo/jtopo-0.4.8-min',
		'highcharts': '../libs/highcharts',
		'fileinput': '../libs/fileinput/js/fileinput.min',
		'fileinput_locale_zh': '../libs/fileinput/js/locales/zh',
		'jquery.validate': '../libs/jquery.validate/jquery.validate.min',
		'jquery.ui': '../libs/jquery.ui/jquery-ui.min',
		'validate_localization': '../libs/jquery.validate/localization',
		'echarts': '../libs/echarts/echarts.common.min',
		'sweetalert': "../libs/sweetalert/sweetalert.min",
		'filesaver': "../libs/filesaver/FileSaver.min",
		'semantic': "../libs/semantic/semantic.min",
		'multipicker': "../libs/multipicker/multipicker.min"
	},
	shim: {
		'jquery': {
			exports: '$'
		},
		'jquery.ui': {
			deps: ['jquery']
		},
		'bootstrap': {
			deps: ['jquery.ui', 'jquery']
		},
		'jquery.query': {
			deps: ['jquery']
		},
		'widget': {
			deps: ['jquery']
		},
		'api': {
			deps: ['jquery.query']
		},
		'api3.0': {
			deps: ['jquery.query', 'md5']
		},
		'select2': {
			deps: ['jquery']
		},
		'select2.lang.zh' : {
			deps: ['jquery', 'select2']
		},
		'crossroads': {
			deps: ['signals']
		},
		'underscore': {
			exports: '_'
		},
		'moment': {
			exports: 'moment'
		},
		'easypiechart': {
			deps: ['jquery']
		},
		'animate': {
			deps: ['jquery']
		},
		'pages': {
			deps: ['jquery']
		},
		'NVis': {
			deps: ['jquery']
		},
		'plupload': {
			deps: ['jquery']
		},
		'highcharts':{
			deps: ['jquery']
		},
		'fileinput_locale_zh':{
			deps: ['jquery','fileinput','bootstrap']
		},
	}
});

requirejs(['require', 'jquery', 'underscore', 'app', 'bootstrap'], function (require, $, _, app) {
});

var cors_config = {
    api_host: '192.168.99.101:8080',
    app_host: '192.168.99.101:8082',
    registry_host: '192.168.99.101:8084',
    api_ssl: false,
    isTest : false
}
