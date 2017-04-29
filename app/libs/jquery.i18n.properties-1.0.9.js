/******************************************************************************
 * jquery.i18n.properties
 * 
 * Dual licensed under the GPL (http://dev.jquery.com/browser/trunk/jquery/GPL-LICENSE.txt) and 
 * MIT (http://dev.jquery.com/browser/trunk/jquery/MIT-LICENSE.txt) licenses.
 * 
 * @version     1.1.x
 * @author      Nuno Fernandes
 *              Matthew Lohbihler
 * @url         www.codingwithcoffee.com
 * @inspiration Localisation assistance for jQuery (http://keith-wood.name/localisation.html)
 *              by Keith Wood (kbwood{at}iinet.com.au) June 2007
 * 
 *****************************************************************************/


(function($) {
/*****************************************************************/

/* user config by Scot Wang */

/*****************************************************************/
/**
 * 根据语言项加载语言资源并翻译页面上的body部分
 * @method setLocalization
 * @param {String} locale 语言项:zh-cn
 */
function setLocalization(locale){
    $.i18n.properties({
        name:'Messages',//前缀文件名
        path:'i18n/',//资源文件路径
        mode:'map',
        cache: true,
        language:locale,
        setMoreDir:false,//文件是否拆分
        callback: function() {
            $('body').translate();
        }
    });
}
var token = localStorage.getItem("token");
initLanguage = function(ctrl, getLan, API_HOST){
    /**
     * 语言切换事件处理
     * @event langChangeHandler
     */
    if(ctrl){
      // $('#'+ctrl).on('change', function () {
      //   var userCtrlVal = $('#'+ctrl).val();
      //   setLocalization(userCtrlVal);
      //   $.ajax({
      //       type:"POST",
      //       url : 'http://'+API_HOST+'/accounts/changeLang',
      //       dataType : "json",
      //       crossDomain : true,
      //       xhrFields : {
      //           withCredentials: true
      //       },
      //       data : {
      //         token : token,
      //         lang: userCtrlVal
      //       },
      //       success:function(result){
      //           localStorage.setItem('language', userCtrlVal);
      //       },
      //       error: function(){
      //           console.log('## Set language failed ##')
      //       }
      //   })
      // })
      setLocalization(getLanguage(ctrl, getLan, API_HOST));
    }else{
      setLocalization(getLanguage(ctrl, getLan, API_HOST));
    }
}

/**
 * 获取语言项
 * @method getLanguage
 */
function getLanguage(ctrl, getLan, API_HOST) {
    var localLanguage = localStorage.getItem("language");
    if(localLanguage){
        if(ctrl){
          $('#'+ctrl).val(localLanguage);
        }
        return localLanguage;
    }else{
        return 'en';
//        //获取后端用户设定默认语言，获取浏览器版本语言，失败，获取页面默认语言项
//        $.ajax({
//            type:"POST",
//            url : 'http://'+API_HOST+'/accounts/queryBasicInfo',
//            dataType : "json",
//            async: false,
//            crossDomain : true,
//            xhrFields : {
//                withCredentials: true
//            },
//            data : {
//                token : token
//            },
//            success:function(result){
//                getLan = result.data.lang ? result.data.lang : getLan;
//            },
//            error: function(){
//                console.log('## Get language failed ##')
//            }
//        })
//        if(getLan){
//          localStorage.setItem('language', getLan);
//          $('#'+ctrl).val(getLan);
//          return getLan;
//        }else{
//          localStorage.setItem('language', 'en');
//          return 'en';
//        }
    }
}
/*****************************************************************/

/* user config end */

/*****************************************************************/

/*****************************************************************/

/* user translate end */

/*****************************************************************/
//翻译器
$.fn.translate = function () {
    var $this = $(this);
    $this.each(function(){
        var item = $(this);
        var trans = item.attr("trans");
        if(!!trans){
            translateElement(this, trans);
        };
    });
    
    $this.find("*[trans]").each(function () {
        var trans = $(this).attr("trans");
        if (trans != "") {
            translateElement(this, trans);
        }
    });

    //扩展第三方组件的翻译渲染
    function translateElement(ele, trans){
        var word = $.i18n.prop(trans);
        var nodeName = ele.nodeName.toUpperCase();
        if($(ele).attr('trans') != 'false'){
          if (nodeName == 'INPUT' || nodeName == 'SELECT' || nodeName == 'TEXTAREA') {
              $(ele).val(word);
          } else if (nodeName == 'BUTTON') {
              $(ele).text(word);
          }else if (nodeName == 'IMG') {//多媒体元素扩展
              $(ele).attr('src',word);
          } else {
              $(ele).html(word);
          }
        }
        

        if($(ele).attr('trans-attr')){
          var transArr = $(ele).attr('trans-attr').split(',');
          var attrWord = $.i18n.prop($.trim(transArr[1]));
          if(attrWord){
            $(ele).attr(transArr[0], attrWord);
          }else{
            $(ele).attr(transArr[0], 'get wording false');
          }
        }
    };

    return $this;
};
/*****************************************************************/

/* user translate end */

/*****************************************************************/

$.i18n = {};

/** Map holding bundle keys (if mode: 'map') */
$.i18n.map = {};
 
$.i18n.properties = function(settings) {
	// set up settings
    var defaults = {
        name:           'Messages',
        language:       '',
        path:           '',  
        mode:           'vars',
        cache:			false,
        encoding:       'UTF-8',
        callback:       null
    };
    settings = $.extend(defaults, settings);    
    if(settings.language === null || settings.language == '') {
	   settings.language = $.i18n.browserLang();
	}
	if(settings.language === null) {settings.language='';}
	
	// load and parse bundle files
	var files = getFiles(settings.name);
	for(i=0; i<files.length; i++) {
        if(settings.language.length >= 2) {
            if(settings.setMoreDir){
                $('body').each(function(){
                    var item = $(this);
                    var transModul = item.attr("trans-modul");
                    if(!!transModul){
                        var transModulArr = transModul.split(' ');
                        for(var j=0 ; j<transModulArr.length; j++){
                          var dirBodyPath = settings.path + settings.language+'/'+ files[i] + '_' + $.trim(transModulArr[j]) +'.properties';
                          loadAndParseFile(dirBodyPath, settings);
                        }
                    };
                });
                
                $('body').find("*[trans-modul]").each(function () {
                    var transModul = $(this).attr("trans-modul");
                    if (transModul != "") {
                        var transModulArr = transModul.split(' ');
                        for(var k=0 ; k<transModulArr.length; k++){
                          var dirElePath = settings.path + settings.language.substring(0, 5)+'/'+ files[i] + '_' + $.trim(transModulArr[k]) +'.properties';
                          loadAndParseFile(dirElePath, settings);
                        }
                    }
                });
            }else{
              loadAndParseFile(settings.path + files[i] + '_' + settings.language.substring(0, 5) +'.properties', settings);
            }
        }
	}
	
	// call callback
	if(settings.callback){ settings.callback(); }
};

function getWordingFile(transModul, path, lan, files){
    console.log(path, lan, files, '@@ dir path @@');
    var dirPath = path + lan.substring(0, 5)+'/'+ files + '_' + transModul +'.properties', settings;
    loadAndParseFile(dirPath);
}
/**
 * When configured with mode: 'map', allows access to bundle values by specifying its key.
 * Eg, jQuery.i18n.prop('com.company.bundles.menu_add')
 */
$.i18n.prop = function(key /* Add parameters as function arguments as necessary  */) {
	var value = $.i18n.map[key];
	if (value == null)
		return key;
	
	var phvList;
	if (arguments.length == 2 && $.isArray(arguments[1]))
		// An array was passed as the only parameter, so assume it is the list of place holder values.
		phvList = arguments[1];

	
	var i;
	if (typeof(value) == 'string') {
        // Handle escape characters. Done separately from the tokenizing loop below because escape characters are 
		// active in quoted strings.
        i = 0;
        while ((i = value.indexOf('\\', i)) != -1) {
 		    if (value.charAt(i+1) == 't')
 			    value = value.substring(0, i) + '\t' + value.substring((i++) + 2); // tab
 		    else if (value.charAt(i+1) == 'r')
 			    value = value.substring(0, i) + '\r' + value.substring((i++) + 2); // return
 		    else if (value.charAt(i+1) == 'n')
 			    value = value.substring(0, i) + '\n' + value.substring((i++) + 2); // line feed
 		    else if (value.charAt(i+1) == 'f')
 			    value = value.substring(0, i) + '\f' + value.substring((i++) + 2); // form feed
 		    else if (value.charAt(i+1) == '\\')
 			    value = value.substring(0, i) + '\\' + value.substring((i++) + 2); // \
 		    else
 			    value = value.substring(0, i) + value.substring(i+1); // Quietly drop the character
        }
		
		// Lazily convert the string to a list of tokens.
		var arr = [], j, index;
		i = 0;
		while (i < value.length) {
			if (value.charAt(i) == '\'') {
				// Handle quotes
				if (i == value.length-1)
					value = value.substring(0, i); // Silently drop the trailing quote
				else if (value.charAt(i+1) == '\'')
					value = value.substring(0, i) + value.substring(++i); // Escaped quote
				else {
					// Quoted string
					j = i + 2;
					while ((j = value.indexOf('\'', j)) != -1) {
						if (j == value.length-1 || value.charAt(j+1) != '\'') {
							// Found start and end quotes. Remove them
							value = value.substring(0,i) + value.substring(i+1, j) + value.substring(j+1);
							i = j - 1;
							break;
						}
						else {
							// Found a double quote, reduce to a single quote.
							value = value.substring(0,j) + value.substring(++j);
						}
					}
					
					if (j == -1) {
						// There is no end quote. Drop the start quote
						value = value.substring(0,i) + value.substring(i+1);
					}
				}
			}
			else if (value.charAt(i) == '{') {
				// Beginning of an unquoted place holder.
				j = value.indexOf('}', i+1);
				if (j == -1)
					i++; // No end. Process the rest of the line. Java would throw an exception
				else {
					// Add 1 to the index so that it aligns with the function arguments.
					index = parseInt(value.substring(i+1, j));
					if (!isNaN(index) && index >= 0) {
						// Put the line thus far (if it isn't empty) into the array
						var s = value.substring(0, i);
						if (s != "")
							arr.push(s);
						// Put the parameter reference into the array
						arr.push(index);
						// Start the processing over again starting from the rest of the line.
						i = 0;
						value = value.substring(j+1);
					}
					else
						i = j + 1; // Invalid parameter. Leave as is.
				}
			}
			else
				i++;
		}
		
		// Put the remainder of the no-empty line into the array.
		if (value != "")
			arr.push(value);
		value = arr;
		
		// Make the array the value for the entry.
		$.i18n.map[key] = arr;
	}
	
	if (value.length == 0)
		return "";
	if (value.lengh == 1 && typeof(value[0]) == "string")
		return value[0];
	
	var s = "";
	for (i=0; i<value.length; i++) {
		if (typeof(value[i]) == "string")
			s += value[i];
		// Must be a number
		else if (phvList && value[i] < phvList.length)
			s += phvList[value[i]];
		else if (!phvList && value[i] + 1 < arguments.length)
			s += arguments[value[i] + 1];
		else
			s += "{"+ value[i] +"}";
	}
	
	return s;
};

/** Language reported by browser, normalized code */
$.i18n.browserLang = function() {
	return normaliseLanguageCode(navigator.language /* Mozilla */ || navigator.userLanguage /* IE */);
};


/** Load and parse .properties files */
$.i18n.yeahTools = {};
function loadAndParseFile(filename, settings) {
    if($.i18n.yeahTools[filename]) {
        parseData($.i18n.yeahTools[filename], settings.mode);
        return ;
    }
	$.ajax({
        url:        filename,
        async:      false,
        cache:		settings.cache,
        contentType:'text/plain;charset='+ settings.encoding,
        dataType:   'text',
        success:    function(data, status) {
            $.i18n.yeahTools[filename] = data;
            parseData(data, settings.mode);
        }
    });
}

/** Parse .properties files */
function parseData(data, mode) {
   var parsed = '';
   var parameters = data.split( /\n/ );
   var regPlaceHolder = /(\{\d+\})/g;
   var regRepPlaceHolder = /\{(\d+)\}/g;
   var unicodeRE = /(\\u.{4})/ig;
   for(var i=0; i<parameters.length; i++ ) {
       parameters[i] = parameters[i].replace( /^\s\s*/, '' ).replace( /\s\s*$/, '' ); // trim
       if(parameters[i].length > 0 && parameters[i].match("^#")!="#") { // skip comments
           var pair = parameters[i].split('=');
           if(pair.length > 0) {
               /** Process key & value */
               var name = unescape(pair[0]).replace( /^\s\s*/, '' ).replace( /\s\s*$/, '' ); // trim
               var value = pair.length == 1 ? "" : pair[1];
               // process multi-line values
               while(value.match(/\\$/)=="\\") {
               		value = value.substring(0, value.length - 1);
               		value += parameters[++i].replace( /\s\s*$/, '' ); // right trim
               }               
               // Put values with embedded '='s back together
               for(var s=2;s<pair.length;s++){ value +='=' + pair[s]; }
               value = value.replace( /^\s\s*/, '' ).replace( /\s\s*$/, '' ); // trim
               
               /** Mode: bundle keys in a map */
               if(mode == 'map' || mode == 'both') {
                   // handle unicode chars possibly left out
                   var unicodeMatches = value.match(unicodeRE);
                   if(unicodeMatches) {
                     for(var u=0; u<unicodeMatches.length; u++) {
                        value = value.replace( unicodeMatches[u], unescapeUnicode(unicodeMatches[u]));
                     }
                   }
                   // add to map
                   $.i18n.map[name] = value;
               }
               
               /** Mode: bundle keys as vars/functions */
               if(mode == 'vars' || mode == 'both') {
                   value = value.replace( /"/g, '\\"' ); // escape quotation mark (")
                   
                   // make sure namespaced key exists (eg, 'some.key') 
                   checkKeyNamespace(name);
                   
                   // value with variable substitutions
                   if(regPlaceHolder.test(value)) {
                       var parts = value.split(regPlaceHolder);
                       // process function args
                       var first = true;
                       var fnArgs = '';
                       var usedArgs = [];
                       for(var p=0; p<parts.length; p++) {
                           if(regPlaceHolder.test(parts[p]) && (usedArgs.length == 0 || usedArgs.indexOf(parts[p]) == -1)) {
                               if(!first) {fnArgs += ',';}
                               fnArgs += parts[p].replace(regRepPlaceHolder, 'v$1');
                               usedArgs.push(parts[p]);
                               first = false;
                           }
                       }
                       parsed += name + '=function(' + fnArgs + '){';
                       // process function body
                       var fnExpr = '"' + value.replace(regRepPlaceHolder, '"+v$1+"') + '"';
                       parsed += 'return ' + fnExpr + ';' + '};';
                       
                   // simple value
                   }else{
                       parsed += name+'="'+value+'";';
                   }
               } // END: Mode: bundle keys as vars/functions
           } // END: if(pair.length > 0)
       } // END: skip comments
   }
   eval(parsed);
}

/** Make sure namespace exists (for keys with dots in name) */
// TODO key parts that start with numbers quietly fail. i.e. month.short.1=Jan
function checkKeyNamespace(key) {
	var regDot = /\./;
	if(regDot.test(key)) {
		var fullname = '';
		var names = key.split( /\./ );
		for(var i=0; i<names.length; i++) {
			if(i>0) {fullname += '.';}
			fullname += names[i];
			if(eval('typeof '+fullname+' == "undefined"')) {
				eval(fullname + '={};');
			}
		}
	}
}

/** Make sure filename is an array */
function getFiles(names) {
	return (names && names.constructor == Array) ? names : [names];
}

/** Ensure language code is in the format aa_AA. */
function normaliseLanguageCode(lang) {
    lang = lang.toLowerCase();
    if(lang.length > 3) {
        lang = lang.substring(0, 3) + lang.substring(3).toUpperCase();
    }
    return lang;
}

/** Unescape unicode chars ('\u00e3') */
function unescapeUnicode(str) {
  // unescape unicode codes
  var codes = [];
  var code = parseInt(str.substr(2), 16);
  if (code >= 0 && code < Math.pow(2, 16)) {
     codes.push(code);
  }
  // convert codes to text
  var unescaped = '';
  for (var i = 0; i < codes.length; ++i) {
    unescaped += String.fromCharCode(codes[i]);
  }
  return unescaped;
}

/* Cross-Browser Split 1.0.1
(c) Steven Levithan <stevenlevithan.com>; MIT License
An ECMA-compliant, uniform cross-browser split method */
var cbSplit;
// avoid running twice, which would break `cbSplit._nativeSplit`'s reference to the native `split`
if (!cbSplit) {    
  cbSplit = function(str, separator, limit) {
      // if `separator` is not a regex, use the native `split`
      if (Object.prototype.toString.call(separator) !== "[object RegExp]") {
        if(typeof cbSplit._nativeSplit == "undefined")
          return str.split(separator, limit);
        else
          return cbSplit._nativeSplit.call(str, separator, limit);
      }
  
      var output = [],
          lastLastIndex = 0,
          flags = (separator.ignoreCase ? "i" : "") +
                  (separator.multiline  ? "m" : "") +
                  (separator.sticky     ? "y" : ""),
          separator = RegExp(separator.source, flags + "g"), // make `global` and avoid `lastIndex` issues by working with a copy
          separator2, match, lastIndex, lastLength;
  
      str = str + ""; // type conversion
      if (!cbSplit._compliantExecNpcg) {
          separator2 = RegExp("^" + separator.source + "$(?!\\s)", flags); // doesn't need /g or /y, but they don't hurt
      }
  
      /* behavior for `limit`: if it's...
      - `undefined`: no limit.
      - `NaN` or zero: return an empty array.
      - a positive number: use `Math.floor(limit)`.
      - a negative number: no limit.
      - other: type-convert, then use the above rules. */
      if (limit === undefined || +limit < 0) {
          limit = Infinity;
      } else {
          limit = Math.floor(+limit);
          if (!limit) {
              return [];
          }
      }
  
      while (match = separator.exec(str)) {
          lastIndex = match.index + match[0].length; // `separator.lastIndex` is not reliable cross-browser
  
          if (lastIndex > lastLastIndex) {
              output.push(str.slice(lastLastIndex, match.index));
  
              // fix browsers whose `exec` methods don't consistently return `undefined` for nonparticipating capturing groups
              if (!cbSplit._compliantExecNpcg && match.length > 1) {
                  match[0].replace(separator2, function () {
                      for (var i = 1; i < arguments.length - 2; i++) {
                          if (arguments[i] === undefined) {
                              match[i] = undefined;
                          }
                      }
                  });
              }
  
              if (match.length > 1 && match.index < str.length) {
                  Array.prototype.push.apply(output, match.slice(1));
              }
  
              lastLength = match[0].length;
              lastLastIndex = lastIndex;
  
              if (output.length >= limit) {
                  break;
              }
          }
  
          if (separator.lastIndex === match.index) {
              separator.lastIndex++; // avoid an infinite loop
          }
      }
  
      if (lastLastIndex === str.length) {
          if (lastLength || !separator.test("")) {
              output.push("");
          }
      } else {
          output.push(str.slice(lastLastIndex));
      }
  
      return output.length > limit ? output.slice(0, limit) : output;
  };
  
  cbSplit._compliantExecNpcg = /()??/.exec("")[1] === undefined; // NPCG: nonparticipating capturing group
  cbSplit._nativeSplit = String.prototype.split;

} // end `if (!cbSplit)`
String.prototype.split = function (separator, limit) {
    return cbSplit(this, separator, limit);
};

})(jQuery);
                