/*Copyright 2018 Timofey Rechkalov <ntsdk@yandex.ru>, Maria Sidekhmenova <matilda_@list.ru>

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

function ProfileEditorTmpl(exports, opts) {
    
    const { firstType, secondType, settingsPath } = opts; 
    
    const tmplRoot = '.profile-editor2-tab-tmpl';
    const root = `.profile-editor2-tab.${firstType + '-type'} `;
    const state = {};
    const l10n = L10n.get('profiles');
    let profileEditorCore;
    const profileDiv = `${root}.profile-div`;
    const reportByStoriesDiv = `${root}.report-by-stories-div tbody`;
    const reportByRelationsDiv = `${root}.report-by-relations-div tbody`;
    
    exports.init = () => {
        profileEditorCore = ProfileEditorCore.makeProfileEditorCore();
        const el = queryEl(tmplRoot).cloneNode(true);
        
        addClasses(el, ['profile-editor2-tab', `${firstType + '-type'}`]);
        removeClass(el, 'profile-editor2-tab-tmpl');
        addEl(queryEl('.tab-container'), el);
        
        setClassByCondition(qee(el, '.report-by-stories'), 'hidden', firstType === 'player');
        setClassByCondition(qee(el, '.report-by-relations'), 'hidden', firstType === 'player');
        setAttr(qee(el, '.entity-filter'), 'l10n-placeholder-id', 'profiles-' + opts.filterPlaceholder);
        setAttr(qee(el, '.profile-panel h3'), 'l10n-id', 'profiles-' + opts.panelName);
        setAttr(qee(el, '.create'), 'l10n-title', 'profiles-' + opts.createProfile);
        L10n.localizeStatic(el);

        setAttr(qee(el,'.report-by-stories a') , 'panel-toggler', root + ".report-by-stories-div");
        setAttr(qee(el,'.report-by-relations a') , 'panel-toggler', root + ".report-by-relations-div");
        setAttr(qee(el,'.profile-panel a') , 'panel-toggler', root + ".profile-div");
        UI.initPanelTogglers(el);
        
        exports.content = el;
        listen(queryEl(`${root} .entity-filter`), 'input', filterOptions);
        listen(queryEl(`${root} .create`), 'click', () => Utils.prompt(l10n(opts.createMsg), createProfile));
    };

    exports.refresh = () => {
        PermissionInformer.getEntityNamesArray(firstType, false, (err, primaryNames) => {
            if (err) { Utils.handleError(err); return; }
            PermissionInformer.getEntityNamesArray(secondType, false, (err2, secondaryNames) => {
                if (err2) { Utils.handleError(err2); return; }
                DBMS.getProfileBindings((err3, profileBindings) => {
                    if (err3) { Utils.handleError(err3); return; }
                    profileBindings = opts.processBindings(profileBindings);
                    rebuildInterface(primaryNames, secondaryNames, profileBindings);
                });
            });
        });
    };
    
    function rebuildInterface(primaryNames, secondaryNames, profileBindings){
        const secDict = R.indexBy(R.prop('value'), secondaryNames);
        addEls(clearEl(queryEl(`${root} .entity-list`)), primaryNames.map( name => {
            const el = wrapEl('div', qte(`${root} .entity-item-tmpl` ));
            addEl(qee(el, '.primary-name'), makeText(name.displayName));
            setAttr(el, 'primary-name', name.displayName);
            setAttr(el, 'profile-name', name.value);
            if(profileBindings[name.value] !== undefined){
                const secondaryName = secDict[profileBindings[name.value]].displayName;
                addEl(qee(el, '.secondary-name'), makeText(secondaryName));
                setAttr(el, 'secondary-name', secondaryName);
            }
            listen(qee(el, '.select-button'), 'click', () => selectProfile(name.value));
            setAttr(qee(el, '.rename'), 'title', l10n(opts.renameProfile));
            setAttr(qee(el, '.remove'), 'title', l10n(opts.removeProfile));
            if(name.editable){
                listen(qee(el, '.rename'), 'click', () => {
                    Utils.prompt(l10n(opts.renameMsg), renameProfile(name.value), {
                        value: name.value
                    })
                });
                listen(qee(el, '.remove'), 'click', removeProfile(firstType, name.value));
            } else {
                setAttr(qee(el, '.rename'), 'disabled', 'disabled');
                setAttr(qee(el, '.remove'), 'disabled', 'disabled');
            }
            return el;
        }));
        
        const callback = () => {
            selectProfile(UI.checkAndGetEntitySetting(settingsPath, primaryNames));
        }
        DBMS.getProfileStructure(firstType, (err2, allProfileSettings) => {
            if (err2) { Utils.handleError(err2); return; }
            profileEditorCore.initProfileStructure(profileDiv, firstType, allProfileSettings, callback);
        });
        
    }
    
    function selectProfile(name){
        UI.updateEntitySetting(settingsPath, name);
        queryEls(`${root} [profile-name] .select-button`).map(removeClass(R.__, 'btn-primary'));
        const el = queryEl(`${root} [profile-name="${name}"] .select-button`);
        addClass(el, 'btn-primary');
        el.scrollIntoView();
        
        DBMS.getProfile(firstType, name, (err, profile) => {
            if (err) { Utils.handleError(err); return; }
            PermissionInformer.isEntityEditable(firstType, name, (err2, isProfileEditable) => {
                if (err2) { Utils.handleError(err2); return; }
                profileEditorCore.fillProfileInformation(profileDiv, firstType, profile, () => isProfileEditable);

                if (firstType === 'character') {
                    DBMS.getCharacterReport(name, (err3, characterReport) => {
                        if (err3) { Utils.handleError(err3); return; }
                        DBMS.getRelationsSummary(name, (err4, relationsSummary) => {
                            if (err4) { Utils.handleError(err4); return; }
                            removeClass(queryEl(reportByStoriesDiv), 'hidden');
                            addEls(clearEl(queryEl(reportByStoriesDiv)), characterReport.map(CharacterReports.makeStoryReportRow));
                            removeClass(queryEl(reportByRelationsDiv), 'hidden');
                            relationsSummary.relations.sort(CommonUtils.charOrdAFactory(rel => 
                                ProjectUtils.get2ndRelChar(name, rel).toLowerCase()));
                            
                            addEls(clearEl(queryEl(reportByRelationsDiv)), relationsSummary.relations
                                .map(CharacterReports.makeRelationReportRow(name)));
                        });
                    });
                }
            });
        });
    }
    
    function filterOptions(event){
        const str = event.target.value.toLowerCase();
        
        const els = queryEls(`${root} [primary-name]`);
        els.forEach(el => {
            let isVisible = getAttr(el, 'primary-name').toLowerCase().search(str) !== -1;
            if(!isVisible && getAttr(el, 'secondary-name') !== null){
                isVisible = getAttr(el, 'secondary-name').toLowerCase().search(str) !== -1;
            }
            setClassByCondition(el, 'hidden', !isVisible);
        });
        
        if(queryEl(`${root} .hidden[primary-name] .select-button.btn-primary`) !== null || 
            queryEl(`${root} [primary-name] .select-button.btn-primary`) === null) {
            const els = queryEls(`${root} [primary-name]`).filter(R.pipe(hasClass(R.__, 'hidden'), R.not));
            selectProfile(els.length > 0 ? getAttr(els[0], 'profile-name') : null);
        } else {
//            queryEl(`${root} [primary-name] .select-button.btn-primary`).scrollIntoView();
        }
    }
    
    function createProfile (value, onOk, onError){
        DBMS.createProfile(firstType, value, (err) => {
            if (err) {
                onError(err);
            } else {
                onOk();
                UI.updateEntitySetting(settingsPath, value);
                exports.refresh();
            }
        });
    };
    
    var renameProfile = R.curry((fromName, toName, onOk, onError) => {
        DBMS.renameProfile(firstType, fromName, toName, (err) => {
            if (err) {
                onError(err);
            } else {
                onOk();
                UI.updateEntitySetting(settingsPath, toName);
                exports.refresh();
            }
        });
    });
    
    function removeProfile(type, name) {
        return () => {
            Utils.confirm(strFormat(l10n(opts.removeMsg), [name]), () => {
                DBMS.removeProfile(type, name, (err) => {
                    if (err) { Utils.handleError(err); return; }
                    PermissionInformer.refresh((err2) => {
                        if (err2) { Utils.handleError(err2); return; }
                        exports.refresh();
                    });
                });
            });
        };
    }
}

ProfileEditorTmpl(this.CharacterEditor = {}, {
    firstType: 'character', 
    secondType: 'player',
    settingsPath: 'Characters',
    processBindings: R.identity,
    createMsg: 'enter-character-name',
    renameMsg: 'enter-new-character-name',
    removeMsg: 'are-you-sure-about-character-removing',
    filterPlaceholder: 'find-character',
    panelName: 'character-profile',
    createProfile: 'create-character',
    renameProfile: 'rename-character',
    removeProfile: 'remove-character',
});

ProfileEditorTmpl(this.PlayerEditor = {}, {
    firstType:  'player',
    secondType: 'character',
    settingsPath: 'Players',
    processBindings: R.invertObj,
    createMsg: 'enter-player-name',
    renameMsg: 'enter-new-player-name',
    removeMsg: 'are-you-sure-about-player-removing',
    filterPlaceholder: 'find-player',
    panelName: 'player-profile',
    createProfile: 'create-player',
    renameProfile: 'rename-player',
    removeProfile: 'remove-player',
});