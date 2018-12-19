import React, { Component, Fragment } from 'react';
import { Table, Button, Input, Form, Modal, Tooltip, Select, Icon, Popover } from 'choerodon-ui';
import { observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { Content, Header, Page, Permission, stores } from 'choerodon-front-boot';
import _ from 'lodash';
import { injectIntl, FormattedMessage } from 'react-intl';
import { commonComponent } from '../../../../components/commonFunction';
import LoadingBar from '../../../../components/loadingBar';
import './WarningsHome.scss';
import '../../../main.scss';
import MouserOverWrapper from '../../../../components/MouseOverWrapper';
import DepPipelineEmpty from '../../../../components/DepPipelineEmpty/DepPipelineEmpty';
import DeploymentPipelineStore from '../../../../stores/project/deploymentPipeline';
import AppVersionStore from  '../../../../stores/project/applicationVersion';
import { getSelectTip } from '../../../../utils';

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

@commonComponent('WarningsStore')
@observer
class WarningsHome extends Component {

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

  getColumn = () => {
    const { WarningsStore, intl: { formatMessage } } = this.props;
    const { type, id: projectId, organizationId: orgId } = AppState.currentMenuType;
    const { filters, sort: { columnKey, order } } = WarningsStore.getInfo;
    return [{
      title: <FormattedMessage id="warnings.namespace" />,
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
      title: <FormattedMessage id="warnings.expression" />,
      dataIndex: 'code',
      key: 'code',
      sorter: true,
      sortOrder: columnKey === 'code' && order,
      filters: [],
      filteredValue: filters.code || [],
      render: text => (<MouserOverWrapper text={text} width={0.25}>
        {text}
      </MouserOverWrapper>),
    }, {
      title: <FormattedMessage id="warnings.status" />,
      dataIndex: 'active',
      key: 'active',
      filters: [{
        text: formatMessage({ id: 'app.stop' }),
        value: 0,
      }, {
        text: formatMessage({ id: 'app.run' }),
        value: 1,
      }, {
        text: formatMessage({ id: 'app.failed' }),
        value: -1,
      }, {
        text: formatMessage({ id: 'app.creating' }),
        value: 2,
      }],
      filteredValue: filters.active || [],
      render: this.getAppStatus,
    }, {
      align: 'right',
      width: 104,
      key: 'action',
      render: record => (
        <Fragment>
           <Fragment><Permission type={type} projectId={projectId} organizationId={orgId} service={['devops-service.application.update']}>
              <Tooltip placement="bottom" title={<div>{!record.synchro ? <FormattedMessage id="app.synch" /> : <Fragment>{record.active ? <FormattedMessage id="edit" /> : <FormattedMessage id="app.start" />}</Fragment>}</div>}>
                {record.active && record.synchro
                  ? <Button
                    icon="mode_edit"
                    shape="circle"
                    size="small"
                    onClick={this.showSideBar.bind(this, 'edit', record.id)}
                  />
                  : <Icon type="mode_edit" className="c7n-app-icon-disabled" /> }
              </Tooltip>
            </Permission>
             </Fragment>
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
   * 获取状态
   * @param text
   * @param record 表格中一个项目的记录
   * @returns {*}
   */
  getAppStatus = (text, record) => {
    const style = {
      fontSize: 18,
      marginRight: 6,
    };
    let icon = '';
    let msg = '';
    let color = '';
    if (record.fail) {
      icon = 'cancel';
      msg = 'failed';
      color = '#f44336';
    } else if (record.synchro && text) {
      icon = 'check_circle';
      msg = 'run';
      color = '#00bf96';
    } else if (text) {
      icon = 'timelapse';
      msg = 'creating';
      color = '#4d90fe';
    } else {
      icon = 'remove_circle';
      msg = 'stop';
      color = '#d3d3d3';
    }
    return (<span><Icon style={{ color, ...style }} type={icon} /><FormattedMessage id={`app.${msg}`} /></span>);
  };


  /**
   * 切换应用id
   * @param id 应用id
   * @param status 状态
   */
  changeAppStatus = (id, status) => {
    const { WarningsStore } = this.props;
    const { projectId } = this.state;
    WarningsStore.changeAppStatus(projectId, id, !status)
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
    const { WarningsStore } = this.props;
    const { projectId } = this.state;
    this.setState({ submitting: true });
    WarningsStore.deleteApps(projectId, id)
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
    const { WarningsStore } = this.props;
    const singleData = WarningsStore.singleData;
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
    const { WarningsStore } = this.props;
    const { projectId, id, type, page, copyFrom } = this.state;
    WarningsStore.setInfo({ filters: {}, sort: { columnKey: 'id', order: 'descend' }, paras: [] });
    if (type === 'create') {
      this.props.form.validateFieldsAndScroll((err, data) => {
        if (!err) {
          const postData = data;
          postData.projectId = projectId;
          this.setState({
            submitting: true,
          });
          WarningsStore.addData(projectId, postData)
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
    } else if (type === 'edit') {
      this.props.form.validateFieldsAndScroll((err, data, modify) => {
        if (!err && modify) {
          const formData = data;
          formData.id = id;
          this.setState({
            submitting: true,
          });
          WarningsStore.updateData(projectId, formData)
            .then((res) => {
              if (res) {
                this.loadAllData(this.state.page);
                this.setState({ show: false });
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
        } else if (!modify) {
          this.setState({ show: false });
        }
      });
    }
  };

  /**
   * 关闭操作框
   */
  hideSidebar = () => {
    const { WarningsStore } = this.props;
    WarningsStore.setSingleData(null);
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
    const { WarningsStore } = this.props;
    const { projectId } = this.state;
    if (type === 'create') {
      WarningsStore.setSingleData(null);
      WarningsStore.loadSelectData(projectId);
      this.setState({ show: true, type });
    } else {
      WarningsStore.loadDataById(projectId, id);
      this.setState({ show: true, type, id });
    }
  };


  render() {
    const { type, id: projectId, organizationId: orgId, name } = AppState.currentMenuType;
    const {
      WarningsStore: {
        singleData,
        selectData,
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
    const formContent = (<Form layout="vertical" className="c7n-sidebar-form">
      <FormItem
        {...formItemLayout}
      >
        {getFieldDecorator('name', {
          rules: [{
            required: true,
            whitespace: true,
            message: formatMessage({ id: 'required' }),
          }],
          initialValue: singleData ? singleData.name : '',
        })(
          <Input
            maxLength={20}
            label={<FormattedMessage id="warnings.namespace" />}
            size="default"
          />,
        )}
      </FormItem>
      <FormItem
        {...formItemLayout}
      >
        {getFieldDecorator('code', {
          rules: [{
            required: true,
            whitespace: true,
            max: 47,
            message: formatMessage({ id: 'required' }),
          }],
          initialValue: singleData ? singleData.code : '',
        })(
          <Input
            maxLength={30}
            label={<FormattedMessage id="warnings.expression" />}
            size="default"
          />,
        )}
      </FormItem>

      <FormItem
        {...formItemLayout}
      >
        {getFieldDecorator('code', {
          rules: [{
            required: true,
            whitespace: true,
            max: 47,
            message: formatMessage({ id: 'required' }),
          }],
          initialValue: singleData ? singleData.code : '',
        })(
          <Input
            maxLength={30}
            label={<FormattedMessage id="warnings.version" />}
            size="default"
          />,
        )}
      </FormItem>

      <FormItem
        {...formItemLayout}
      >
        {getFieldDecorator('code', {
          rules: [{
            required: true,
            whitespace: true,
            max: 47,
            message: formatMessage({ id: 'required' }),
          }],
          initialValue: singleData ? singleData.code : '',
        })(
          <Input
            maxLength={30}
            label={<FormattedMessage id="warnings.uid" />}
            size="default"
          />,
        )}
      </FormItem>

      <FormItem
        {...formItemLayout}
      >
        {getFieldDecorator('code', {
          rules: [{
            required: true,
            whitespace: true,
            max: 47,
            message: formatMessage({ id: 'required' }),
          }],
          initialValue: singleData ? singleData.code : '',
        })(
          <Input
            maxLength={30}
            label={<FormattedMessage id="warnings.channelId" />}
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
          <Header title={<FormattedMessage id="warnings.head" />}>
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
                <FormattedMessage id="warnings.create" />
              </Button>
            </Permission>
            <Button
              icon="refresh"
              onClick={this.handleRefresh}
            >
              <FormattedMessage id="refresh" />
            </Button>
          </Header>
          <Content code="warnings" values={{ name }}>
            {show && <Sidebar
              title={<FormattedMessage id={modeType === 'create' ? 'warnings.create' : 'warnings.edit'} />}
              visible={show}
              onOk={this.handleSubmit}
              okText={<FormattedMessage id={modeType === 'create' ? 'create' : 'save'} />}
              cancelText={<FormattedMessage id="cancel" />}
              confirmLoading={submitting}
              onCancel={this.hideSidebar}
              className="c7n-create-sidebar-tooltip"
            >
              <Content code={`warnings.${modeType}`} values={{ name }} className="sidebar-content">
                {formContent}
              </Content>
            </Sidebar>}
            <Table
              filterBarPlaceholder={formatMessage({ id: 'filter' })}
              pagination={getPageInfo}
              loading={loading}
              onChange={this.tableChange}
              columns={this.getColumn()}
              dataSource={serviceData}
              rowKey={record => record.id}
              filters={paras.slice()}
            />
          </Content>
        </Fragment> : <DepPipelineEmpty title={<FormattedMessage id="warnings.head" />} type="warnings" />)}
        <Modal
          confirmLoading={submitting}
          visible={openRemove}
          title={`${formatMessage({ id: 'warnings.delete' })}“${appName}”`}
          closable={false}
          footer={[
            <Button key="back" onClick={this.closeRemove} disabled={submitting}>{<FormattedMessage id="cancel" />}</Button>,
            <Button key="submit" type="danger" onClick={this.deleteApp.bind(this, id)} loading={submitting}>
              {formatMessage({ id: 'delete' })}
            </Button>,
          ]}
        >
          <p>{formatMessage({ id: 'warnings.delete.tooltip' })}</p>
        </Modal>
      </Page>
    );
  }
}

export default Form.create({})(withRouter(injectIntl(WarningsHome)));
