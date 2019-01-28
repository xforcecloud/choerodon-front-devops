import React, { Component, Fragment } from 'react';
import { Table, Button, Input, Form, Modal, Tooltip, Select, Icon, Popover,Switch ,Radio } from 'choerodon-ui';
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
const RadioGroup = Radio.Group;
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
  postName =_.debounce((projectId, value, callback) => {
    const { WarningsStore, intl } = this.props;
    WarningsStore.checkName(projectId, value)
      .then((data) => {
        if (data) {
          callback();
        } else {
          callback(intl.formatMessage({ id: 'template.checkName' }));
        }
      });
  }, 600);

  /**
   * 校验应用编码规则
   * @param rule
   * @param value
   * @param callback
   */
  checkCode =_.debounce((rule, value, callback) => {
    const { WarningsStore, intl: { formatMessage } } = this.props;
    const pa = /^[a-z]([-a-z0-9]*[a-z0-9])?$/;
    if (value && pa.test(value)) {
      WarningsStore.checkCode(this.state.projectId, value)
        .then((data) => {
          if (data) {
            callback();
          } else {
            callback(formatMessage({ id: 'template.checkCode' }));
          }
        });
    } else {
      callback(formatMessage({ id: 'template.checkCodeReg' }));
    }
  }, 600);

  constructor(props) {
    const menu = AppState.currentMenuType;
    const { location: { state } } = props.history;
    super(props);
    this.state = {
      page: 0,
      id: '',
      projectId: menu.id,
      orgId: AppState.currentMenuType.organizationId,
      show: state && state.show,
      type: state && state.modeType,
      submitting: false,
    };
  }

  componentDidMount() {
    const { projectId } = AppState.currentMenuType;
    AppVersionStore.queryAppData(projectId);
    this.loadAllData(this.state.orgId,this.state.page);
  }

  getColumn = () => {
    const { WarningsStore, intl: { formatMessage } } = this.props;
    const { type, id: projectId, organizationId: orgId } = AppState.currentMenuType;
    const { filters, sort: { columnKey, order } } = WarningsStore.getInfo;
    return [{
      title: <FormattedMessage id="warnings.namespace" />,
      dataIndex: 'namespace',
      key: 'namespace',
      sorter: true,
      sortOrder: columnKey === 'namespace' && order,
      filters: [],
      filteredValue: filters.namespace || [],
      render: text => (<MouserOverWrapper text={text} width={0.2}>
        {text}
      </MouserOverWrapper>),
    }, {
      title: <FormattedMessage id="warnings.expression" />,
      dataIndex: 'expression',
      key: 'expression',
      sorter: true,
      sortOrder: columnKey === 'expression' && order,
      filters: [],
      filteredValue: filters.expression || [],
    }, {
      title: <FormattedMessage id="warnings.version" />,
      dataIndex: 'version',
      key: 'version',
      sorter: true,
      sortOrder: columnKey === 'version' && order,
      filters: [],
      filteredValue: filters.version || [],
      render: text => (<MouserOverWrapper text={text} width={0.25}>
        {text}
      </MouserOverWrapper>),
    },{
      title: <FormattedMessage id="warnings.type" />,
      dataIndex: 'status',
      key: 'status',
      filters: [{
        text: formatMessage({ id: 'warnings.stop' }),
        value: 0,
      }, {
        text: formatMessage({ id: 'warnings.run' }),
        value: 1,
      }],
      filteredValue: filters.status || [],
      render: this.getAppStatus,
    }, {
      align: 'right',
      width: 104,
      key: 'action',
      render: record => (
        <Fragment>
          <Fragment><Permission type={type} projectId={projectId} organizationId={orgId} service={['devops-service.application.update']}>
              <Tooltip placement="bottom" title={<FormattedMessage id="edit" />}>
                <Button
                    icon="mode_edit"
                    shape="circle"
                    size="small"
                    onClick={this.showSideBar.bind(this, 'edit', record,record.id)}
                  />
              </Tooltip>
            </Permission>
              <Permission type={type} projectId={projectId} organizationId={orgId} service={['devops-service.application.queryByAppIdAndActive']}>
                <Tooltip
                  placement="bottom"
                  title={<Fragment>{record.status ? <FormattedMessage id="warnings.stop" /> : <FormattedMessage id="warnings.run" />}</Fragment>}
                >
                   <Button shape="circle" size="small" onClick={this.changeStatus.bind(this, record)}>
                      {record.status
                        ? <Icon type="remove_circle_outline" />
                        : <Icon type="finished" />}
                    </Button>
                </Tooltip>
              </Permission></Fragment>
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
    if (text) {
      icon = 'check_circle';
      msg = 'run';
      color = '#00bf96';
    } else {
      icon = 'remove_circle';
      msg = 'stop';
      color = '#f44336';
    }
    return (<span><Icon style={{ color, ...style }} type={icon} /><FormattedMessage id={`warnings.${msg}`} /></span>);
  };

  /**
   * 改变配置状态
   */
  changeStatus = (record) => {
    const { WarningsStore } = this.props;
    const { projectId, id, type, page, copyFrom } = this.state;
    WarningsStore.setInfo({ filters: {}, sort: { columnKey: 'id', order: 'descend' }, paras: [] });
    record.channelId = record.channelid;
    record.orgId = record.orgid;
    record.scopeId = record.scopeid;
    record.id = id;
    record.uniqueName = record.uid;
    if(record.status === 0){
      record.type = 1;
    }else if(record.status === 1){
      record.type = 0;
    }
        this.setState({
          submitting: true,
        });
        WarningsStore.updateData(projectId, record)
          .then((res) => {
            if (res) {
              this.loadAllData(this.state.orgId,this.state.page);
              this.setState({ show: false });
            }
            this.setState({
              submitting: false,
            });
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
        this.loadAllData(this.state.orgId,this.state.page);
        this.setState({
          submitting: false,
          openRemove: false,
        });
      });
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
          if(data.type){
           data.type = 1;
          }else{
           data.type = 0;
          }
          data.uniqueName = data.uniqueName + "-" + (((1+Math.random())*0x10000)|0).toString(16).substring(1);
          const postData = data;
          //postData.projectId = projectId;
          this.setState({
            submitting: true,
          });
          WarningsStore.addData(projectId, postData)
            .then((res) => {
              if (res) {
                this.loadAllData(this.state.orgId,page);
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
                this.loadAllData(this.state.orgId,this.state.page);
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
   * 处理刷新函数
   */
  handleRefresh1 = () => {
    const { projectId } = AppState.currentMenuType;
    AppVersionStore.queryAppData(projectId);
    this.loadAllData(this.state.orgId,this.state.page);
  };

  /**
   * table 操作
   * @param pagination
   * @param filters
   * @param sorter
   * @param paras
   */
  tableChange1 = (pagination, filters, sorter, paras) => {
    const { WarningsStore } = this.props;
    const { id } = AppState.currentMenuType;
    WarningsStore.setInfo({ filters, sort: sorter, paras });
    const sort = { field: "", order: "desc" };
    if (sorter.column) {
      sort.field = sorter.field || sorter.columnKey;
      if (sorter.order === "ascend") {
        sort.order = "asc";
      } else if (sorter.order === "descend") {
        sort.order = "desc";
      }
    }
    let searchParam = {};
    const page = pagination.current - 1;
    if (Object.keys(filters).length) {
      searchParam = filters;
    }
    const postData = {
      searchParam,
      param: paras.toString(),
    };
    const organizationId = AppState.currentMenuType.organizationId;
    WarningsStore.loadData(
      false,
      id,
      organizationId,
      page,
      pagination.pageSize,
      sort,
      postData
    );
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
  showSideBar =(type, record = {},id = "") => {
    this.props.form.resetFields();
    const { WarningsStore } = this.props;
    const { projectId } = this.state;
    if (type === 'create') {
      const record = {};
      WarningsStore.loadSelectNamespaceData(projectId);
      WarningsStore.loadSelectDingDingData(projectId);
      this.setState({ show: true, type ,record});
    } else {
      WarningsStore.loadSelectNamespaceData(projectId);
      WarningsStore.loadSelectDingDingData(projectId)
      this.setState({ show: true, type, id,record });
    }
  };

  selectNamespace =(value, option) => {
    this.setState({ copyFrom: option.key });
  };

  selectDingDing =(value, option) => {
    this.setState({ copyFrom: option.key });
  };



  render() {
    const { type, id: projectId, organizationId: orgId, name } = AppState.currentMenuType;
    const {
      WarningsStore: {
        singleData,
        selectData,
        selectNamespaceData,
        selectDingDingData,
        getAllData: serviceData,
        getInfo: { paras },
        isRefresh,
        loading,
        getPageInfo,
      },
      intl: { formatMessage },
      form: { getFieldDecorator },
    } = this.props;
    const { intl } = this.props
    const { type: modeType, show, submitting, openRemove, name: appName, id,record} = this.state;
    const { app } = DeploymentPipelineStore.getProRole;
    const appData = AppVersionStore.getAppData;
    const formContent = (<Form layout="vertical" className="c7n-sidebar-form">
      <div className="c7ncd-sidebar-select">
        <FormItem
          {...formItemLayout}
        >
          {getFieldDecorator('namespace', {
            rules: [{
              message: formatMessage({ id: 'required' }),
              transform: (value) => {
                if (value) {
                  return value.toString();
                }
                return value;
              },
            }],
            initialValue:record?record.namespace:"",
          })(<Select
              key="service"
              allowClear
              label={<FormattedMessage id="warnings.chooseTem" />}
              filter
              dropdownMatchSelectWidth
              onSelect={this.selectNamespace}
              size="default"
              optionFilterProp="children"
              filterOption={
                (input, option) => option.props.children.props.children.props.children
                  .toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {selectNamespaceData && selectNamespaceData.length > 0 && selectNamespaceData.map(s => (
                <Option
                  value={s.code}
                  key={s.code}
                >
                  <Tooltip
                    placement="right"
                    trigger="hover"
                    title={<p>{s.code}</p>}
                  >
                    <span style={{ display: 'inline-block', width: '100%' }}>{s.name}</span>
                  </Tooltip>
                </Option>
              ))}
            </Select>
          )}
        </FormItem>
        {getSelectTip('warnings.chooseTem.tip')}
      </div>
      <FormItem style={{display:'none'}}
        {...formItemLayout}
      >
        {getFieldDecorator('orgId', {
          initialValue:orgId,
        })(
          <Input
            maxLength={30}
            label={<FormattedMessage id="warnings.orgId" />}
            size="default"
          />,
        )}
      </FormItem>

      <FormItem style={{display:'none'}}
        {...formItemLayout}
      >
        {getFieldDecorator('scopeId', {
          initialValue:projectId,
        })(
          <Input
            maxLength={10}
            label={<FormattedMessage id="warnings.projectId" />}
            size="default"
          />,
        )}
      </FormItem>

      {modeType === 'create' && <FormItem
        {...formItemLayout}
      >
        {getFieldDecorator('uniqueName', {
          rules: [{
            required: true,
            whitespace: true,
            max: 47,
          }],
          initialValue: record ? record.uid : '',
        })(
          <Input
            maxLength={30}
            label={<FormattedMessage id="warnings.uniqueName" />}
            size="default"
          />,
        )}
      </FormItem>}
      {modeType === 'edit' && <FormItem
        {...formItemLayout}
      >
        {getFieldDecorator('uniqueName', {
          rules: [{
            required: true,
            whitespace: true,
            max: 47,
          }],
          initialValue: record ? record.uid : '',
        })(
          <Input
            disabled={true}
            maxLength={30}
            label={<FormattedMessage id="warnings.uniqueName" />}
            size="default"
          />,
        )}
      </FormItem>}
      <FormItem
        {...formItemLayout}
      >
        {getFieldDecorator('expression', {
          rules: [{
            required: true,
            whitespace: true,
            message: formatMessage({ id: 'required' }),
          },{
            pattern: /^(\w+)\[(\S+)\]/,
            message: intl.formatMessage({ id: `warnings.checkExpression` }),
          }],
          initialValue: record ? record.expression : '',
        })(
          <Input
            maxLength={100}
            label={<FormattedMessage id="warnings.expression" />}
            size="default"
          />,
        )}
      </FormItem>

     <div className="c7ncd-sidebar-select">
        <FormItem
          {...formItemLayout}
        >
          {getFieldDecorator('channelId', {
            rules: [{
              message: formatMessage({ id: 'required' }),
              transform: (value) => {
                if (value) {
                  return value.toString();
                }
                return value;
              },
            }],
            initialValue:record ? record.channelid : "",
          })(<Select
              key="service"
              allowClear
              label={<FormattedMessage id="warnings.chooseDingDing" />}
              filter
              dropdownMatchSelectWidth
              onSelect={this.selectDingDing}
              size="default"
              optionFilterProp="children"
              filterOption={
                (input, option) => option.props.children.props.children.props.children
                  .toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {selectDingDingData && selectDingDingData.length > 0 && selectDingDingData.map(s => (
                <Option
                  value={s.id}
                  key={s.id}
                >
                  <Tooltip
                    placement="right"
                    trigger="hover"
                    title={<p>{s.name}</p>}
                  >
                    <span style={{ display: 'inline-block', width: '100%' }}>{s.name}</span>
                  </Tooltip>
                </Option>
              ))}
            </Select>
          )}
        </FormItem>
        {getSelectTip('warnings.chooseDingDing.tip')}
      </div>
      <FormItem
        {...formItemLayout}
      >
        {getFieldDecorator('type', {
          initialValue: record ? record.status : "",
        })(
          <RadioGroup >
            <Radio value={1}>启用</Radio>
            <Radio value={0}>禁用</Radio>
          </RadioGroup>
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
              onClick={this.handleRefresh1}
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
              loading={loading}
              onChange={this.tableChange1}
              columns={this.getColumn()}
              dataSource={serviceData.slice()}
              rowKey={record => record.id}
              filters={paras.slice()}
            />
          </Content>
        </Fragment> : <DepPipelineEmpty title={<FormattedMessage id="app.head" />} type="app" />)}
        <Modal
          confirmLoading={submitting}
          visible={openRemove}
          title={`${formatMessage({ id: 'app.delete' })}“${appName}”`}
          closable={false}
          footer={[
            <Button key="back" onClick={this.closeRemove} disabled={submitting}>{<FormattedMessage id="cancel" />}</Button>,
            <Button key="submit" type="danger" onClick={this.deleteApp.bind(this, id)} loading={submitting}>
              {formatMessage({ id: 'delete' })}
            </Button>,
          ]}
        >
          <p>{formatMessage({ id: 'app.delete.tooltip' })}</p>
        </Modal>
      </Page>
    );
  }
}

export default Form.create({})(withRouter(injectIntl(WarningsHome)));
