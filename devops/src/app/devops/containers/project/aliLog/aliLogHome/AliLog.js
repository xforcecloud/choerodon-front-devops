import React, { Component } from 'react';
import { Button, Form, Select, Tooltip } from 'choerodon-ui';
import { observer } from 'mobx-react';
import { observable, action, configure } from 'mobx';
import { withRouter } from 'react-router-dom';
import { Content, Header, Page, Permission, stores } from 'choerodon-front-boot';
import _ from 'lodash';
import { injectIntl, FormattedMessage } from 'react-intl';
import LoadingBar from '../../../../components/loadingBar/index';
import './AliLog.scss';
import '../../envPipeline/EnvPipeLineHome.scss';
import '../../../main.scss';
import '../../../../components/DepPipelineEmpty/DepPipelineEmpty.scss';

const HEIGHT = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;

const { AppState } = stores;

const { Option } = Select;

@observer
class AliLog extends Component {
  @observable env = [];

  constructor(props) {
    super(props);
  }

  componentDidMount() {
    this.loadEnvCards();
  }

  handleRefresh = () => {
    this.createSignInUrl();
  };

  createSignInUrl = () => {
    const { AliLogStore } = this.props;
    const menu = AppState.currentMenuType;
    const envId = AliLogStore.getTpEnvId;
    if(envId) {
      AliLogStore.createSignInUrl(menu.id, envId);
    } else {
      AliLogStore.setSignInUrl("");
    }
  };

  /**
   * 环境选择请求函数
   * @param value
   */
  @action
  handleEnvSelect = (value) => {
    const { AliLogStore } = this.props;
    AliLogStore.setTpEnvId(value);
    this.createSignInUrl();
  };

  /**
   * 获取可用环境
   */
  @action
  loadEnvCards = () => {
    const { AliLogStore } = this.props;
    const projectId = AppState.currentMenuType.id;
    AliLogStore.loadActiveEnv(projectId)
      .then((env) => {
        if (env.length) {
          this.env = env;
        }
      });
  };

  render() {
    const { type, id: projectId, organizationId: orgId, name } = AppState.currentMenuType;
    const {
      AliLogStore,  intl: { formatMessage },
    } = this.props;
    const {
      getLoading: loading,
      getSignInUrl: signInUrl,
    } = AliLogStore;

    const envId = AliLogStore.getTpEnvId;
    const envData = AliLogStore.getEnvcard;

    return (
      <Page
        service={[
          'x-devops-service.aliyun-sls.createSignInUrl',
        ]}
        className="c7n-region"
      >
        <Header title={<FormattedMessage id="ali-log.head" />}>
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
            signInUrl ? (<iframe id="logsearch" frameBorder={0} style={{width:'100%', height:'100%', overflow:'visible'}} src={signInUrl}/>):<Tooltip>找不到日志</Tooltip>
          }
        </Content>
      </Page>
    );
  }
}

export default Form.create({})(withRouter(injectIntl(AliLog)));
