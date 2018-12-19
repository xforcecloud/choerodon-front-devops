import React from 'react';
import {
  Route,
  Switch,
} from 'react-router-dom';
import { asyncRouter, nomatch } from 'choerodon-front-boot';

const EventHome = asyncRouter(() => import('./eventHome'), () => import('../../../stores/project/event'));

const EventIndex = ({ match }) => (
  <Switch>
    <Route exact path={match.url} component={EventHome} />
    <Route path="*" component={nomatch} />
  </Switch>
);

export default EventIndex;

