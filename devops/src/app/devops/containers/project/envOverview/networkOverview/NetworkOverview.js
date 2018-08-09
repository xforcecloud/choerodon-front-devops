/* eslint-disable react/sort-comp */
import React, { Component, Fragment } from 'react';
import { observer } from 'mobx-react';
import { observable, action, configure } from 'mobx';
import { withRouter } from 'react-router-dom';
import { injectIntl, FormattedMessage } from 'react-intl';
import { Table, Button, Form, Tooltip, Modal, Progress, Popover, Icon } from 'choerodon-ui';
import { Permission, Header, Page, Action, stores } from 'choerodon-front-boot';
import _ from 'lodash';
import '../EnvOverview.scss';
import '../../../main.scss';
import '../../networkConfig/networkHome/NetworkHome.scss';
import MouserOverWrapper from '../../../../components/MouseOverWrapper';
import NetworkConfigStore from '../../../../stores/project/networkConfig';
import EditNetwork from '../../networkConfig/editNetwork';

const { AppState } = stores;

configure({ enforceActions: false });

@observer
class NetworkOverview extends Component {
  @observable openRemove = false;
  @observable showEdit = false;
  constructor(props, context) {
    super(props, context);
    this.state = {
    };
  }

  /**
   * 打开编辑的操作框
   * @param id
   */
  @action
  editNetwork = (id) => {
    NetworkConfigStore.setApp([]);
    NetworkConfigStore.setEnv([]);
    NetworkConfigStore.setIst([]);
    this.showEdit = true;
    this.id = id;
  };

  /**
   * 删除数据
   */
  handleDelete = () => {
    const { store, envId } = this.props;
    const { id: projectId } = AppState.currentMenuType;
    const lastDatas = store.getPageInfo.total % 10;
    const page = store.getPageInfo.current;
    const totalPage = Math.ceil(store.getPageInfo.total / store.getPageInfo.pageSize);
    this.submitting = true;
    NetworkConfigStore.deleteData(projectId, this.id).then((data) => {
      if (data) {
        this.submitting = false;
        if (lastDatas === 1 && page === totalPage) {
          store.loadNetwork(projectId, envId, store.getPageInfo.current - 2);
        } else {
          store.loadNetwork(projectId, envId, store.getPageInfo.current - 1);
        }
        this.closeRemove();
      }
    }).catch((error) => {
      this.submitting = false;
      Choerodon.prompt(error);
    });
  };

  /**
   * 按环境加载网络
   * @param envId
   */
  loadNetwork = (envId) => {
    const { store } = this.props;
    const projectId = AppState.currentMenuType.id;
    store.loadNetwork(projectId, envId);
  };

  /**
   * 关闭删除数据的模态框
   */
  @action
  closeRemove = () => {
    this.openRemove = false;
  };

  /**
   * 关闭侧边栏
   */
  @action
  handleCancelFun = () => {
    this.showEdit = false;
    this.loadNetwork(this.props.envId);
  };

  /**
   * 打开删除网络弹框
   * @param id
   */
  @action
  openRemoveModal = (id) => {
    this.openRemove = true;
    this.id = id;
  };

  /**
   * 状态 列
   * @param record
   * @returns {*}
   */
  statusColumn = (record) => {
    let msg = null;
    let styles = '';
    switch (record.status) {
      case 'failed':
        msg = 'network.failed';
        styles = 'c7n-network-status-failed';
        break;
      case 'operating':
        msg = 'operating';
        styles = 'c7n-network-status-operating';
        break;
      default:
        msg = 'running';
        styles = 'c7n-network-status-running';
    }
    return (<div className={`c7n-network-status ${styles}`}>
      <FormattedMessage id={msg} />
    </div>);
  };

  /**
   * 配置类型 列
   * @param record
   * @returns {Array}
   */
  configColumn = (record) => {
    const { externalIps, ports } = record.config;
    const iPArr = [];
    const portArr = [];
    if (externalIps && externalIps.length) {
      _.forEach(externalIps, item => iPArr.push(<div key={item} className="network-config-item">{item}</div>));
    }
    if (ports && ports.length) {
      _.forEach(ports, (item) => {
        const { nodePort, port, targetPort } = item;
        portArr.push(<div key={port} className="network-config-item">{nodePort} {port} {targetPort}</div>);
      });
    }
    const type = externalIps && externalIps.length ? 'ClusterIP' : 'NodePort';
    const content = externalIps ? (<Fragment>
      <div className="network-config-wrap">
        <div className="network-type-title"><FormattedMessage id={'network.column.ip'} /></div>
        <div>{iPArr}</div>
      </div>
      <div className="network-config-wrap">
        <div className="network-type-title"><FormattedMessage id={'network.column.port'} /></div>
        <div>{portArr}</div>
      </div>
    </Fragment>) : (<Fragment>
      <div className="network-config-item"><FormattedMessage id={'network.node.port'} /></div>
      <div>{portArr}</div>
    </Fragment>);
    return (<div className="network-column-config">
      <span className="network-config-type">{type}</span>
      <Popover
        arrowPointAtCenter
        placement="bottomRight"
        getPopupContainer={triggerNode => triggerNode.parentNode}
        content={content}
      >
        <Icon type="expand_more" className="network-expend-icon" />
      </Popover>
    </div>);
  };

