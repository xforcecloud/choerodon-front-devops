import { observable, action, computed } from 'mobx';
import { axios, store, stores } from 'choerodon-front-boot';
import _ from 'lodash';
import { handleProptError } from '../../../utils/index';
import DeploymentPipelineStore from "../deploymentPipeline";
import CertificateStore from "../certificate";
import ContainerStore from "../container";
import InstancesStore from "../instances";

const { AppState } = stores;

const HEIGHT = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;

@store('AliLogStore')
class AliLogStore {

  @observable loading = false;

  @observable tLoading = false;

  @observable signInUrl = "";

  @observable envCard = [];

  @observable tpEnvId = null;

  @observable tpEnvCode = null;

  @observable preProId = AppState.currentMenuType.id;

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

  @computed get getEnvcard() {
    return this.envCard;
  }

  @action setEnvcard(envCard) {
    this.envCard = envCard;
  }

  @action setTpEnvId(tpEnvId) {
    this.tpEnvId = tpEnvId;
  }

  @action setTpEnvCode(tpEnvCode) {
    this.tpEnvCode = tpEnvCode;
  }

  @computed get getTpEnvId() {
    return this.tpEnvId;
  }

  @computed get getTpEnvCode() {
    return this.tpEnvCode;
  }

  @action setPreProId(id) {
    this.preProId = id;
  }

  createSignInUrl(projectId, envId) {
    this.changeLoading(true);
    return axios.get(`/x-devops/v1/projects/${projectId}/aliyun/sls/logsearch?env_id=${envId}`)
      .then((data) => {
        if (data && data.failed) {
          Choerodon.prompt(data.message);
        } else {
          this.setSignInUrl(data);
        }
        this.changeLoading(false);
      });
  }

  loadActiveEnv = (projectId, type) => {
    if (Number(this.preProId) !== Number(projectId)) {
      this.setEnvcard([]);
      this.setTpEnvId(null);
      this.setTpEnvCode(null);
    }
    this.setPreProId(projectId);
    return axios.get(`devops/v1/projects/${projectId}/envs?active=true`)
      .then((data) => {
        const res = handleProptError(data);
        if (res) {
          const envSort = _.concat(_.filter(data, ['connect', true]), _.filter(data, ['connect', false]));
          const flag = _.filter(envSort, ['permission', true]);
          const flagConnect = _.filter(flag, ['connect', true]);
          this.setEnvcard(envSort);
          if (!this.tpEnvId && flagConnect.length) {
            const envId = flagConnect[0].id;
            const envCode = flagConnect[0].code;
            this.setTpEnvId(envId);
            this.setTpEnvCode(envCode);
            this.createSignInUrl(projectId, envId)
          } else if (!this.tpEnvId && flag.length) {
            const envId = flag[0].id;
            const envCode = flag[0].code;
            this.setTpEnvId(envId);
            this.setTpEnvCode(envCode);
            this.createSignInUrl(projectId, envId)
          } else if (flag.length && _.filter(flag, ['id', this.tpEnvId]).length === 0) {
            const envId = flag[0].id;
            const envCode = flag[0].code;
            this.setTpEnvId(envId);
            this.setTpEnvCode(envCode);
            this.createSignInUrl(projectId, envId)
          } else if (flag.length === 0) {
            this.setTpEnvId(null);
            this.setTpEnvCode(null);
            this.createSignInUrl(projectId, null)
          }
        }
        return data;
      });
  };
}

const aliLogStore = new AliLogStore();
export default aliLogStore;
