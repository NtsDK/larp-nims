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

'use strict';

((exports) => {
    const state = {};

    exports.init = () => {
        let button = getEl('storyCharactersAddButton');
        button.addEventListener('click', addCharacter);

        button = getEl('storyCharactersSwitchButton');
        button.addEventListener('click', switchCharacters);

        button = getEl('storyCharactersRemoveButton');
        button.addEventListener('click', removeCharacter);

        state.ExternalCharacterSelectors = [getEl('storyCharactersAddSelector'), getEl('storyCharactersToSelector')];
        state.InternalCharacterSelectors = [getEl('storyCharactersRemoveSelector'), getEl('storyCharactersFromSelector')];

        exports.content = getEl('storyCharactersDiv');
    };

    exports.refresh = () => {
        state.ExternalCharacterSelectors.forEach(clearEl);
        state.InternalCharacterSelectors.forEach(clearEl);

        clearEl(getEl('story-characterActivityTableHead'));
        clearEl(getEl('story-characterActivityTable'));
        clearEl(getEl('storyCharactersTableHead'));
        clearEl(getEl('storyCharactersTable'));

        if (!Stories.getCurrentStoryName()) { return; }

        PermissionInformer.isEntityEditable('story', Stories.getCurrentStoryName(), (err, isStoryEditable) => {
            if (err) { Utils.handleError(err); return; }
            PermissionInformer.getEntityNamesArray('character', false, (err2, allCharacters) => {
                if (err2) { Utils.handleError(err2); return; }
                DBMS.getStoryCharacters(Stories.getCurrentStoryName(), (err3, localCharacters) => {
                    if (err3) { Utils.handleError(err3); return; }
                    rebuildInterface(allCharacters, localCharacters);
                    Utils.enable(exports.content, 'isStoryEditable', isStoryEditable);
                    Stories.chainRefresh();
                });
            });
        });
    };

    function rebuildInterface(allCharacters, localCharacters) {
        const addArray = [];
        const removeArray = [];

        allCharacters.filter(nameInfo => !localCharacters[nameInfo.value]).forEach((nameInfo) => {
            addArray.push(nameInfo);
        });

        allCharacters.filter(nameInfo => localCharacters[nameInfo.value]).forEach((nameInfo) => {
            removeArray.push(nameInfo);
        });

        addArray.sort(Utils.charOrdAObject);
        removeArray.sort(Utils.charOrdAObject);

        const addData = getSelect2Data(addArray);
        const removeData = getSelect2Data(removeArray);

        state.ExternalCharacterSelectors.forEach((selector) => {
            $(`#${selector.id}`).select2(addData);
        });
        state.InternalCharacterSelectors.forEach((selector) => {
            $(`#${selector.id}`).select2(removeData);
        });

        let tableHead = clearEl(getEl('story-characterActivityTableHead'));
        let table = clearEl(getEl('story-characterActivityTable'));
        addEl(tableHead, getCharacterHeader([getL10n('stories-name')].concat(Constants.characterActivityTypes.map(constL10n))));
        removeArray.forEach((removeValue) => {
            addEl(table, getCharacterActivity(removeValue, localCharacters[removeValue.value]));
        });

        tableHead = clearEl(getEl('storyCharactersTableHead'));
        table = clearEl(getEl('storyCharactersTable'));
        addEl(tableHead, getCharacterHeader([getL10n('stories-name'), getL10n('stories-inventory')]));
        removeArray.forEach((removeValue) => {
            addEl(table, getCharacterInput(removeValue, localCharacters[removeValue.value]));
        });
    }

    function addCharacter() {
        const characterName = getEl('storyCharactersAddSelector').value.trim();
        DBMS.addStoryCharacter(Stories.getCurrentStoryName(), characterName, Utils.processError(exports.refresh));
    }

    function switchCharacters() {
        const fromName = getEl('storyCharactersFromSelector').value.trim();
        const toName = getEl('storyCharactersToSelector').value.trim();
        DBMS.switchStoryCharacters(
            Stories.getCurrentStoryName(),
            fromName, toName, Utils.processError(exports.refresh)
        );
    }

    function removeCharacter() {
        const characterName = getEl('storyCharactersRemoveSelector').value.trim();
        Utils.confirm(strFormat(getL10n('stories-remove-character-from-story-warning'), [characterName]), () => {
            DBMS.removeStoryCharacter(
                Stories.getCurrentStoryName(),
                characterName, Utils.processError(exports.refresh)
            );
        });
    }

    function getCharacterHeader(values) {
        const tr = makeEl('tr');
        values.forEach((value) => {
            addEl(tr, addEl(makeEl('th'), makeText(value)));
        });
        return tr;
    }

    function getCharacterInput(characterMeta, character) {
        const tr = makeEl('tr');
        let td = makeEl('td');
        td.appendChild(makeText(characterMeta.displayName));
        tr.appendChild(td);

        td = makeEl('td');
        const input = makeEl('input');
        input.value = character.inventory;
        input.characterName = character.name;
        addClasses(input, ['inventoryInput', 'isStoryEditable', 'form-control']);
        input.addEventListener('change', updateCharacterInventory);
        td.appendChild(input);
        tr.appendChild(td);
        return tr;
    }

    function updateCharacterInventory(event) {
        DBMS.updateCharacterInventory(
            Stories.getCurrentStoryName(),
            event.target.characterName, event.target.value, Utils.processError()
        );
    }

    function getCharacterActivity(characterMeta, character) {
        const tr = makeEl('tr');
        let td = makeEl('td');
        td.appendChild(makeText(characterMeta.displayName));
        tr.appendChild(td);

        let input;
        addEls(tr, Constants.characterActivityTypes.map((activityType) => {
            td = addClass(makeEl('td'), 'vertical-aligned-td');
            input = makeEl('input');
            addClass(input, 'isStoryEditable');
            input.type = 'checkbox';
            if (character.activity[activityType]) {
                input.checked = true;
            }
            input.characterName = character.name;
            input.activityType = activityType;
            input.addEventListener('change', onChangeCharacterActivity);
            setAttr(input, 'id', character.name + activityType);
            addClass(input, 'hidden');
            addEl(td, input);
            const label = addClass(makeEl('label'), `checkbox-label activity-icon-${activityType} fa-icon`);
            setAttr(label, 'for', character.name + activityType);
            return addEl(td, label);
        }));
        return tr;
    }

    function onChangeCharacterActivity(event) {
        DBMS.onChangeCharacterActivity(
            Stories.getCurrentStoryName(), event.target.characterName,
            event.target.activityType, event.target.checked, Utils.processError()
        );
    }
})(this.StoryCharacters = {});
