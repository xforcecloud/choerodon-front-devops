/* eslint-disable react/sort-comp */
import React, { Component } from 'react';
import { observer } from 'mobx-react';
import { observable, action, configure } from 'mobx';
import { withRouter } from 'react-router-dom';
import { injectIntl, FormattedMessage } from 'react-intl';
import { Table, Button, Form, Tooltip, Modal, Progress } from 'choerodon-ui';
import { Permission, Header, Page, Action, stores } from 'choerodon-front-boot';
import _ from 'lodash';
import '../EnvOverview.scss';
import '../../domain/domainHome/DomainHome.scss';
import '../../../main.scss';
import DomainStore from '../../../../stores/project/domain';
import CreateDomain from '../../domain/createDomain';

const { AppState } = stores;

@observer
class DomainOverview extends Component {
  @observable openRemove = false;
  @observable showDomain = false;
  constructor(props, context) {
    super(props, context);
    this.state = {
    };
  }

  /**
   * 按环境加载域名
   * @param envId
   */
  loadDomain = (envId) => {
    const { store } = this.props;
    const projectId = AppState.currentMenuType.id;
    store.loadDomain(projectId, envId);
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
    DomainStore.deleteData(projectId, this.id).then((data) => {
      if (data) {
        this.submitting = false;
        if (lastDatas === 1 && page === totalPage) {
          store.loadDomain(projectId, envId, store.getPageInfo.current - 2);
        } else {
          store.loadDomain(projectId, envId, store.getPageInfo.current - 1);
        }
        this.closeRemove();
      }
    }).catch((error) => {
      this.submitting = false;
      Choerodon.prompt(error);
    });
  };

  /**
   *打开域名编辑弹框
   */
  @action
  createDomain = (type, id = '') => {
    this.props.form.resetFields();
    if (type === 'create') {
      this.domainTitle = this.props.intl.formatMessage({ id: 'domain.header.create' });
      this.domainType = type;
      this.domainId = id;
    } else {
      this.domainTitle = this.props.intl.formatMessage({ id: 'domain.header.update' });
      this.domainType = type;
      this.domainId = id;
    }
    this.showDomain = true;
  };

  /**
   * 打开删除网络弹框
   * @param id
   */
  @action
  openRemoveDomain = (id) => {
    this.openRemove = true;
    this.id = id;
  };

  /**
   * 关闭域名侧边栏
   */
  @action
  closeDomain = () => {
    this.props.form.resetFields();
    this.showDomain = false;
    this.domainId = null;
    this.loadDomain(this.props.envId);
  };

  /**
   * 关闭删除数据的模态框
   */
  @action
  closeRemove = () => {
    this.openRemove = false;
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
    store.loadDomain(id, envId, page, pagination.pageSize, sort, postData);
  };

