import { observable, action, computed } from 'mobx';
import { axios, store, stores } from 'choerodon-front-boot';
import DeploymentPipelineStore from '../deploymentPipeline';

const { AppState } = stores;
const HEIGHT = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;

@store('DingDingStore')
class DingDingStore {
  @observable allData = [];

  @observable isRefresh= false;

  // 页面的loading
  @observable loading = false;

  // 打开tab的loading
  @observable singleData = null;

  @observable selectData = [];

  @observable pageInfo = {
    current: 1, total: 0, pageSize: HEIGHT <= 900 ? 30 : 30,
  };

  @observable Info = {
    filters: {}, sort: { columnKey: 'id', order: 'descend' }, paras: [],
  };

  @action setPageInfo(page) {
    this.pageInfo.current = page.number + 1;
    this.pageInfo.total = page.totalElements;
    this.pageInfo.pageSize = page.size;
  }

  @computed get getPageInfo() {
    return this.pageInfo;
  }

  @computed get getAllData() {
    return this.allData;
  }

  @action setAllData(data) {
    this.allData = data;
  }

  @computed get getSelectData() {
    return this.singleData.slice();
  }

  @action setSelectData(data) {
    this.selectData = data.slice();
  }

  @action changeIsRefresh(flag) {
    this.isRefresh = flag;
  }

  @computed get getIsRefresh() {
    return this.isRefresh;
  }

  @action changeLoading(flag) {
    this.loading = flag;
  }

  @computed get getLoading() {
    return this.loading;
  }

  @action setSingleData(data) {
    this.singleData = data;
  }

  @computed get getSingleData() {
    return this.singleData;
  }

  @action setInfo(Info) {
    this.Info = Info;
  }

  @computed get getInfo() {
    return this.Info;
  }

  loadData = (isRefresh = false, projectId, envId, page = this.pageInfo.current - 1, size = this.pageInfo.pageSize, sort = { field: '', order: 'desc' }, postData = { searchParam: {},
    param: '',
  }) => {
    if (isRefresh) {
      this.changeIsRefresh(true);
    }
    let url = `http://collector.xcloud.xforceplus.com/v1/collector/ding/config/${projectId}/list`;
    this.changeLoading(true);
    return axios.get(url, JSON.stringify(postData))
      .then((data) => {
        const res = this.handleProptError(data);
        if (res) {
          this.handleData(data);
        }
        this.changeLoading(false);
        this.changeIsRefresh(false);
      });
  };

  handleData =(data) => {
    this.setAllData(data);
    const { number, size, totalElements } = data;
    const page = { number, size, totalElements };
    this.setPageInfo(page);
  };

  loadSelectData = projectId => axios.get(`/devops/v1/projects/${projectId}/apps/template`)
    .then((data) => {
      const res = this.handleProptError(data);
      if (res) {
        this.setSelectData(res);
      }
    });

  loadDataById =(projectId, id) => axios.get(`/devops/v1/projects/${projectId}/apps/${id}/detail`).then((data) => {
    const res = this.handleProptError(data);
    if (res) {
      this.setSingleData(data);
    }
  });

  checkCode =(projectId, code) => axios.get(`/devops/v1/projects/${projectId}/apps/checkCode?code=${code}`)
    .then((data) => {
      const res = this.handleProptError(data);
      return res;
    });

  checkName = (projectId, name) => axios.get(`/devops/v1/projects/${projectId}/apps/checkName?name=${name}`)
    .then((data) => {
      const res = this.handleProptError(data);
      return res;
    });

  addData = (projectId, data) => axios.post(`http://collector.xcloud.xforceplus.com/v1/collector/ding/config`, JSON.stringify(data))
    .then((datas) => {
      const res = this.handleProptError(datas);
      return res;
    });

  deleteApps = (projectId, dingDing) => axios.post(`http://collector.xcloud.xforceplus.com/v1/collector/ding/config/drop`, JSON.stringify(dingDing))
    .then((datas) => {
      const res = this.handleProptError(datas);
      return res;
    });

  handleProptError =(error) => {
    if (error && error.failed) {
      Choerodon.prompt(error.message);
      this.changeLoading(false);
      this.changeIsRefresh(false);
      return false;
    } else {
      return error;
    }
  }
}

const dingDingStore = new DingDingStore();
export default dingDingStore;
