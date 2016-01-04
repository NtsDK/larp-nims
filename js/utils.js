/*Copyright 2015 Timofey Rechkalov <ntsdk@yandex.ru>, Maria Sidekhmenova <matilda_@list.ru>

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
   limitations under the License. */

"use strict";

var Utils = {};

Utils.addView = function (containers, name, view, displayName, opts) {
    "use strict";
    var opts = opts || {};
    view.init();
    var buttonClass = "navigation-button";
    containers.root.views[name] = view;
    var button = document.createElement("div");
    if(opts.tooltip){
		$(button).tooltip({
			title : opts.tooltip,
			placement : "bottom"
		});
    }
    addClass(button, buttonClass);
    addClass(button, "-test-" + name);
    if(opts.id){
    	button.id = opts.id;
    }
    button.appendChild(document.createTextNode(displayName));
    containers.navigation.appendChild(button);
    

    var elems, i;
    var onClickDelegate = function (view) {
        return function (evt) {
            elems = containers.navigation.getElementsByClassName(buttonClass);
            for (i = 0; i < elems.length; i++) {
                removeClass(elems[i], "active");
            }
            addClass(evt.target, "active");
            
            Utils.removeChildren(containers.content);
            containers.content.appendChild(view.content);
            containers.root.currentView = view;
            view.refresh();
        };
    };

    button.addEventListener("click", onClickDelegate(view));
    if (opts.mainPage) {
        addClass(button, "active");
        containers.content.appendChild(view.content);
        containers.root.currentView = view;
    }
};

Utils.globStringToRegex = function (str) {
    "use strict";
    return new RegExp(Utils.preg_quote(str).replace(/\\\*/g, '.*').replace(
            /\\\?/g, '.'), 'g');
};
Utils.preg_quote = function (str, delimiter) {
    "use strict";
    // http://kevin.vanzonneveld.net
    // + original by: booeyOH
    // + improved by: Ates Goral (http://magnetiq.com)
    // + improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // + bugfixed by: Onno Marsman
    // + improved by: Brett Zamir (http://brett-zamir.me)
    // * example 1: preg_quote("$40");
    // * returns 1: '\$40'
    // * example 2: preg_quote("*RRRING* Hello?");
    // * returns 2: '\*RRRING\* Hello\?'
    // * example 3: preg_quote("\\.+*?[^]$(){}=!<>|:");
    // * returns 3: '\\\.\+\*\?\[\^\]\$\(\)\{\}\=\!\<\>\|\:'
    return (str + '').replace(new RegExp('[.\\\\+*?\\[\\^\\]$(){}=!<>|:\\'
            + (delimiter || '') + '-]', 'g'), '\\$&');
};

Utils.alert = function (message) {
    "use strict";
    window.alert(message);
};

Utils.confirm = function (message) {
    "use strict";
    return window.confirm(message);
};

Utils.removeChildren = function (myNode) {
    "use strict";
    if (!myNode) {
        return;
    }
    while (myNode.firstChild) {
        myNode.removeChild(myNode.firstChild);
    }
};

Utils.processError = function(callback){
	return function(err){
		if(err) {
			Utils.handleError(err);
			return;
		}
		
		if(callback){
			var arr = [];
			for (var i = 1; i < arguments.length; i++) {
				arr.push(arguments[i]);
			}
			callback.apply(null, arr);
		}
	}
}

Utils.handleError = function(err){
	"use strict";
	if (err instanceof Errors.ValidationError) {
		Utils.alert(err.message);
	} else {
		Utils.alert(err);
	}
};

Utils.enable = function(root, className, condition){
	"use strict";
    var arr = root.getElementsByClassName(className);
    var i, elem;
    for (i = 0; i < arr.length; i++) {
		elem = arr[i];
		if(condition){
			elem.removeAttribute("disabled");
		} else {
			elem.setAttribute("disabled","disabled");
		}
	}
};

Utils.charOrdAObject = function(a, b) {
	"use strict";
	a = a.displayName.toLowerCase();
	b = b.displayName.toLowerCase();
	if (a > b)
		return 1;
	if (a < b)
		return -1;
	return 0;
};


String.prototype.endsWith = function (suffix) {
    "use strict";
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};

function isEmpty (obj) {
    "use strict";
    return (Object.getOwnPropertyNames(obj).length === 0);
};

function addClass(o, c){
    var re = new RegExp("(^|\\s)" + c + "(\\s|$)", "g")
    if (re.test(o.className)) return;
    o.className = (o.className + " " + c).replace(/\s+/g, " ").replace(/(^ | $)/g, "")
};

function toggleClass(o, c){
    if(hasClass(o, c)){
        removeClass(o, c);
    } else {
        addClass(o, c);
    }
};

function hasClass(o, c){
    var re = new RegExp("(^|\\s)" + c + "(\\s|$)", "g")
    return (re.test(o.className));
};
 
function removeClass(o, c){
    var re = new RegExp("(^|\\s)" + c + "(\\s|$)", "g")
    o.className = o.className.replace(re, "$1").replace(/\s+/g, " ").replace(/(^ | $)/g, "")
};

function setClassByCondition(o,c,condition){
	if(condition){
		addClass(o,c);
	} else {
		removeClass(o,c);
	}
};

// from date format utils
//For convenience...
Date.prototype.format = function (mask, utc) {
	return dateFormat(this, mask, utc);
};