  render() {
    const { intl, store } = this.props;
    const data = store.getDomain;
    const menu = AppState.currentMenuType;
    const projectName = menu.name;
    const { type, id: projectId, organizationId: orgId } = menu;
    const columns = [{
      key: 'status',
      title: intl.formatMessage({ id: 'domain.column.status' }),
      render: (record) => {
        let statusDom = null;
        switch (record.status) {
          case 'failed':
            statusDom = (<div className="c7n-domain-status c7n-domain-status-failed">
              <div>{intl.formatMessage({ id: 'failed' })}</div>
            </div>);
            break;
          case 'operating':
            statusDom = (<div className="c7n-domain-status c7n-domain-status-operating">
              <div>{intl.formatMessage({ id: 'operating' })}</div>
            </div>);
            break;
          default:
            statusDom = (<div className="c7n-domain-status c7n-domain-status-running">
              <div>{intl.formatMessage({ id: 'running' })}</div>
            </div>);
        }
        return (statusDom);
      },
    }, {
      title: intl.formatMessage({ id: 'domain.column.name' }),
      key: 'name',
      sorter: true,
      filters: [],
      render: (record) => {
        let statusDom = null;
        switch (record.commandStatus) {
          case 'failed':
            statusDom = (<Tooltip title={record.error}>
              <span className="icon icon-error c7n-status-failed" />
            </Tooltip>);
            break;
          case 'doing':
            statusDom = (<Tooltip title={intl.formatMessage({ id: `ist_${record.commandType}` })}>
              <Progress type="loading" width={15} style={{ marginRight: 5 }} />
            </Tooltip>);
            break;
          default:
            statusDom = null;
        }
        return (<React.Fragment>
          {record.name}
          {statusDom}
        </React.Fragment>);
      },
    }, {
      title: intl.formatMessage({ id: 'domain.column.domain' }),
      key: 'domain',
      filters: [],
      dataIndex: 'domain',
    }, {
      title: intl.formatMessage({ id: 'domain.column.path' }),
      className: 'c7n-network-col',
      key: 'path',
      sorter: true,
      filters: [],
      render: record => (
        <div>
          {_.map(record.pathList, router =>
            (<div className="c7n-network-col_border" key={router.path}>
              <span>{router.path}</span>
            </div>))}
        </div>
      ),
    }, {
      title: intl.formatMessage({ id: 'domain.column.network' }),
      className: 'c7n-network-col',
      key: 'serviceName',
      filters: [],
      render: record => (
        <div>
          {_.map(record.pathList, instance =>
            (<div className="c7n-network-col_border" key={`${instance.path}-${instance.serviceId}`}>
              <Tooltip title={intl.formatMessage({ id: `${instance.serviceStatus || 'null'}` })} placement="top">
                <span className={instance.serviceStatus === 'running' ? 'env-status-success' : 'env-status-error'} />
              </Tooltip>
              {instance.serviceName}
            </div>
            ))}
        </div>
      ),
    }, {
      key: 'action',
      align: 'right',
      className: 'c7n-network-text_top',
      render: (record) => {
        let editDom = null;
        let deletDom = null;
        switch (record.status) {
          case 'operating':
            editDom = (<Tooltip trigger="hover" placement="bottom" title={intl.formatMessage({ id: `domain_${record.status}` })}>
              <span className="icon icon-mode_edit c7n-app-icon-disabled" />
            </Tooltip>);
            deletDom = (<Tooltip trigger="hover" placement="bottom" title={intl.formatMessage({ id: `domain_${record.status}` })}>
              <span className="icon icon-delete_forever c7n-app-icon-disabled" />
            </Tooltip>);
            break;
          default:
            editDom = (<React.Fragment>
              {record.envStatus ? <Tooltip trigger="hover" placement="bottom" title={<div>{intl.formatMessage({ id: 'edit' })}</div>}>
                <Button shape="circle" size={'small'} funcType="flat" onClick={this.createDomain.bind(this, 'edit', record.id)}>
                  <span className="icon icon-mode_edit" />
                </Button>
              </Tooltip> : <Tooltip trigger="hover" placement="bottom" title={<div>{intl.formatMessage({ id: 'network.env.tooltip' })}</div>}>
                <span className="icon icon-mode_edit c7n-app-icon-disabled" />
              </Tooltip>}
            </React.Fragment>);
            deletDom = (<React.Fragment>
              {record.envStatus ? <Tooltip trigger="hover" placement="bottom" title={<div>{intl.formatMessage({ id: 'delete' })}</div>}>
                <Button shape="circle" size={'small'} funcType="flat" onClick={this.openRemoveDomain.bind(this, record.id)}>
                  <span className="icon icon-delete_forever" />
                </Button>
              </Tooltip> : <Tooltip trigger="hover" placement="bottom" title={<div>{intl.formatMessage({ id: 'network.env.tooltip' })}</div>}>
                <span className="icon icon-delete_forever c7n-app-icon-disabled" />
              </Tooltip>}
            </React.Fragment>);
        }
        return (<div>
          <Permission
            service={['devops-service.devops-ingress.update']}
            type={type}
            projectId={projectId}
            organizationId={orgId}
          >
            {editDom}
          </Permission>
          <Permission
            service={['devops-service.devops-ingress.delete']}
            type={type}
            projectId={projectId}
            organizationId={orgId}
          >
            {deletDom}
          </Permission>
        </div>);
      },
    }];
    return (<div className="c7n-domain-wrapper">
      <Table
        filterBarPlaceholder={intl.formatMessage({ id: 'filter' })}
        loading={store.isLoading}
        onChange={this.tableChange}
        pagination={store.pageInfo}
        columns={columns}
        dataSource={data}
        rowKey={record => record.id}
      />
      {this.showDomain && <CreateDomain
        id={this.domainId}
        title={this.domainTitle}
        visible={this.showDomain}
        type={this.domainType}
        store={DomainStore}
        onClose={this.closeDomain}
      />}
      <Modal
        visible={this.openRemove}
        title={<FormattedMessage id={'domain.header.delete'} />}
        closable={false}
        footer={[
          <Button key="back" onClick={this.closeRemove}>{<FormattedMessage id={'cancel'} />}</Button>,
          <Button key="submit" type="danger" onClick={this.handleDelete} loading={this.submitting}>
            {intl.formatMessage({ id: 'delete' })}
          </Button>,
        ]}
      >
        <p>{intl.formatMessage({ id: 'confirm.delete' })}</p>
      </Modal>
    </div>);
  }
}

export default Form.create({})(withRouter(injectIntl(DomainOverview)));