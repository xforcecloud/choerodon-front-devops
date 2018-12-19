import React from 'react';
import {
  Route,
  Switch,
} from 'react-router-dom';
import { asyncRouter, nomatch } from 'choerodon-front-boot';

const WarningsHome = asyncRouter(() => import('./warningsHome'), () => import('../../../stores/project/warnings'));

const EventIndex = ({ match }) => (
  <Switch>
    <Route exact path={match.url} component={WarningsHome} />
    <Route path="*" component={nomatch} />
  </Switch>
);

export default EventIndex;

