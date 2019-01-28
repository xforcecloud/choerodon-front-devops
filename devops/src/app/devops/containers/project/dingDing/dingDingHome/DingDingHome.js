import React, { Component, Fragment } from 'react';
import { Table, Button, Input, Form, Modal, Tooltip, Select, Icon, Popover } from 'choerodon-ui';
import { observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { Content, Header, Page, Permission, stores } from 'choerodon-front-boot';
import _ from 'lodash';
import { injectIntl, FormattedMessage } from 'react-intl';
import { commonComponent } from '../../../../components/commonFunction';
import LoadingBar from '../../../../components/loadingBar';
import './DingDingHome.scss';
import '../../../main.scss';
import MouserOverWrapper from '../../../../components/MouseOverWrapper';
import DepPipelineEmpty from '../../../../components/DepPipelineEmpty/DepPipelineEmpty';
import DeploymentPipelineStore from '../../../../stores/project/deploymentPipeline';
import AppVersionStore from  '../../../../stores/project/applicationVersion';
import { getSelectTip } from '../../../../utils';
import dingDingStore from "../../../../stores/project/dingDing/DingDingStore";

const { AppState } = stores;
const { Sidebar } = Modal;
const { Option } = Select;
const FormItem = Form.Item;
const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 100 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 26 },
  },
};

@commonComponent('DingDingStore')
@observer
class DingDingHome extends Component {

  constructor(props) {
    const menu = AppState.currentMenuType;
    const { location: { state } } = props.history;
    super(props);
    this.state = {
      page: 0,
      id: '',
      projectId: menu.id,
      show: state && state.show,
      type: state && state.modeType,
      submitting: false,
      openRemove:state && state.openRemove,
    };
  }

  componentDidMount() {
    const { projectId } = AppState.currentMenuType;
    AppVersionStore.queryAppData(projectId);
    this.loadAllData(this.state.page);
  }

  /**
   * 处理刷新函数
   */
  handleRefresh1 = () => {
    const { projectId } = AppState.currentMenuType;
    AppVersionStore.queryAppData(projectId);
    this.loadAllData(this.state.page);
  };

  getColumn = () => {
    const { DingDingStore, intl: { formatMessage } } = this.props;
    const { type, id: projectId, organizationId: orgId } = AppState.currentMenuType;
    const { filters, sort: { columnKey, order } } = DingDingStore.getInfo;
    return [{
      title: <FormattedMessage id="dingDing.name" />,
      dataIndex: 'name',
      key: 'name',
      sorter: true,
      sortOrder: columnKey === 'name' && order,
      filters: [],
      filteredValue: filters.name || [],
      render: text => (<MouserOverWrapper text={text} width={0.2}>
        {text}
      </MouserOverWrapper>),
    }, {
      title: <FormattedMessage id="dingDing.token" />,
      dataIndex: 'token',
      key: 'token',
      sorter: true,
      sortOrder: columnKey === 'token' && order,
      filters: [],
      filteredValue: filters.token || [],
      render: text => (<MouserOverWrapper text={text} width={0.25}>
        {text}
      </MouserOverWrapper>),
    }, {
      align: 'right',
      width: 104,
      key: 'action',
      render: record => (
        <Fragment>
          <Permission type={type} projectId={projectId} organizationId={orgId} service={['devops-service.application.deleteByAppId']}>
            <Tooltip
              placement="bottom"
              title={<FormattedMessage id="delete" />}
            >
              <Button
                icon="delete_forever"
                shape="circle"
                size="small"
                onClick={this.openRemove.bind(this, record.id, record.name)}
              />
            </Tooltip>
          </Permission>
        </Fragment>
      ),
    }];
  };


  /**
   * 切换应用id
   * @param id 应用id
   * @param status 状态
   */
  changeAppStatus = (id, status) => {
    const { DingDingStore } = this.props;
    const { projectId } = this.state;
    DingDingStore.changeAppStatus(projectId, id, !status)
      .then((data) => {
        if (data) {
          this.loadAllData(this.state.page);
        }
      });
  };

  /**
   * 删除应用
   * @param id
   */
  deleteApp = (id) => {
    const { DingDingStore } = this.props;
    const { projectId } = this.state;
    this.setState({ submitting: true });
    const dingDing = {
      "id": id,
      "name": "string",
      "scopeid": 0,
      "token": "string"
    }
    DingDingStore.deleteApps(projectId, dingDing)
      .then(() => {
        this.loadAllData(this.state.page);
        this.setState({
          submitting: false,
          openRemove: false,
        });
      });
  };

  /**
   * 校验应用的唯一性
   * @param rule
   * @param value
   * @param callback
   */
  checkName = (rule, value, callback) => {
    const { DingDingStore } = this.props;
    const singleData = DingDingStore.singleData;
    if ((singleData && value !== singleData.name) || !singleData) {
      this.postName(this.state.projectId, value, callback);
    } else {
      callback();
    }
  };

  /**
   * 提交数据
   * @param e
   */
  handleSubmit = (e) => {
    e.preventDefault();
    const { DingDingStore } = this.props;
    const { projectId, id, type, page, copyFrom } = this.state;
    DingDingStore.setInfo({ filters: {}, sort: { columnKey: 'id', order: 'descend' }, paras: [] });
    if (type === 'create') {
      this.props.form.validateFieldsAndScroll((err, data) => {
        if (!err) {
          const postData = data;
          postData.scopeid = projectId;
          this.setState({
            submitting: true,
          });
          DingDingStore.addData(projectId, postData)
            .then((res) => {
              if (res) {
                this.loadAllData(page);
                this.setState({ type: false, show: false });
              }
              this.setState({
                submitting: false,
              });
            }).catch((error) => {
            Choerodon.prompt(error.response.data.message);
            this.setState({
              submitting: false,
            });
          });
        }
      });
    }
  };

