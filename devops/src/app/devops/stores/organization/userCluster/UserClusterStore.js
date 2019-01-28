import { observable, action, computed } from 'mobx';
import { axios, store } from 'choerodon-front-boot';
import _ from 'lodash';
import { handleProptError } from '../../../utils/index';

const HEIGHT = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
@store('UserClusterStore')
class UserClusterStore {
  @observable clusterData = [];

  @observable activeClusterData = [];

  @observable loading = false;

  @observable tLoading = false;

  @observable proData = [];

  @observable prmProData = [];

  @observable shell = '';

  @observable clsData = null;

  @observable clusterName = "";

  @observable selectedRowKeys = [];

  @observable tagKeys = [];

  @observable pageInfo = {
    current: 1, total: 0, pageSize: HEIGHT <= 900 ? 10 : 15,
  };

  @observable clsPageInfo = {
    current: 1, total: 0, pageSize: HEIGHT <= 900 ? 12 : 18,
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

  @action setClsPageInfo(page) {
    this.clsPageInfo.current = page.number + 1;
    this.clsPageInfo.total = page.totalElements;
    this.clsPageInfo.pageSize = page.size;
  }

  @computed get getClsPageInfo() {
    return this.clsPageInfo;
  }

  @computed get getData() {
    return this.clusterData;
  }

  @action setData(data) {
    this.clusterData = data;
  }

  @computed get getActiveClusterData() {
    return this.activeClusterData.slice();
  }

  @action setActiveClusterData(data) {
    this.activeClusterData = data;
  }

  @action changeLoading(flag) {
    this.loading = flag;
  }

  @computed get getLoading() {
    return this.loading;
  }

  @action tableLoading(flag) {
    this.tLoading = flag;
  }

  @computed get getTableLoading() {
    return this.tLoading;
  }

  @action setProData(data) {
    this.proData = data;
  }

  @computed get getProData() {
    return this.proData.slice();
  }

  @action setPrmPro(data) {
    this.prmProData = data;
  }

  @computed get getPrmPro() {
    return this.prmProData.slice();
  }

  @computed get getClsData() {
    return this.clsData;
  }

  @action setClsData(data) {
    this.clsData = data;
  }

  @action setInfo(Info) {
    this.Info = Info;
  }

  @computed get getInfo() {
    return this.Info;
  }

  @action
  setShell(shell) {
    this.shell = shell;
  }

  @computed
  get getShell() {
    return this.shell;
  }

  @action
  setClusterName(clusterName) {
    this.clusterName = clusterName;
  }

  @computed
  get getClusterName() {
    return this.clusterName;
  }

  @action
  setSideType(data) {
    this.sideType = data;
  }

  @computed
  get getSideType() {
    return this.sideType;
  }

  @action setSelectedRk(selectedRowKeys) {
    this.selectedRowKeys = selectedRowKeys;
  }

  @computed get getSelectedRk() {
    return this.selectedRowKeys.slice();
  }

  @action setTagKeys(tagKeys) {
    this.tagKeys = tagKeys;
  }

  @computed get getTagKeys() {
    return this.tagKeys.slice();
  }

  loadCluster = (orgId, page = this.clsPageInfo.current - 1, size = this.clsPageInfo.pageSize, sort = { field: 'id', order: 'desc' }, postData = {
    searchParam: {},
    param: '',
  }) => {
    this.changeLoading(true);
    return axios.post(`/x-devops/v1/cluster/type/${orgId}`, JSON.stringify(postData))
      .then((data) => {
        const res = handleProptError(data);
        if (res) {
          this.setData(res);
          const { number, size, totalElements } = data;
          const page = { number, size, totalElements };
          this.setClsPageInfo(page);
          this.changeLoading(false);
        }
      });
  };

  loadActiveCluster = (orgId, page = this.clsPageInfo.current - 1, size = this.clsPageInfo.pageSize, sort = { field: 'id', order: 'desc' }, postData = {
    searchParam: {},
    param: '',
  }) => {
    this.changeLoading(true);
    return axios.post(`/x-devops/v1/admin-cluster/queryIsActive/${orgId}?page=${page}&size=${size}&sort=${sort.field || 'id'},${sort.order}`, JSON.stringify(postData))
      .then((data) => {
        const res = handleProptError(data);
        if (res) {
          this.setActiveClusterData(res.content);
          const { number, size, totalElements } = data;
          const page = { number, size, totalElements };
          this.setClsPageInfo(page);
          this.tableLoading(false);
        }
      });
  };

  loadPro = (orgId, clusterId, page = this.pageInfo.current - 1, size = this.pageInfo.pageSize, sort = { field: 'id', order: 'desc' }, postData = []) => {
    this.tableLoading(true);
    const url = clusterId ? `/devops/v1/organizations/${orgId}/clusters/pageProjects?clusterId=${clusterId}&page=${page}&size=${size}&sort=${sort.field || 'id'},${sort.order}` : `/devops/v1/organizations/${orgId}/clusters/pageProjects?page=${page}&size=${size}&sort=${sort.field || 'id'},${sort.order}`;
    return axios.post(url, JSON.stringify(postData)).then((data) => {
      if (data && data.failed) {
        Choerodon.prompt(data.message);
      } else if(clusterId) {
        this.setPrmPro(data.content);
        this.setSelectedRk(_.map(_.filter(data.content, 'permission'), k => k.id));
        const { number, size, totalElements } = data;
        const page = { number, size, totalElements };
        this.setPageInfo(page);
      } else {
        this.setProData(data.content);
        const { number, size, totalElements } = data;
        const page = { number, size, totalElements };
        this.setPageInfo(page);
      }
      this.tableLoading(false);
    });
  };

  loadClsById(orgId, id) {
    return axios.get(`/devops/v1/organizations/${orgId}/clusters/${id}`)
      .then((data) => {
        if (data && data.failed) {
          Choerodon.prompt(data.message);
        } else {
          this.setClsData(data);
        }
        return data;
      });
  }

  loadTagKeys = (orgId, id) => axios.get(`/devops/v1/organizations/${orgId}/clusters/list_cluster_projects/${id}`).then((data) => {
    if (data && data.failed) {
      Choerodon.prompt(data.message);
    } else {
      this.setTagKeys(data);
    }
  });

  createCluster(orgId, data) {
    return axios.post(`/x-devops/v1/cluster/open`, JSON.stringify(data));
  }

  updateCluster(data) {
    return axios.post(`/x-devops/v1/cluster/type`, JSON.stringify(data));
  }

  revoke(orgId, data) {
    return axios.post(`/x-devops/v1/cluster/revoke`, JSON.stringify(data));
  }

  loadShell = (orgId, id) => axios.get(`/devops/v1/organizations/${orgId}/clusters/query_shell/${id}`).then((data) => {
    const res = handleProptError(data);
    if (res) {
      this.setShell(res);
    }
  });

  loadClusterById = (id) => axios.get(`/x-devops/v1/admin-cluster/${id}`).then((data) => {
    this.setClusterName(data.name);
    return data.name;
  });

  checkCode(orgId, code) {
   return axios.get(`/devops/v1/organizations/${orgId}/clusters/checkCode?code=${code}`);
  }

  checkName(orgId, name){
    return axios.get(`/devops/v1/organizations/${orgId}/clusters/checkName?name=${name}`);
  }
}

const userClusterStore = new UserClusterStore();
export default userClusterStore;
