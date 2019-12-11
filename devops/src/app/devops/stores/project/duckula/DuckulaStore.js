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

@store('DuckulaStore')
class DuckulaStore {

  @observable loading = false;

  @observable tLoading = false;

  @observable url = "";

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

  @computed get getUrl() {
    return this.url;
  }

  @action setUrl(url) {
    this.url = url;
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

  createLinkUrl = (projectId, envId, type, envName) => {
    return axios.get(`devops/v1/projects/${projectId}/envs-ex/${envId}/duckula`)
    .then((data) => {
      const res = handleProptError(data);
      if (res.baseUrl) {
        if(type == "ops"){
          this.setUrl(`${res.baseUrl}/duckula/opsmanager/${envName}`);
       }else if(type == "task"){
          this.setUrl(`${res.baseUrl}/duckula/TaskManager/${envName}`);
       }else if(type == "consumer"){
          this.setUrl(`${res.baseUrl}/es/consumerManager/${envName}`);
       }else if(type == "index"){
          this.setUrl(`${res.baseUrl}/es/indexManager/${envName}`);
       }else if(type == "stats"){
          this.setUrl(`${res.baseUrl}/duckula/viewnum/${envName}`);
       }else if(type == "import"){
          this.setUrl(`${res.baseUrl}/es/importManager/${envName}`);
       }
      }else{
        this.setUrl("");
     }
    })
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
            this.createLinkUrl(projectId, envId, type, envCode)
          } else if (!this.tpEnvId && flag.length) {
            const envId = flag[0].id;
            const envCode = flag[0].code;
            this.setTpEnvId(envId);
            this.setTpEnvCode(envCode);
            this.createLinkUrl(projectId, envId, type, envCode)
          } else if (flag.length && _.filter(flag, ['id', this.tpEnvId]).length === 0) {
            const envId = flag[0].id;
            const envCode = flag[0].code;
            this.setTpEnvId(envId);
            this.setTpEnvCode(envCode);
            this.createLinkUrl(projectId, envId, type, envCode)
          } else if (flag.length === 0) {
            this.setTpEnvId(null);
            this.setTpEnvCode(null);
            this.createLinkUrl(projectId, null, type, null)
          }
        }
        return data;
      });
  };
}

const duckulaStore = new DuckulaStore();
export default duckulaStore;