  /**
   * 关闭操作框
   */
  hideSidebar = () => {
    const { DingDingStore } = this.props;
    DingDingStore.setSingleData(null);
    this.setState({ show: false });
    this.props.form.resetFields();
  };

  /**
   * 打开操作面板
   * @param type 操作类型
   * @param id 操作应用
   */
  showSideBar =(type, id = '') => {
    this.props.form.resetFields();
    const { DingDingStore } = this.props;
    const { projectId } = this.state;
    if (type === 'create') {
      DingDingStore.setSingleData(null);
      DingDingStore.loadSelectData(projectId);
      this.setState({ show: true, type });
    } else {
      DingDingStore.loadDataById(projectId, id);
      this.setState({ show: true, type, id });
    }
  };


  render() {
    const { type, id: projectId, organizationId: orgId, name } = AppState.currentMenuType;
    const {
      DingDingStore: {
        getAllData: serviceData,
        getInfo: { paras },
        isRefresh,
        loading,
        getPageInfo,
      },
      intl: { formatMessage },
      form: { getFieldDecorator },
    } = this.props;
    const { type: modeType, show, submitting, openRemove, name: appName, id } = this.state;
    const { app } = DeploymentPipelineStore.getProRole;
    const appData = AppVersionStore.getAppData;
    const initScopeId = projectId;
    const formContent = (<Form layout="vertical" className="c7n-sidebar-form">
      <FormItem
        {...formItemLayout}
      >
        {getFieldDecorator('token', {
          rules: [{
            required: true,
            whitespace: true,
            message: formatMessage({ id: 'required' }),
          }]
        })(
          <Input
            maxLength={20}
            label={<FormattedMessage id="dingDing.token" />}
            size="default"
          />,
        )}
      </FormItem>
      <FormItem
        {...formItemLayout}
      >
        {getFieldDecorator('name', {
          rules: [{
            required: true,
            whitespace: true,
            max: 47,
            message: formatMessage({ id: 'required' }),
          }]
        })(
          <Input
            maxLength={30}
            label={<FormattedMessage id="dingDing.name" />}
            size="default"
          />,
        )}
      </FormItem>
    </Form>);

    return (
      <Page
        className="c7n-region c7n-app-wrapper"
        service={[
          'devops-service.application.create',
          'devops-service.application.update',
          'devops-service.application.checkCode',
          'devops-service.application.checkName',
          'devops-service.application.pageByOptions',
          'devops-service.application.listTemplate',
          'devops-service.application.queryByAppIdAndActive',
          'devops-service.application.queryByAppId',
        ]}
      >
        { isRefresh ? <LoadingBar display /> : ((appData && appData.length) || app === 'owner' ? <Fragment>
          <Header title={<FormattedMessage id="dingDing.head" />}>
            <Permission
              service={['devops-service.application.create']}
              type={type}
              projectId={projectId}
              organizationId={orgId}
            >
              <Button
                icon="playlist_add"
                onClick={this.showSideBar.bind(this, 'create')}
              >
                <FormattedMessage id="dingDing.create" />
              </Button>
            </Permission>
            <Button
              icon="refresh"
              onClick={this.handleRefresh}
            >
              <FormattedMessage id="refresh" />
            </Button>
          </Header>
          <Content code="dingDing" values={{ name }}>
            {show && <Sidebar
              title={<FormattedMessage id={modeType === 'create' ? 'dingDing.create' : 'dingDing.edit'} />}
              visible={show}
              onOk={this.handleSubmit}
              okText={<FormattedMessage id={modeType === 'create' ? 'create' : 'save'} />}
              cancelText={<FormattedMessage id="cancel" />}
              confirmLoading={submitting}
              onCancel={this.hideSidebar}
              className="c7n-create-sidebar-tooltip"
            >
              <Content code={`dingDing.${modeType}`} values={{ name }} className="sidebar-content">
                {formContent}
              </Content>
            </Sidebar>}
            <Table
              filterBarPlaceholder={formatMessage({ id: 'filter' })}
              loading={loading}
              onChange={this.tableChange}
              columns={this.getColumn()}
              dataSource={serviceData.slice()}
              rowKey={record => record.id}
              filters={paras.slice()}
            />
          </Content>
        </Fragment> : <DepPipelineEmpty title={<FormattedMessage id="dingDing.head" />} type="dingDing" />)}
        <Modal
          confirmLoading={submitting}
          visible={openRemove}
          title={`${formatMessage({ id: 'dingDing.delete' })}“${appName}”`}
          closable={false}
          footer={[
            <Button key="back" onClick={this.closeRemove} disabled={submitting}>{<FormattedMessage id="cancel" />}</Button>,
            <Button key="submit" type="danger" onClick={this.deleteApp.bind(this, id)} loading={submitting}>
              {formatMessage({ id: 'delete' })}
            </Button>,
          ]}
        >
          <p>{formatMessage({ id: 'dingDing.delete.tooltip' })}</p>
        </Modal>
      </Page>
    );
  }
}

export default Form.create({})(withRouter(injectIntl(DingDingHome)));
