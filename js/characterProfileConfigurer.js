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

/*global
 Utils, DBMS
 */

"use strict";

// Профиль игрока уже содержит поле name.
// У меня был выбор:
// 1. убрать это поле в принципе,
// 2. добавить уровень вложенности для данных профиля,
// 3. запретить называть так поля профиля.
// 1 уже используется в ряде мест
// 2 - на мой взгляд усложнит формат данных
// 3 просто и без усложнений, выбран 3 вариант

var CharacterProfileConfigurer = {};

CharacterProfileConfigurer.mapping = {
    text : {
        displayName : "Текст",
        value : ""
    },
    string : {
        displayName : "Строка",
        value : ""
    },
    enum : {
        displayName : "Единственный выбор",
        value : "_"
    },
    number : {
        displayName : "Число",
        value : 0
    },
    checkbox : {
        displayName : "Галочка",
        value : false
    }
};

CharacterProfileConfigurer.init = function () {
    'use strict';
    var selector = document.getElementById("profileItemTypeSelector");
    Utils.removeChildren(selector);
    CharacterProfileConfigurer.fillSelector(selector);

    var button = document.getElementById("createProfileItemButton");
    button.addEventListener("click", CharacterProfileConfigurer.createProfileItem);

    button = document.getElementById("swapProfileFieldsButton");
    button.addEventListener("click", CharacterProfileConfigurer.swapProfileItems);

    button = document.getElementById("removeProfileItemButton");
    button.addEventListener("click", CharacterProfileConfigurer.removeProfileItem);

    CharacterProfileConfigurer.content = document.getElementById("characterProfileConfigurer");
};

CharacterProfileConfigurer.refresh = function () {
    'use strict';
    var positionSelector = document.getElementById("profileItemPositionSelector");
    Utils.removeChildren(positionSelector);

    DBMS.getAllProfileSettings(function(allProfileSettings){
        allProfileSettings.forEach(function (elem, i) {
            var option = document.createElement("option");
            option.appendChild(document.createTextNode("Перед '" + elem.name + "'"));
            positionSelector.appendChild(option);
        });
        
        var option = document.createElement("option");
        option.appendChild(document.createTextNode("В конец"));
        positionSelector.appendChild(option);
        
        positionSelector.selectedIndex = allProfileSettings.length;
        
        var table = document.getElementById("profileConfigBlock");
        Utils.removeChildren(table);
        
        allProfileSettings.forEach(function (profileSettings, i) {
            CharacterProfileConfigurer.appendInput(table, profileSettings, i + 1);
        });
        
        var selectorArr = [];
        
        selectorArr.push(document.getElementById("firstProfileField"));
        selectorArr.push(document.getElementById("secondProfileField"));
        selectorArr.push(document.getElementById("removeProfileItemSelector"));
        
        selectorArr.forEach(function (selector) {
            Utils.removeChildren(selector);
            allProfileSettings.forEach(function (elem, i) {
                option = document.createElement("option");
                option.appendChild(document.createTextNode(elem.name));
                selector.appendChild(option);
            });
        });
    });
};

CharacterProfileConfigurer.createProfileItem = function () {
    'use strict';
    var name = document.getElementById("profileItemNameInput").value.trim();

    CharacterProfileConfigurer.validateProfileItemName(name, function(){
        var type = document.getElementById("profileItemTypeSelector").value.trim();
        
        if (!CharacterProfileConfigurer.mapping[type]) {
            Utils.alert("Неизвестный тип поля: " + type);
            return;
        }
        var value = CharacterProfileConfigurer.mapping[type].value;
        
        var positionSelector = document.getElementById("profileItemPositionSelector");
        
        var position = positionSelector.value;
        
        DBMS.createProfileItem(name, type, value, position === "В конец", 
                positionSelector.selectedIndex, CharacterProfileConfigurer.refresh);
    });
};

CharacterProfileConfigurer.swapProfileItems = function () {
    'use strict';
    var index1 = document.getElementById("firstProfileField").selectedIndex;
    var index2 = document.getElementById("secondProfileField").selectedIndex;
    if (index1 === index2) {
        Utils.alert("Позиции совпадают");
        return;
    }

    DBMS.swapProfileItems(index1,index2, CharacterProfileConfigurer.refresh);
};

CharacterProfileConfigurer.removeProfileItem = function () {
    'use strict';
    var index = document.getElementById("removeProfileItemSelector").selectedIndex;
    var name = document.getElementById("removeProfileItemSelector").value;

    if (Utils.confirm("Вы уверены, что хотите удалить поле профиля "
                    + name
                    + "? Все данные связанные с этим полем будут удалены безвозвратно.")) {
        
        DBMS.removeProfileItem(index, name, CharacterProfileConfigurer.refresh);
    }
};

