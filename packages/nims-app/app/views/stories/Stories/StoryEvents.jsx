import React, { useContext, useEffect, useState } from 'react';
import { UI, U, L10n } from 'nims-app-core';
import * as R from 'ramda';
import * as CU from 'nims-dbms-core/commonUtils';
import * as Constants from 'nims-dbms/nimsConstants';
import { DbmsContext } from 'nims-app-core/dbmsContext';
import { useTranslation } from 'react-i18next';
import PermissionInformer from 'permissionInformer';
import { InlineNotification } from '../../commons/uiCommon3/InlineNotification.jsx';
import { OriginCard } from '../../adaptations/Adaptations/OriginCard/index';

export function StoryEvents(props) {
  const { storyName } = props;

  const { t } = useTranslation();
  const dbms = useContext(DbmsContext);

  const [state, setState] = useState(null);

  function refresh() {
    // hard removing state, removing event doesn't work without it
    // I don't know why
    setState(null);
    Promise.all([
      PermissionInformer.isEntityEditable({ type: 'story', name: storyName }),
      dbms.getMetaInfo(),
      dbms.getStoryEvents({ storyName })
    ]).then((results) => {
      const [isStoryEditable, metaInfo, events] = results;
      events.forEach((item, i) => (item.index = i));
      setState({ isStoryEditable, metaInfo, events });
    }).catch(UI.handleError);
  }

  useEffect(refresh, []);

  if (!state) {
    return null;
  }

  const { isStoryEditable, metaInfo, events } = state;

  return (
    <div className="story-events-tab">
      <div className="">
        <InlineNotification type="info" showIf={events.length === 0}>
          {t('advices.no-events-in-story')}
        </InlineNotification>
        <div className="tw-m-auto tw-max-w-screen-md">
          {
            events.map((event, i) => (
              <OriginCard
                metaInfo={metaInfo}
                storyName={storyName}
                event={event}
                nextEvent={events[i + 1]}
                key={storyName + event.index}
                refresh={refresh}
              />
            ))
          }
        </div>
      </div>
    </div>
  );
}
