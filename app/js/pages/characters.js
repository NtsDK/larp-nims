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
 Utils, CharacterProfile, CharacterProfileConfigurer, DBMS
 */

"use strict";

var Characters = {};

Characters.init = function () {
    "use strict";
    var root = Characters;
    root.views = {};
    var nav = "charactersNavigation";
    var content = "charactersContent";
    var containers = {
        root: root,
        navigation: getEl(nav),
        content: getEl(content)
    };
    Utils.addView(containers, "character-profile", CharacterProfile,{mainPage:true});
    Utils.addView(containers, "character-profile-constructor", CharacterProfileConfigurer);

    listen(queryEl("#charactersDiv .create-entity-button"), "click", Characters.createProfile);
    listen(queryEl("#charactersDiv .rename-entity-button"), "click", Characters.renameProfile);
    listen(queryEl("#charactersDiv .remove-entity-button"), "click", Characters.removeProfile);

    Characters.content = getEl("charactersDiv");
};

Characters.refresh = function () {
    "use strict";
    PermissionInformer.getCharacterNamesArray(true, Utils.processError(Characters.rebuildInterface));
};

Characters.rebuildInterface = function (names) {
    "use strict";
    
    var data = getSelect2Data(names);
    
    clearEl(queryEl("#charactersDiv .rename-entity-select"));
    $("#charactersDiv .rename-entity-select").select2(data);
    
    clearEl(queryEl("#charactersDiv .remove-entity-select"));
    $("#charactersDiv .remove-entity-select").select2(data);

    Characters.currentView.refresh();
};

Characters.createProfile = function () {
    "use strict";
    var name = queryEl("#charactersDiv .create-entity-input").value.trim();

    if (name === "") {
        Utils.alert(getL10n("characters-character-name-is-not-specified"));
        return;
    }
    
    DBMS.isProfileNameUsed(name, function(err, isProfileNameUsed){
        if(err) {Utils.handleError(err); return;}
        if (isProfileNameUsed) {
            Utils.alert(strFormat(getL10n("characters-character-name-already-used"), [name]));
        } else {
            DBMS.createProfile(name, function(err){
                if(err) {Utils.handleError(err); return;}
                PermissionInformer.refresh(function(err){
                    if(err) {Utils.handleError(err); return;}
                    if(Characters.currentView.updateSettings){
                        Characters.currentView.updateSettings(name);
                    }
                    Characters.refresh();
                });
            });
        }
    });
};

Characters.renameProfile = function () {
    "use strict";
    var fromName = queryEl("#charactersDiv .rename-entity-select").value.trim();
    var toName = queryEl("#charactersDiv .rename-entity-input").value.trim();

    if (toName === "") {
        Utils.alert(getL10n("characters-new-character-name-is-not-specified"));
        return;
    }

    if (fromName === toName) {
        Utils.alert(getL10n("characters-names-are-the-same"));
        return;
    }

    DBMS.isProfileNameUsed(toName, function(err, isProfileNameUsed){
        if(err) {Utils.handleError(err); return;}
        if (isProfileNameUsed) {
            Utils.alert(strFormat(getL10n("characters-character-name-already-used"), [toName]));
        } else {
            DBMS.renameProfile(fromName, toName, function(err){
                if(err) {Utils.handleError(err); return;}
                PermissionInformer.refresh(function(err){
                    if(err) {Utils.handleError(err); return;}
                    if(Characters.currentView.updateSettings){
                        Characters.currentView.updateSettings(toName);
                    }
                    Characters.refresh();
                });
            });
        }
    });
};

Characters.removeProfile = function () {
    "use strict";
    var name = queryEl("#charactersDiv .remove-entity-select").value.trim();

    if (Utils.confirm(strFormat(getL10n("characters-are-you-sure-about-character-removing"),[name]))) {
        DBMS.removeProfile(name, function(err){
            if(err) {Utils.handleError(err); return;}
            PermissionInformer.refresh(function(err){
                if(err) {Utils.handleError(err); return;}
                Characters.refresh();
            });
        });
    }
};
