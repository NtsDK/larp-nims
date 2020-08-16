import React from 'react';
import { useTranslation } from 'react-i18next';
import FormGroup from 'react-bootstrap/es/FormGroup';
import FormControl from 'react-bootstrap/es/FormControl';
import ControlLabel from 'react-bootstrap/es/ControlLabel';
import * as Constants from 'nims-dbms/nimsConstants';
import * as R from 'ramda';
import { UI, U, L10n } from 'nims-app-core';
import { FormDialog } from '../../../commons/uiCommon3/FormDialog.jsx';

import './CreateProfileItemDialog.css';

export function CreateProfileItemDialog(props) {
  const { profileStructure, onCreate, ...elementProps } = props;
  const { t } = useTranslation();
  const getPositionOptions = R.pipe(R.pluck('name'), R.map((name) => t('common.set-item-before2', { name })));
  const positionOptions = [...getPositionOptions(profileStructure), t('common.set-item-as-last')];

  async function onSubmit({ itemName, itemPosition, itemType }) {
    return DBMS.createProfileItem({
      type: 'character', name: itemName, itemType, selectedIndex: Number(itemPosition)
    }).then(onCreate).catch((err) => UI.handleErrorMsg(err));
  }

  return (
    <FormDialog
      formId="createProfileItem"
      title={t('profiles.create-profile-item')}
      {...elementProps}
      onSubmit={onSubmit}
    >
      <FormGroup>
        <ControlLabel>{t('profiles.profile-item-name')}</ControlLabel>
        <FormControl name="itemName" />
      </FormGroup>
      <FormGroup>
        <ControlLabel>{t('profiles.profile-item-position')}</ControlLabel>
        <FormControl componentClass="select" name="itemPosition" defaultValue={String(profileStructure.length)}>
          {
            positionOptions.map((name, index) => <option value={String(index)} key={String(index)}>{name}</option>)
          }
        </FormControl>
      </FormGroup>
      <FormGroup>
        <ControlLabel>{t('profiles.profile-item-type')}</ControlLabel>
        <FormControl componentClass="select" name="itemType">
          {
            Constants.profileFieldTypesNames.map((value) => <option value={value} key={value}>{t(`constant.${value}`)}</option>)
          }
        </FormControl>
      </FormGroup>
    </FormDialog>
  );
}
