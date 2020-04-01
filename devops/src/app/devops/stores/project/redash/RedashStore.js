import { observable, action, computed } from 'mobx';
import { axios, store, stores } from 'choerodon-front-boot';
import _ from 'lodash';
import { handleProptError } from '../../../utils/index';


const { AppState } = stores;

const HEIGHT = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;

@store('RedashStore')
class RedashStore {

  @observable loading = false;

  @observable tLoading = false;

  @observable url = "";

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

  @action setPreProId(id) {
    this.preProId = id;
  }

  createLinkUrl = (projectId, orgId, cate) => {

    if(cate == "dbconfig"){
      this.setUrl("http://redash-paas.phoenix-t.xforceplus.com/db_config");
    } else if (cate == "query"){
      this.setUrl("http://redash-paas.phoenix-t.xforceplus.com/redash/dashboards");
    } else if (cate == "report") {
      this.setUrl("http://redash-paas.phoenix-t.xforceplus.com/redash/queries");
    }
  }
}

const redashStore = new RedashStore();
export default redashStore;
