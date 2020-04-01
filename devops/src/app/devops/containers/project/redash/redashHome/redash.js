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
class Redash extends Component {
  @observable env = [];

  @observable cate = "dbconfig";

  constructor(props) {
    super(props);
  }

  getCate = (path) => {
      switch(true) {
        case path.endsWith("/dbconfig"):
          this.cate = "dbconfig"
          break;
        case path.endsWith("/query"):
          this.cate = "query"
          break;
        case path.endsWith("/report"):
          this.cate = "report"
          break;
      }
  }

  componentDidMount() {
    this.getCate(this.props.match.path);
    this.createLinkUrl();
  }

  createLinkUrl = () => {
    const { RedashStore } = this.props;
    const menu = AppState.currentMenuType;
    RedashStore.createLinkUrl(menu.id, menu.organizationId, this.cate);
  };

  render() {
    const { type, id: projectId, organizationId: orgId, name } = AppState.currentMenuType;
    const {
      RedashStore,  intl: { formatMessage },
    } = this.props;
    const {
      getLoading: loading,
      getUrl: url,
    } = RedashStore;

    console.log("url is " + url)

    return (
      <Page
        // service={[
        //   'x-devops-service.aliyun-sls.createSignInUrl',
        // ]}
        className="c7n-region"
      >
        <Header title={<FormattedMessage id="redash.task" />}>
        </Header>
        <Content>
          { loading ? (<LoadingBar display />):
            url ? (<iframe id="task" frameBorder={0} style={{width:'100%', height:'100%', overflow:'visible'}} src={url}/>):<Tooltip>没有配置redash</Tooltip>
          }
        </Content>
      </Page>
    );
  }
}

export default Form.create({})(withRouter(injectIntl(Redash)));