import { observable, action, computed } from 'mobx';
import { axios, store, stores } from 'choerodon-front-boot';
import DeploymentPipelineStore from '../../project/deploymentPipeline';

const { AppState } = stores;
const HEIGHT = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;

@store('ApplyStore')
class ApplyStore {
  @observable allData = [];

  @observable isRefresh= false;

  // 页面的loading
  @observable loading = false;

  // 打开tab的loading
  @observable singleData = null;

  @observable organizationData = [];

  @observable pageInfo = {
    current: 1, total: 0, pageSize: 30,
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

  @computed get getOrganizationData() {
    return this.organizationData;
  }

  @action setOrganizationData(data) {
    this.organizationData = data;
  }


  @action setAllData(data) {
    this.allData = data;
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

  loadData = (isRefresh = false, projectId, type, envId, page = this.pageInfo.current - 1, size = this.pageInfo.pageSize, sort = { field: '', order: 'desc' }, postData = { searchParam: {},
    param: '',
  }) => {
    if (isRefresh) {
      this.changeIsRefresh(true);
    }
    let url = `/x-devops/v1/cluster/${type}`;
    if (sort.field !== '') {
      url = `/x-devops/v1/cluster/${type}`;
    }
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

  loadDataById =(projectId, id) => axios.get(`/devops/v1/projects/4/apps/${id}/detail`).then((data) => {
    const res = this.handleProptError(data);
    if (res) {
      this.setSingleData(data);
    }
  });

  reject = (clusterId,orgId,reason) => axios.put(`/x-devops/v1/admin-cluster/reject/${clusterId}?organizationId=${orgId}&rejectDesc=${reason}`)
    .then((datas) => {
      const res = this.handleProptError(datas);
      return res;
    });

  pass = (clusterId,orgId) => axios.put(`/x-devops/v1/admin-cluster/agree/${clusterId}?organizationId=${orgId}`)
    .then((datas) => {
      const res = this.handleProptError(datas);
      return res;
    });

  deleteApps = (projectId, id) => axios.delete(`/devops/v1/projects/4/apps/${id}`)
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

const applyStore = new ApplyStore();
export default applyStore;
