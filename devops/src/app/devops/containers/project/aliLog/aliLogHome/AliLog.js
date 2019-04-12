import React, { Component } from 'react';
import { Button, Form } from 'choerodon-ui';
import { observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { Content, Header, Page, Permission, stores } from 'choerodon-front-boot';
import { injectIntl, FormattedMessage } from 'react-intl';
import LoadingBar from '../../../../components/loadingBar/index';
import './AliLog.scss';
import '../../envPipeline/EnvPipeLineHome.scss';
import '../../../main.scss';
import '../../../../components/DepPipelineEmpty/DepPipelineEmpty.scss';

const HEIGHT = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;

const { AppState } = stores;

@observer
class AliLog extends Component {
  constructor(props) {
    super(props);
    const menu = AppState.currentMenuType;
    this.state = {
      projectId: menu.id
    };
  }

  componentDidMount() {
    this.createSignInUrl();
  }

  handleRefresh = () => {
    this.createSignInUrl();
  };

  createSignInUrl = () => {
    const { AliLogStore } = this.props;
    const menu = AppState.currentMenuType;
    AliLogStore.createSignInUrl(menu.id);
  };

  render() {
    const { type, id: projectId, organizationId: orgId, name } = AppState.currentMenuType;
    const {
      AliLogStore
    } = this.props;
    const {
      getLoading: loading,
      getSignInUrl: signInUrl
    } = AliLogStore;
    return (
      <Page
        service={[
          'x-devops-service.aliyun-sls.createSignInUrl'
        ]}
        className="c7n-region"
      >
        <Header title={<FormattedMessage id="ali-log.head" />}>
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
        <Content code="ali-log" values={{ name }}>
          { loading ? <LoadingBar display />:
            (<iframe id="logsearch" frameBorder={0} style={{width:'100%', height:'80%', overflow:'visible'}} src={signInUrl}/>)
          }
        </Content>
      </Page>
    );
  }
}

export default Form.create({})(withRouter(injectIntl(AliLog)));
