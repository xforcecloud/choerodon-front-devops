import { observable, action, computed } from 'mobx';
import { axios, store } from 'choerodon-front-boot';
import _ from 'lodash';
import { handleProptError } from '../../../utils/index';

const HEIGHT = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
@store('AliLogStore')
class AliLogStore {

  @observable loading = false;

  @observable tLoading = false;

  @observable signInUrl = "";

  @action changeLoading(flag) {
    this.loading = flag;
  }

  @computed get getLoading() {
    return this.loading;
  }

  @computed get getSignInUrl() {
    return this.signInUrl;
  }

  @action setSignInUrl(signInUrl) {
    this.signInUrl = signInUrl;
  }

  createSignInUrl(projectId) {
    this.changeLoading(true);
    return axios.get(`/x-devops/v1/projects/${projectId}/aliyun/sls/logsearch`)
      .then((data) => {
        if (data && data.failed) {
          Choerodon.prompt(data.message);
        } else {
          this.setSignInUrl(data);
        }
        this.changeLoading(false);
      });
  }
}

const aliLogStore = new AliLogStore();
export default aliLogStore;
