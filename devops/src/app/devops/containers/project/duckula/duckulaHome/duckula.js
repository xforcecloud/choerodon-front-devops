import React, { Component } from 'react';
import { Button, Form, Select, Tooltip } from 'choerodon-ui';
import { observer } from 'mobx-react';
import { observable, action, configure } from 'mobx';
import { withRouter } from 'react-router-dom';
import { Content, Header, Page, Permission, stores } from 'choerodon-front-boot';
import _ from 'lodash';
import { injectIntl, FormattedMessage } from 'react-intl';
import LoadingBar from '../../../../components/loadingBar/index';
import './duckula.scss';
import '../../envPipeline/EnvPipeLineHome.scss';
import '../../../main.scss';
import '../../../../components/DepPipelineEmpty/DepPipelineEmpty.scss';

const HEIGHT = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;

const { AppState } = stores;

const { Option } = Select;

@observer
class Duckula extends Component {
  @observable env = [];

  @observable cate = "task";

  constructor(props) {
    super(props);
  }

  getCate = (path) => {
      switch(true) {
        case path.endsWith("/ops"):
          this.cate = "ops"
          break;
        case path.endsWith("/consumer"):
          this.cate = "consumer"
          break;
        case path.endsWith("/import"):
          this.cate = "import"
          break;
        case path.endsWith("/index"):
          this.cate = "index"
          break;
        case path.endsWith("/stats"):
          this.cate = "stats"
          break;            
        case path.endsWith("/task"):
          this.cate = "task"
          break;
        defaut:
          cate = "task"
      }
  }

  componentDidMount() {
    this.getCate(this.props.match.path)
    this.loadEnvCards();
  }

  handleRefresh = () => {
    this.createLinkUrl();
  };

  createLinkUrl = () => {
    const { DuckulaStore } = this.props;
    const menu = AppState.currentMenuType;
    const envId = DuckulaStore.getTpEnvId;
    if(envId) {
     
      //DuckulaStore.defaultUrl();
      console.log("url is after" + DuckulaStore.getUrl);
      DuckulaStore.createLinkUrl(menu.id, envId, this.cate, DuckulaStore.getTpEnvCode);
    } else {
      DuckulaStore.setUrl("");
    }
  };

  /**
   * 环境选择请求函数
   * @param value
   */
  @action
  handleEnvSelect = (value, option) => {
    const { DuckulaStore } = this.props;
    DuckulaStore.setTpEnvId(value);
    const projectId = AppState.currentMenuType.id;
    DuckulaStore.loadActiveEnv(projectId, this.cate)
    .then(data => {
      console.log(data)
      let tmp = _.filter(data, ['id', value])
      if(tmp.length){
        DuckulaStore.setTpEnvCode(tmp[0].code)
        DuckulaStore.createLinkUrl(projectId, tmp[0].id, this.cate, tmp[0].code);
      }
    })
  };

  /**
   * 获取可用环境
   */
  @action
  loadEnvCards = () => {
    const { DuckulaStore } = this.props;
    const projectId = AppState.currentMenuType.id;
    DuckulaStore.loadActiveEnv(projectId, this.cate)
      .then((env) => {
        if (env.length) {
          this.env = env;
          if(env && env[0].id){
            DuckulaStore.createLinkUrl(projectId, env[0].id, this.cate, env[0].code);
          }
        }
      });
  };

  render() {
    const { type, id: projectId, organizationId: orgId, name } = AppState.currentMenuType;
    const {
      DuckulaStore,  intl: { formatMessage },
    } = this.props;
    const {
      getLoading: loading,
      getUrl: url,
    } = DuckulaStore;

    console.log("url is " + url)

    const envId = DuckulaStore.getTpEnvId;
    const envData = DuckulaStore.getEnvcard;

    return (
      <Page
        service={[
          'x-devops-service.aliyun-sls.createSignInUrl',
        ]}
        className="c7n-region"
      >
        <Header title={<FormattedMessage id="duckula.task" />}>
          <Select
            className={`${envId? 'c7n-header-select' : 'c7n-header-select c7n-select_min100'}`}
            dropdownClassName="c7n-header-env_drop"
            placeholder={formatMessage({ id: 'envoverview.noEnv' })}
            value={envData && envData.length ? envId : undefined}
            disabled={envData && envData.length === 0}
            onChange={this.handleEnvSelect}
          >
            {_.map(envData,  e => (
              <Option key={e.id} value={e.id} disabled={!e.permission} title={e.name}>
                <Tooltip placement="right" title={e.name}>
                    <span className="c7n-ib-width_100">
                      {e.connect ? <span className="c7n-ist-status_on" /> : <span className="c7n-ist-status_off" />}
                      {e.name}
                    </span>
                </Tooltip>
              </Option>))}
          </Select>
          <Permission
            service={['x-devops-service.aliyun-sls.createSignInUrl']}
            type={type}
            organizationId={orgId}
            projectId={projectId}
          >
            <Button
              icon="refresh"
              funcType="flat"
              onClick={this.handleRefresh}
            >
              <FormattedMessage id="refresh" />
            </Button>
          </Permission>
        </Header>
        <Content>
          { loading ? (<LoadingBar display />):
            url ? (<iframe id="task" frameBorder={0} style={{width:'100%', height:'100%', overflow:'visible'}} src={url}/>):<Tooltip>没有配置duckula</Tooltip>
          }
        </Content>
      </Page>
    );
  }
}

export default Form.create({})(withRouter(injectIntl(Duckula)));