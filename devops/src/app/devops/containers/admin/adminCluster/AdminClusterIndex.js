import React from 'react';
import {
  Route,
  Switch,
} from 'react-router-dom';
import { asyncRouter, nomatch } from 'choerodon-front-boot';

const ClusterHome = asyncRouter(() => import('./Home'), () => import('../../../stores/admin/adminCluster'));

const AdminClusterIndex = ({ match }) => (
  <Switch>
    <Route exact path={match.url} component={ClusterHome} />
    <Route path="*" component={nomatch} />
  </Switch>
);

export default AdminClusterIndex;
