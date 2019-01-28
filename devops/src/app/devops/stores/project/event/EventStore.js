import { observable, action, computed } from 'mobx';
import { axios, store } from 'choerodon-front-boot';
import { handleProptError } from '../../../utils';

const HEIGHT = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
@store('EventStore')
class EventStore {
  @observable allData = [];

  @observable isRefresh = false;

  // 页面的loading
  @observable loading = false;

  // 打开tab的loading
  @observable singleData = null;

  @observable network = [];

  @observable env = [];

  @observable dto = [];

  @observable eventState = [];

  @observable envCluster = [];

  @observable pageInfo = {
    current: 1, total: 0, pageSize: HEIGHT <= 900 ? 30 : 30,
  };

  @observable certificates = [];

  @observable Info = {
    filters: {}, sort: { columnKey: 'id', order: 'descend' }, paras: [],
  };

  @action setCertificates(data) {
    this.certificates = data;
  }

  @computed get getCertificates() {
    return this.certificates;
  }

  @action setPageInfo(page) {
    this.pageInfo.current = page.number + 1;
    this.pageInfo.total = page.totalElements;
    this.pageInfo.pageSize = page.size;
  }

  @computed get getPageInfo() {
    return this.pageInfo;
  }

  @computed
  get getAllData() {
    return this.allData.slice();
  }

  @action
  setAllData(data) {
    this.allData = data;
  }

  @computed
  get getEnvCluster() {
    return this.envCluster.slice();
  }

  @action
  setEnvCluster(data) {
    this.envCluster = data;
  }

  @computed
  get getDto() {
    return this.dto.slice();
  }

  @action
  setDto(data) {
    this.dto = data;
  }

  @computed
  get getEventState() {
    return this.eventState;
  }

  @action
  setEventState(data) {
    this.eventState = data;
  }

  @action
  changeLoading(flag) {
    this.loading = flag;
  }

  @computed
  get getLoading() {
    return this.loading;
  }

  @action changeIsRefresh(flag) {
    this.isRefresh = flag;
  }

  @computed get getIsRefresh() {
    return this.isRefresh;
  }

  @action
  setSingleData(data) {
    this.singleData = data;
  }

  @computed
  get getSingleData() {
    return this.singleData;
  }

  @computed
  get getEnv() {
    return this.env.slice();
  }

  @action
  setEnv(data) {
    this.env = data;
  }

  @action setInfo(Info) {
    this.Info = Info;
  }

  @computed get getInfo() {
    return this.Info;
  }

  loadData = (isRefresh = true, proId, cc, page = this.pageInfo.current - 1, pageSize = this.pageInfo.pageSize, sort = { field: 'id', order: 'desc' }, datas = {
    searchParam: {},
    param: '',
  }) => {
    if (isRefresh) {
      this.changeIsRefresh(true);
    }
    this.changeLoading(true);
    return axios.post(`/collector/v1/collector/eventlogs/orgId/${cc[0]}/namespace/${cc[1]}?page=${page}&size=${pageSize}&sort=${sort.field || 'id'},${sort.order}`, JSON.stringify(datas))
      .then((data) => {
        const res = handleProptError(data);
        if (res) {
          this.handleData(data);
        }
        this.changeLoading(false);
        this.changeIsRefresh(false);
      });
  };

  handleData =(data) => {
    this.setAllData(data.content);
    const { number, size, totalElements } = data;
    this.setPageInfo({ number, size, totalElements });
  };

  loadDataById = (projectId, id) => axios.get(`/devops/v1/projects/${projectId}/ingress/${id}`).then((data) => {
    const res = handleProptError(data);
    if (res) {
      this.setSingleData(data);
    }
    return res;
  });

  loadEnv = projectId => axios.get(`devops/v1/projects/${projectId}/envs?active=true`)
    .then((data) => {
      const res = handleProptError(data);
      if (res) {
        this.setEnv(data);
      }
      return res;
    });

  loadEnvCluster = projectId => axios.get(`devops/v1/projects/${projectId}/envs-ex?active=true`)
    .then((data) => {
      const res = handleProptError(data);
      if (res) {
        this.setEnvCluster(data);
      }
      return res;
    });

  loadEventState = (clusterId,namespace) => axios.get(`/collector/v1/collector/config/devopsCluster/${clusterId}/namespace/${namespace}`)
    .then((data) => {
      const res = handleProptError(data);
      if (res) {
        this.setEventState(data);
      }
      return res;
    });

  updateStatus = (data) => axios.post(`/collector/v1/collector/config`, JSON.stringify(data))
    .then((datas) => {
      const res = this.handleProptError(datas);
      return res;
    });

}

const eventStore = new EventStore();
export default eventStore;
