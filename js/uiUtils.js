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

var UI = {};

UI.initTabPanel = function(tabClazz, containerClazz) {
    "use strict";
    var containers = getEls(containerClazz);

    var i;
    for (i = 1; i < containers.length; i++) { // don't hide 1st element
        addClass(containers[i], "hidden");
    }

    var tabButtons = getEls(tabClazz);

    addClass(tabButtons[0], "active");

    for (i = 0; i < tabButtons.length; i++) {
        listen(tabButtons[i], "click", UI.tabButtonClick(tabButtons, containers));
    }
};

UI.tabButtonClick = function(buttons, containers) {
    "use strict";
    return function(event) {
        for (var i = 0; i < buttons.length; i++) {
            setClassByCondition(buttons[i], "active", event.target.id === buttons[i].id);
        }
        for (var i = 0; i < containers.length; i++) {
            setClassByCondition(containers[i], "hidden", event.target.id + "Container" !== containers[i].id);
        }
    };
};

UI.fillShowItemSelector = function (selector, displayArray) {
    "use strict";
    var el;
    setAttr(selector, "size", displayArray.length);
    displayArray.forEach(function(value, i) {
        el = setProps(makeEl("option"), {
            "selected" : true,
        });
        addEl(selector, addEl(el, makeText(value)));
    });
};

UI.showSelectedEls = function(classKey){
    "use strict";
    return function(event){
        var el = event.target;
        var els, i, j;
        for (i = 0; i < el.options.length; i += 1) {
            els = getEls(i + classKey);
            for (j = 0; j < els.length; j++) {
                setClassByCondition(els[j], "hidden", !el.options[i].selected);
            }
        }
    }
};