  /**
   * 生成 目标对象 列
   * @param record
   * @returns {Array}
   */
  targetColumn = (record) => {
    const { appInstance, labels } = record.target;
    const node = [];
    if (appInstance && appInstance.length) {
      _.forEach(appInstance, (item) => {
        const { id, code } = item;
        node.push(<div className="network-column-instance" key={id}>{code}</div>);
      });
    }
    if (!_.isEmpty(labels)) {
      _.forEach(labels, (value, key) => node.push(<div className="network-column-entry" key={key}>
        <span>{key}</span>
        <span>{`  =  ${value}`}</span>
      </div>));
    }
    return (<div className="network-column-target">
      {node[0] || null}
      <Popover
        arrowPointAtCenter
        placement="bottomRight"
        getPopupContainer={triggerNode => triggerNode.parentNode}
        content={<Fragment>
          {node}
        </Fragment>}
      >
        <Icon type="expand_more" className="network-expend-icon" />
      </Popover>
    </div>);
  };

  /**
   * 操作 列
   * @param record
   * @param type
   * @param projectId
   * @param orgId
   * @returns {*}
   */
  opColumn = (record, type, projectId, orgId) => {
    const { status, envStatus, id } = record;
    let editDom = null;
    let deleteDom = null;
    if (status !== 'operating' && envStatus) {
      editDom = (<Tooltip trigger="hover" placement="bottom" title={<FormattedMessage id={'edit'} />}>
        <Button shape="circle" size={'small'} funcType="flat" onClick={this.editNetwork.bind(this, id)}>
          <span className="icon icon-mode_edit" />
        </Button>
      </Tooltip>);
      deleteDom = (<Tooltip trigger="hover" placement="bottom" title={<FormattedMessage id={'delete'} />}>
        <Button shape="circle" size={'small'} funcType="flat" onClick={this.openRemoveModal.bind(this, id)}>
          <span className="icon icon-delete_forever" />
        </Button>
      </Tooltip>);
    } else {
      editDom = (<span className="icon icon-mode_edit c7n-app-icon-disabled" />);
      deleteDom = (<span className="icon icon-delete_forever c7n-app-icon-disabled" />);
    }
    return (<Fragment>
      <Permission
        service={['devops-service.devops-service.update']}
        type={type}
        projectId={projectId}
        organizationId={orgId}
      >
        {editDom}
      </Permission>
      <Permission
        service={['devops-service.devops-service.delete']}
        type={type}
        projectId={projectId}
        organizationId={orgId}
      >
        {deleteDom}
      </Permission>
    </Fragment>);
  };

  /**
   * table 操作
   * @param pagination
   * @param filters
   * @param sorter
   * @param paras
   */
  tableChange =(pagination, filters, sorter, paras) => {
    const { store, envId } = this.props;
    const { id } = AppState.currentMenuType;
    const sort = { field: '', order: 'desc' };
    if (sorter.column) {
      sort.field = sorter.field || sorter.columnKey;
      if (sorter.order === 'ascend') {
        sort.order = 'asc';
      } else if (sorter.order === 'descend'){
        sort.order = 'desc';
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
    store.loadNetwork(id, envId, page, pagination.pageSize, sort, postData);
  };

  render() {
    const { store, intl } = this.props;
    const data = store.getNetwork;
    const { type, id: projectId, organizationId: orgId } = AppState.currentMenuType;
    const columns = [{
      title: <FormattedMessage id={'network.column.status'} />,
      key: 'status',
      width: 72,
      render: record => this.statusColumn(record),
    }, {
      title: <FormattedMessage id={'network.column.name'} />,
      key: 'name',
      sorter: true,
      filters: [],
      render: record => (<MouserOverWrapper text={record.name || ''} width={0.1} className="network-list-name">
        {record.name}</MouserOverWrapper>),
    }, {
      title: <FormattedMessage id={'network.column.env'} />,
      key: 'envName',
      sorter: true,
      filters: [],
      render: record => (
        <Fragment>
          { record.envStatus ? <Tooltip title={<FormattedMessage id={'connect'} />}> <span className="env-status-success" /></Tooltip> : <Tooltip title={<FormattedMessage id={'disconnect'} />}>
            <span className="env-status-error" />
          </Tooltip> }
          {record.envName}
        </Fragment>
      ),
    }, {
      title: <FormattedMessage id={'network.target'} />,
      key: 'target',
      filters: [],
      render: record => this.targetColumn(record),
    }, {
      title: <FormattedMessage id={'network.config.column'} />,
      key: 'config',
      filters: [],
      render: record => this.configColumn(record),
    }, {
      width: '82px',
      key: 'action',
      render: record => this.opColumn(record, type, projectId, orgId),
    }];
    return (<div className="c7n-network-wrapper">
      <Table
        filterBarPlaceholder={intl.formatMessage({ id: 'filter' })}
        loading={store.isLoading}
        pagination={store.pageInfo}
        columns={columns}
        onChange={this.tableChange}
        dataSource={data}
        rowKey={record => record.id}
      />
      {this.showEdit && <EditNetwork
        id={this.id}
        visible={this.showEdit}
        store={NetworkConfigStore}
        onClose={this.handleCancelFun}
      />}
      <Modal
        visible={this.openRemove}
        title={<FormattedMessage id={'network.delete'} />}
        closable={false}
        footer={[
          <Button key="back" onClick={this.closeRemove}><FormattedMessage id={'cancel'} /></Button>,
          <Button key="submit" type="danger" onClick={this.handleDelete} loading={this.submitting}>
            <FormattedMessage id={'delete'} />
          </Button>,
        ]}
      >
        <p><FormattedMessage id={'network.delete.tooltip'} />？</p>
      </Modal>
    </div>);
  }
}

export default Form.create({})(withRouter(injectIntl(NetworkOverview)));