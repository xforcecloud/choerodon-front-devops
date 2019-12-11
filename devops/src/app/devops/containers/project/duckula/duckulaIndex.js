import React from 'react';
import {
  Route,
  Switch,
} from 'react-router-dom';
import { asyncRouter, nomatch } from 'choerodon-front-boot';

const duckulaHome = asyncRouter(() => import('./duckulaHome/index'), () => import('../../../stores/project/duckula/index'));

const DuckulaIndex = ({ match }) => (
  <Switch>
    <Route exact path={match.url} component={duckulaHome} />
    <Route path="*" component={nomatch} />
  </Switch>
);

export default DuckulaIndex;
