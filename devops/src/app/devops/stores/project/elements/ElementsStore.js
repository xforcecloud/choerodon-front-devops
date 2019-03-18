import { observable, action, computed } from 'mobx';
import { axios, store } from 'choerodon-front-boot';
import _ from 'lodash';
import { handleProptError, handleCheckerProptError } from '../../../utils';

const HEIGHT =
  window.innerHeight ||
  document.documentElement.clientHeight ||
  document.body.clientHeight;
const TEST_PASS = 'pass';
const TEST_FAILED = 'failed';

@store('ElementsStore')
class ElementsStore {
  @observable listData = [];

  @observable pageInfo = {
    current: 1,
    total: 0,
    pageSize: HEIGHT <= 900 ? 10 : 15,
  };

  @observable loading = false;

  @observable testLoading = false;

  @observable testResult = '';

  @observable config = {};

  @action setListData(data) {
    this.listData = data;
  }

  @computed get getListData() {
    return this.listData.slice();
  }

  @action setPageInfo(data) {
    this.pageInfo = data;
  }

  @computed get getPageInfo() {
    return this.pageInfo;
  }

  @action setLoading(data) {
    this.loading = data;
  }

  @computed get getLoading() {
    return this.loading;
  }

  @action setTestLoading(data) {
    this.testLoading = data;
  }

  @computed get getTestLoading() {
    return this.testLoading;
  }

  @action setTestResult(data) {
    this.testResult = data;
  }

  @computed get getTestResult() {
    return this.testResult;
  }

  @action setConfig(data) {
    this.config = data;
  }

  @computed get getConfig() {
    return this.config;
  }

  async loadListData(projectId, page, size, sort, param) {
    this.setLoading(true);
    try {
      let field = sort.field || 'id';
      if (sort.field === 'origin') {
        field = 'projectId';
      }
      const data = await axios.post(
        `/devops/v1/projects/${projectId}/project_config/list_by_options?page=${page}&size=${size}&sort=${field},${sort.order}`,
        JSON.stringify(param),
      );
      const result = handleProptError(data);
      if (result) {
        const { number, totalElements: total, size: pageSize, content } = result;
        const listData = _.map(content, item => {
          const { config: { url }, projectId } = item;
          return {
            ...item,
            url,
            origin: projectId ? 'project' : 'system',
          };
        });
        const pageInfo = {
          current: number + 1,
          total,
          pageSize,
        };
        this.setListData(listData);
        this.setPageInfo(pageInfo);
      }
      this.setLoading(false);
    } catch (e) {
      this.setLoading(false);
      Choerodon.handleResponseError(e);
    }
  }

  /**
   * 组件配置信息
   * @param projectId
   * @param data
   * @param mode 创建or编辑
   * @returns {Req | IDBRequest<IDBValidKey> | Promise<void>}
   */
  submitConfig(projectId, data, mode) {
    const URL = `/devops/v1/projects/${projectId}/project_config`;

    let config = {
      url: data.url,
    };
    if (data.type === 'harbor') {
      config = {
        ...config,
        userName: data.userName,
        password: data.password,
        email: data.email,
        project: data.project || null,
      };
    }
    const body = {
      name: data.name,
      type: data.type,
      config: config,
    };
    return !mode ? axios.post(URL, JSON.stringify(body)) : axios.put(URL, JSON.stringify(body));
  }

  checkRepoLinkRequest(projectId, data, type) {
    const { url, userName, password, project, email } = data;
    const requestAPI = type === 'harbor'
      ? `/devops/v1/projects/${projectId}/apps/check_harbor?url=${url}&userName=${userName}&passWord=${password}&project=${project || null}&email=${email}`
      : `/devops/v1/projects/${projectId}/apps/check_chart?url=${url}`;
    return axios.get(requestAPI);
  }

  async checkRepoLink(projectId, data, type) {
    this.setTestLoading(true);
    try {
      const response = await this.checkRepoLinkRequest(projectId, data, type);
      const result = handleCheckerProptError(response);
      this.setTestResult(result ? TEST_PASS : TEST_FAILED);
      this.setTestLoading(false);
    } catch (e) {
      this.setTestLoading(false);
      Choerodon.handleResponseError(e);
    }
  }

  async queryConfigById(projectId, id) {
    try {
      const response = await axios.get(`/devops/v1/projects/${projectId}/project_config/${id}`);
      const result = handleProptError(response);
      if (result) {
        this.setConfig(result);
      }
    } catch (e) {
    }
  }

  checkName(projectId, name) {
    return axios.get(`/devops/v1/projects/${projectId}/project_config/check_name?name=${name}`);
  }

  deleteConfig(projectId, id) {
    return axios.delete(`/devops/v1/projects/${projectId}/project_config/${id}`);
  }
}

const elementsStore = new ElementsStore();
export default elementsStore;
