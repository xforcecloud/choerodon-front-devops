import React from 'react';
import {
  Route,
  Switch,
} from 'react-router-dom';
import { asyncRouter, nomatch } from 'choerodon-front-boot';

const ApplyHome = asyncRouter(() => import('./Home'), () => import('../../../stores/admin/apply'));

const ApplyIndex = ({ match }) => (
  <Switch>
    <Route exact path={match.url} component={ApplyHome} />
    <Route path="*" component={nomatch} />
  </Switch>
);

export default ApplyIndex;