CharacterProfileConfigurer.appendHeader = function (table) {
    'use strict';
    var tr = document.createElement("tr");

    var td = document.createElement("th");
    td.appendChild(document.createTextNode("№"));
    tr.appendChild(td);

    td = document.createElement("th");
    td.appendChild(document.createTextNode("Название поля"));
    tr.appendChild(td);

    td = document.createElement("th");
    td.appendChild(document.createTextNode("Тип"));
    tr.appendChild(td);

    td = document.createElement("th");
    td.appendChild(document.createTextNode("Значения"));
    tr.appendChild(td);
    table.appendChild(tr);
};

CharacterProfileConfigurer.fillSelector = function (selector) {
    'use strict';
    Object.keys(CharacterProfileConfigurer.mapping).forEach(function (name) {
        var option = document.createElement("option");
        option.appendChild(document.createTextNode(CharacterProfileConfigurer.mapping[name].displayName));
        option.value = name;
        selector.appendChild(option);
    });
};

CharacterProfileConfigurer.appendInput = function (table, profileSettings, index) {
    'use strict';
    var tr = document.createElement("tr");

    var td = document.createElement("td");
    var span = document.createElement("span");
    span.appendChild(document.createTextNode(index));
    td.appendChild(span);
    tr.appendChild(td);

    td = document.createElement("td");
    var input; 
    input = document.createElement("input");
    input.value = profileSettings.name;
    input.info = profileSettings.name;
    addClass(input,"itemNameInput");
    input.addEventListener("change", CharacterProfileConfigurer.renameProfileItem);
    td.appendChild(input);
    tr.appendChild(td);

    td = document.createElement("td");
    var selector = document.createElement("select");
    CharacterProfileConfigurer.fillSelector(selector);
    selector.value = profileSettings.type;
    selector.info = profileSettings.name;
    selector.oldType = profileSettings.type;
    td.appendChild(selector);
    selector.addEventListener("change", CharacterProfileConfigurer.changeProfileItemType);
    tr.appendChild(td);

    td = document.createElement("td");
    if(profileSettings.type == "text" || profileSettings.type == "enum"){
        input = document.createElement("textarea");
    } else {
        input = document.createElement("input");
    }
    input.info = profileSettings.name;
    input.infoType = profileSettings.type;
    addClass(input, "profile-configurer-" + profileSettings.type);

    switch (profileSettings.type) {
    case "text":
    case "string":
    case "enum":
        input.value = profileSettings.value;
        break;
    case "number":
        input.type = "number";
        input.value = profileSettings.value;
        break;
    case "checkbox":
        input.type = "checkbox";
        input.checked = profileSettings.value;
        break;
    }

    input.addEventListener("change", CharacterProfileConfigurer.updateDefaultValue);
    td.appendChild(input);
    tr.appendChild(td);
    table.appendChild(tr);
};

CharacterProfileConfigurer.updateDefaultValue = function (event) {
    'use strict';
    var name = event.target.info;
    var type = event.target.infoType;
    
    var value ;
    
    switch (type) {
    case "text":
    case "string":
    case "number":
    case "enum":
        value = event.target.value;
        break;
    case "checkbox":
        value = event.target.checked;
        break;
    }
    
    var callback = function(oldValue){
        event.target.value = oldValue;
    }
    
    DBMS.updateDefaultValue(name, value, callback);
};

CharacterProfileConfigurer.renameProfileItem = function (event) {
    'use strict';
    var newName = event.target.value.trim();
    var oldName = event.target.info;

    CharacterProfileConfigurer.validateProfileItemName(newName, function(){
        DBMS.renameProfileItem(newName, oldName, CharacterProfileConfigurer.refresh);
    }, function(){
        event.target.value = event.target.info;
    });
};

CharacterProfileConfigurer.validateProfileItemName = function (name, success, failure) {
    'use strict';
    if (name === "") {
        Utils.alert("Название поля не указано");
        if(failure) failure();
        return;
    }
    
    if (name === "name") {
        Utils.alert("Название поля не может быть name");
        if(failure) failure();
        return;
    }
    
    DBMS.isProfileItemNameUsed(name, function(){
        Utils.alert("Такое имя уже используется.");
        if(failure) failure();
    }, success);
    
};

CharacterProfileConfigurer.changeProfileItemType = function (event) {
    'use strict';
    if (Utils.confirm("Вы уверены, что хотите изменить тип поля профиля "
            + event.target.info
            + "? Все заполнение данного поле в досье будет потеряно.")) {
        
        var newType = event.target.value;
        var name = event.target.info;
        
        DBMS.changeProfileItemType(name, newType, CharacterProfileConfigurer.refresh);
        
    } else {
        event.target.value = event.target.oldType;
    }
};