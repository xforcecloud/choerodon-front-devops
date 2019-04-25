import React from 'react';
import {
  Route,
  Switch,
} from 'react-router-dom';
import { asyncRouter, nomatch } from 'choerodon-front-boot';

const AliLogHome = asyncRouter(() => import('./aliLogHome/index'), () => import('../../../stores/project/aliLog/index'));

const AliLogIndex = ({ match }) => (
  <Switch>
    <Route exact path={match.url} component={AliLogHome} />
    <Route path="*" component={nomatch} />
  </Switch>
);

export default AliLogIndex;
