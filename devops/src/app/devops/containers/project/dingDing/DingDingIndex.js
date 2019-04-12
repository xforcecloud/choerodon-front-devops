import React from 'react';
import {
  Route,
  Switch,
} from 'react-router-dom';
import { asyncRouter, nomatch } from 'choerodon-front-boot';

const DingDingHome = asyncRouter(() => import('./dingDingHome'), () => import('../../../stores/project/dingDing'));

const EventIndex = ({ match }) => (
  <Switch>
    <Route exact path={match.url} component={DingDingHome} />
    <Route path="*" component={nomatch} />
  </Switch>
);

export default EventIndex;