/*Copyright 2015-2018 Timofey Rechkalov <ntsdk@yandex.ru>, Maria Sidekhmenova <matilda_@list.ru>

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
    const root = '.story-characters-tab ';
    const superRoot = '.stories-tab ';
    let initialized = false;

    exports.init = () => {
        if (initialized) return;
        exports.addCharacterDialog = UI.createModalDialog(superRoot, addCharacter, {
            bodySelector: 'modal-add-character-body',
            dialogTitle: 'stories-add-character-title',
            actionButtonTitle: 'common-add',
        });

        state.switchCharacterDialog = UI.createModalDialog(root, switchCharacters, {
            bodySelector: 'modal-switch-event-body',
            dialogTitle: 'stories-switch-character-title',
            actionButtonTitle: 'common-replace',
        });

        exports.content = queryEl(root);
        initialized = true;
    };

    exports.refresh = () => {
        clearEl(queryEl(`${superRoot}.storyCharactersAddSelector`));
        clearEl(queryEl(`${root}.storyCharactersToSelector`));

        clearEl(queryEl(`${root}.storyCharactersTable`));

        if (!Stories.getCurrentStoryName()) { return; }

        Promise.all([
            PermissionInformer.isEntityEditable({type: 'story', name: Stories.getCurrentStoryName()}),
            PermissionInformer.getEntityNamesArray({type: 'character', editableOnly: false}),
            DBMS.getStoryCharacters({storyName: Stories.getCurrentStoryName()})
        ]).then(results => {
            const [isStoryEditable, allCharacters, localCharacters] = results;
            rebuildInterface(allCharacters, localCharacters);
            Utils.enable(exports.content, 'isStoryEditable', isStoryEditable);
            Stories.chainRefresh();
        }).catch(Utils.handleError);
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

        $(queryEl(`${superRoot}.storyCharactersAddSelector`)).select2({
            data: addData.data,
            dropdownParent: $(exports.addCharacterDialog)
        });
        $(queryEl(`${root}.storyCharactersToSelector`)).select2({
            data: addData.data,
            dropdownParent: $(state.switchCharacterDialog)
        });

        const table = clearEl(queryEl(`${root}.storyCharactersTable`));

        showEl(qe(`${root} table`), R.keys(localCharacters).length !== 0 );
        showEl(qe(`${root} .alert`), R.keys(localCharacters).length === 0 );

        removeArray.forEach((removeValue) => {
            addEl(table, getCharacterInput(removeValue, localCharacters[removeValue.value]));
        });
    }

    function addCharacter(dialog) {
        return () => {
            const characterName = queryEl(`${superRoot}.storyCharactersAddSelector`).value.trim();
            DBMS.addStoryCharacter({
                storyName: Stories.getCurrentStoryName(),
                characterName
            }).then(() => {
                dialog.hideDlg();
                exports.refresh();
            }).catch(err => setError(dialog, err));
        };
    }

    function switchCharacters(dialog) {
        return () => {
            const toName = queryEl(`${root}.storyCharactersToSelector`).value.trim();
            DBMS.switchStoryCharacters({
                storyName: Stories.getCurrentStoryName(),
                fromName: dialog.characterName,
                toName
            }).then(() => {
                dialog.hideDlg();
                exports.refresh();
            }).catch(err => setError(dialog, err));
        };
    }

    function removeCharacter(characterName) {
        return () => {
            Utils.confirm(strFormat(getL10n('stories-remove-character-from-story-warning'), [characterName]), () => {
                DBMS.removeStoryCharacter({
                    storyName: Stories.getCurrentStoryName(),
                    characterName
                }).then(exports.refresh).catch(Utils.handleError);
            });
        };
    }

    function getCharacterInput(characterMeta, character) {
        const el = wrapEl('tr', qte(`${root} .story-character-row-tmpl`));
        L10n.localizeStatic(el);
        const qe = qee(el);

        addEl(qe('.character-name'), makeText(characterMeta.displayName));

        let input = qe('.inventoryInput');
        input.value = character.inventory;
        input.characterName = character.name;
        listen(input, 'change', updateCharacterInventory);

        Constants.characterActivityTypes.forEach((activityType) => {
            input = qe(`.${activityType} input`);
            if (character.activity[activityType]) {
                input.checked = true;
            }
            input.characterName = character.name;
            input.activityType = activityType;
            listen(input, 'change', onChangeCharacterActivity);
            setAttr(input, 'id', character.name + activityType);
            setAttr(qe(`.${activityType} label`), 'for', character.name + activityType);
        });

        listen(qe('.replace.character'), 'click', () => {
            state.switchCharacterDialog.characterName = character.name;
            state.switchCharacterDialog.showDlg();
        });
        listen(qe('.remove.character'), 'click', removeCharacter(character.name));
        return el;
    }

    function updateCharacterInventory(event) {
        DBMS.updateCharacterInventory({
            storyName: Stories.getCurrentStoryName(),
            characterName: event.target.characterName,
            inventory: event.target.value
        }).catch(Utils.handleError);
    }

    function onChangeCharacterActivity(event) {
        DBMS.onChangeCharacterActivity({
            storyName: Stories.getCurrentStoryName(),
            characterName: event.target.characterName,
            activityType: event.target.activityType,
            checked: event.target.checked
        }).catch(Utils.handleError);
    }
})(this.StoryCharacters = {});
