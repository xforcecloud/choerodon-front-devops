import React from 'react';
import {
  Route,
  Switch,
} from 'react-router-dom';
import { asyncRouter, nomatch } from 'choerodon-front-boot';

const redashHome = asyncRouter(() => import('./redashHome/index'), () => import('../../../stores/project/redash/index'));

const RedashIndex = ({ match }) => (
  <Switch>
    <Route exact path={match.url} component={redashHome} />
    <Route path="*" component={nomatch} />
  </Switch>
);

export default RedashIndex;
