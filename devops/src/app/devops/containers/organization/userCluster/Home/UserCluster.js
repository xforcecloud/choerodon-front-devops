import React, { Component } from 'react';
import { Button, Input, Form, Tooltip, Modal, Popover, Table, Tag, Icon, Radio, Pagination, Card, Checkbox, Row, Col,Popconfirm } from 'choerodon-ui';
import { observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { Content, Header, Page, Permission, stores } from 'choerodon-front-boot';
import { injectIntl, FormattedMessage } from 'react-intl';
import _ from 'lodash';
import CopyToBoard from 'react-copy-to-clipboard';
import LoadingBar from '../../../../components/loadingBar';
import './UserCluster.scss';
import '../../../main.scss';
import UserClusterStore from "../../../../stores/organization/userCluster/UserClusterStore";
import AdminClusterStore from  '../../../../stores/admin/adminCluster';

const HEIGHT = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;

const { AppState } = stores;
const Sidebar = Modal.Sidebar;
const RadioGroup = Radio.Group;
const FormItem = Form.Item;
const { TextArea } = Input;
const CheckboxGroup = Checkbox.Group;

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

@observer
class UserCluster extends Component {

  constructor(props) {
    super(props);
    const { organizationId } = AppState.currentMenuType;
    this.state = {
      id: '',
      organizationId,
      show: false,
      showDel: false,
      submitting: false,
      btnLoading: false,
      checked: true,
      sideType: '',
      createSelectedRowKeys: [],
      createSelected: [],
      selected: [],
      createSelectedTemp: [],
      selectedRowKeys: false,
      token: null,
      delId: null,
      clsName: '',
      page: 0,
      size: HEIGHT <= 900 ? 12 : 18,
      clusterName:'',
      visible: false,
      clusterId1:null,
      organizationId1:null,
      organizationName1:'',
      clusterName1: '',
      clusterCode1:'',
      clusterDescription1:'',
    };
  }

  componentDidMount() {
    this.loadCluster();
    const { organizationId } = AppState.currentMenuType;
    const { UserClusterStore } = this.props;
    UserClusterStore.loadActiveCluster(organizationId);
  }

  handleRefresh = () => {
    this.loadCluster(this.state.page, this.state.size);
    const { organizationId } = AppState.currentMenuType;
    const { UserClusterStore } = this.props;
    UserClusterStore.loadActiveCluster(organizationId);
  };

  loadCluster = (page, size) => {
    const { UserClusterStore } = this.props;
    const { organizationId } = AppState.currentMenuType;
    UserClusterStore.loadCluster(organizationId, page, size);
  };

  onCreateSelectChange = (keys, selected) => {
    let s = [];
    const a = this.state.createSelectedTemp.concat(selected);
    this.setState({ createSelectedTemp: a });
    _.map(keys, o => {
      if (_.filter(a, ['id', o]).length) {
        s.push(_.filter(a, ['id', o])[0])
      }
    });
    this.setState({
      createSelectedRowKeys: keys,
      createSelected: s,
    });
  };

  /**
   * 分配权限
   * @param keys
   * @param selected
   */
  onSelectChange = (keys, selected) => {
    const { UserClusterStore } = this.props;
    const {
      getTagKeys: tagKeys,
      getPrmPro: prmPro,
    } = UserClusterStore;
    let s = [];
    const a = tagKeys.length ? tagKeys.concat(selected) : this.state.selected.concat(selected);
    this.setState({ selected: a });
    _.map(keys, o => {
      if (_.filter(a, ['id', o]).length) {
        s.push(_.filter(a, ['id', o])[0])
      }
    });
    const ids = _.map(prmPro, p => p.id);
    const delIds = _.difference(ids, keys);
    let selectIds = tagKeys;
    _.map(delIds, d => {
      _.map(selectIds, t => {
        if (d === t.id) {
          selectIds = _.reject(selectIds, s => s.id === d);
        }
      })
    });
    const temp = _.map(selectIds, s => s.id);
    _.map(selected, k => {
      if (!_.includes(temp, k.id)) {
        selectIds.push(k);
      }
    });
    UserClusterStore.setSelectedRk(keys);
    UserClusterStore.setTagKeys(s);
    this.setState({ selectedRowKeys: keys });
  };

  cbChange = (e) => {
    this.setState({ checked: e.target.value });
  };

  /**
   * table 操作
   * @param pagination
   * @param filters
   * @param sorter
   * @param paras
   */
  tableChange =(pagination, filters, sorter, paras) => {
    const { UserClusterStore } = this.props;
    const { organizationId } = AppState.currentMenuType;
    UserClusterStore.setInfo({ filters, sort: sorter, paras });
    let sort = { field: '', order: 'desc' };
    if (sorter.column) {
      sort.field = sorter.field || sorter.columnKey;
      if(sorter.order === 'ascend') {
        sort.order = 'asc';
      } else if(sorter.order === 'descend'){
        sort.order = 'desc';
      }
    }
    let page = pagination.current - 1;
    const postData = [paras.toString()];
    if (this.state.sideType === 'create') {
      UserClusterStore.loadPro(organizationId, null, page, pagination.pageSize, sort, postData);
    } else {
      const id = UserClusterStore.getClsData.id;
      UserClusterStore.loadPro(organizationId, id, page, pagination.pageSize, sort, postData);
    }
  };

  revokeCluster = (id) => {
    this.setState({
      showDel: true,
      delId: id,
    })
  };

  revoke = () => {
    const { UserClusterStore } = this.props;
    const { organizationId } = AppState.currentMenuType;
    const clusters = UserClusterStore.getData;
    this.setState({
      btnLoading: true,
    });
    const data = {
      organizationId:organizationId,
      clusterId:this.state.delId,
    }
    UserClusterStore.revoke(organizationId, data)
      .then((data) => {
        if (data && data.failed) {
          Choerodon.prompt(data.message);
          this.setState({
            btnLoading: false,
          })
        } else {
          this.setState({
            delId: null,
            showDel: false,
            btnLoading: false,
          }, () => {
            if (clusters.length % this.state.size === 1) {
              this.loadCluster(this.state.page - 1, this.state.size);
              UserClusterStore.loadActiveCluster(organizationId);
            } else {
              this.loadCluster(this.state.page, this.state.size);
              UserClusterStore.loadActiveCluster(organizationId);
            }
          })
        }
      })
  };

  getCluster = () => {
    const {
      UserClusterStore,
      intl: { formatMessage },
      form: { getFieldDecorator },
    } = this.props;
    const { organizationId, type } = AppState.currentMenuType;
    const clusters = UserClusterStore.getData;
    const formContent = (<Form layout="vertical" className="c7n-sidebar-form">
      <FormItem
        {...formItemLayout}
      >
        {getFieldDecorator('reason')(
          <TextArea
            autosize={{ minRows: 3 }}
            maxLength={30}
            label={<FormattedMessage id="user.apply.reason" />}
          />,
        )}
      </FormItem>
    </Form>);
    return (clusters[0].isConnected == null ? <div className="c7n-cls-card-des-name" >{formatMessage({ id: 'user.noApply' })}</div>:
      _.map(_.filter(clusters, c => c.isConnected != -2&c.isConnected != null), c =>(
      <Tooltip key={c.clusterId} placement="bottom" title={c.clusterName}>
        <div className={`c7n-cls-card-apply ${c.isConnected==1 ? 'c7n-cls-card-connect' : (c.isConnected == 2 ? 'c7n-cls-card-reject' : '')}`}>
          <div className="c7n-cls-card-head">
            <div>
              <div className="c7n-cls-card-head-state">
                {c.isConnected == 0 ? formatMessage({ id: 'user.applying' }) : (c.isConnected == 1 ? formatMessage({ id: 'user.pass' }) : formatMessage({ id: 'user.reject' })) }
              </div>
              <i className="c7n-cls-card-head-state_after" />
            </div>
            <div className="c7n-cls-card-head-action">
              {c.isConnected == 0 ? <Permission
                service={['devops-service.devops-cluster.deleteCluster']}
                type={type}
                organizationId={organizationId}
              >
                <Tooltip title={<FormattedMessage id="user.cluster.del" />}>
                  <Button
                    funcType="flat"
                    shape="circle"
                    onClick={this.revokeCluster.bind(this, c.clusterId, c.organizationId)}
                  >
                    <Icon type="delete_forever" />
                  </Button>
                </Tooltip>
              </Permission> : null}
              {c.isConnected == 2 ? <Permission
                service={['devops-service.devops-cluster.deleteCluster']}
                type={type}
                organizationId={organizationId}
              >
                <Tooltip title={<FormattedMessage id="user.cluster.reApply" />}>
                  <Button
                    funcType="flat"
                    shape="circle"
                    onClick={this.showModal.bind(this,c)}
                  >
                    <Icon type="system_update" />
                  </Button>
                  <Modal
                    title={<FormattedMessage id="user.input.reason" />}
                    visible={this.state.visible}
                    onOk={this.handleOk}
                    onCancel={this.handleCancel}
                    width={550}
                  >
                    <Content className="sidebar-content">
                      {formContent}
                    </Content>
                  </Modal>
                </Tooltip>
              </Permission> : null}
            </div>
          </div>
          <div className="c7n-cls-card-content">
            <div className="c7n-cls-card-state">
              <div className="c7n-cls-icon-wrap">
                {c.isConnected == 0 ? <Icon type="disconnect" /> : <Icon type="disconnect" />}
              </div>
            </div>
            <div className="c7n-cls-card-des">
              <div className="c7n-cls-card-des-name">{c.clusterName}</div>
              <div className="c7n-cls-card-des-des" title={c.clusterDescription}>{c.clusterDescription}</div>
            </div>
          </div>
        </div>
      </Tooltip>)))
  };

  getFormContent = () => {
    const {
      UserClusterStore,
      intl: { formatMessage },
      form: { getFieldDecorator },
    } = this.props;
    const {
      getInfo: { filters, sort: { columnKey, order }, paras },
      getPageInfo,
      getProData: proData,
      getPrmPro: prmProData,
      getClsData: clsData,
      getShell: shell,
      getTagKeys: tagKeys,
      getTableLoading: tableLoading,
      getData: clusterData,
      getActiveClusterData: activeClusterData,
      getSelectedRk,
    } = UserClusterStore;
    const { copyMsg, token, sideType, checked, createSelectedRowKeys, createSelected, selectedRowKeys } = this.state;
    const rowCreateSelection = {
      selectedRowKeys: createSelectedRowKeys,
      onChange: this.onCreateSelectChange,
    };

    const rowSelection = {
      selectedRowKeys: _.map(tagKeys, s => s.id),
      onChange: this.onSelectChange,
    };
    const tagCreateDom = _.map(createSelected, t => <Tag className="c7n-env-tag" key={t.id}>{t.name}</Tag>);
    const tagDom = _.map(tagKeys, (t) => {
      if (t) {
        return <Tag className="c7n-env-tag" key={t.id}>{t.name} {t.code}</Tag>;
      }
      return null;
    });

    const columns = [{
      key: 'name',
      title: formatMessage({ id: 'cluster.name' }),
      dataIndex: 'name',
    }, {
      key: 'code',
      title: formatMessage({ id: 'cluster.code' }),
      dataIndex: 'code',
    }];

    let formContent = null;
    switch ( sideType ) {
      case 'create':
        formContent = (<div>
          <div>
            <div className="c7n-sidebar-form">
              <Table
                rowSelection={rowCreateSelection}
                columns={columns}
                dataSource={activeClusterData}
                filterBarPlaceholder={formatMessage({ id: 'filter' })}
                pagination={getPageInfo}
                loading={tableLoading}
                onChange={this.tableChange}
                rowKey={record => record.id}
                filters={paras.slice()}
              />
            </div>
            <div className="c7n-env-tag-title">
              <FormattedMessage id="user.cluster.selected" />
            </div>
            <div className="c7n-env-tag-wrap">
              {tagCreateDom}
            </div>
            <Form className="c7n-sidebar-form">
              <FormItem
                {...formItemLayout}
              >
                {getFieldDecorator('description', {
                })(
                  <TextArea
                    autosize={{ minRows: 3 }}
                    maxLength={300}
                    label={<FormattedMessage id="user.apply.reason" />}
                  />
                )}
              </FormItem>
            </Form>
          </div>
        </div>);
        break;
      case 'edit':
        formContent = (<div>

          <div className="c7n-env-tag-title">
            <FormattedMessage id="cluster.authority" />
            <Popover
              overlayStyle={{ maxWidth: '350px' }}
              content={formatMessage({ id: 'cluster.authority.help' })}
            >
              <Icon type="help" />
            </Popover>
          </div>
          <div className="c7n-cls-radio">
            <RadioGroup label={<FormattedMessage id="cluster.public" />}
                        onChange={this.cbChange} value={checked}>
              <Radio value={true}><FormattedMessage id="cluster.project.all" /></Radio>
              <Radio value={false}><FormattedMessage id="cluster.project.part" /></Radio>
            </RadioGroup>
          </div>
          {checked ? null : <div>
            <div className="c7n-sidebar-form">
              <Table
                rowSelection={rowSelection}
                columns={columns}
                dataSource={prmProData}
                filterBarPlaceholder={formatMessage({ id: 'filter' })}
                pagination={getPageInfo}
                loading={tableLoading}
                onChange={this.tableChange}
                rowKey={record => record.id}
                filters={paras.slice()}
              />
            </div>
            <div className="c7n-env-tag-title">
              <FormattedMessage id="cluster.authority.project" />
            </div>
            <div className="c7n-env-tag-wrap">
              {tagDom}
            </div>
          </div>}
        </div>);
        break;
      default:
        formContent = null;
    }
    return formContent;
  };

  showModal = (c) => {
    this.setState({
      visible: true,
      clusterId1:c.clusterId,
      organizationId1:c.organizationId,
      organizationName1:c.organizationName,
      clusterName1: c.clusterName,
      clusterCode1:c.clusterCode,
      clusterDescription1:c.clusterDescription,
    });
  }

  handleOk = (e) => {
    this.props.form.validateFieldsAndScroll((err, data) => {
     this.reApply(data.reason)
      this.setState({
        visible: false,
      });
    });
  }

  handleCancel = (e) => {
    this.setState({
      visible: false,
    });
  }

  //重新申请
  reApply=(e)=>{
    const { UserClusterStore } = this.props;
    const orgId = AppState.currentMenuType.organizationId;
    const data = {
      clusterId:this.state.clusterId1,
      description:e,
      organizationId:this.state.organizationId1,
      organizationName:this.state.organizationName1,
      clusterName: this.state.clusterName1,
      clusterCode:this.state.clusterCode1,
      clusterDescription:this.state.clusterDescription1,
      isConnected:0,
    }
    UserClusterStore.updateCluster(orgId,data).then((data) => {
      if (data && data.failed) {
        Choerodon.prompt(data.message);
        this.setState({
          btnLoading: false,
        })
      } else {
        this.setState({
          delId: null,
          showDel: false,
          btnLoading: false,

          clusterId1:null,
          organizationId1:null,
          organizationName1:'',
          clusterName1: '',
          clusterCode1:'',
          clusterDescription1:'',
        }, () => {
            this.loadCluster(this.state.page - 1, this.state.size);
            UserClusterStore.loadActiveCluster(orgId);
        })
      }
    })
  }

  /**
   * 提交数据
   * @param e
   */
  handleSubmit = (e) => {
    e.preventDefault();
    const { UserClusterStore } = this.props;
    const { organizationId, sideType, checked, createSelectedRowKeys } = this.state;
    const orgName = AppState.currentMenuType.name;
    const tagKeys = UserClusterStore.getTagKeys;
    const {getActiveClusterData: activeClusterData} = UserClusterStore;
    this.setState({
      submitting: true,
    });
    if (sideType === 'create') {
      this.props.form.validateFieldsAndScroll((err, data,revc) => {
        if (!err) {
          this.setState({ clsName: data.name });
          //data.skipCheckProjectPermission = checked;

          let clusterVoList = [];
          for (var i in createSelectedRowKeys) {
            for (var key in activeClusterData){
              if(activeClusterData[key].id == createSelectedRowKeys[i]){
                clusterVoList.push({clusterId:createSelectedRowKeys[i],
                  description:description.value,
                  organizationId:parseInt(organizationId, 10),
                  organizationName:orgName,
                  clusterName: activeClusterData[key].name,
                  clusterCode:activeClusterData[key].code,
                  clusterDescription:activeClusterData[key].description});
              }
            }
          }

          let da = {};
          da = {clusterVoList:clusterVoList};

          data.clusterId = createSelectedRowKeys;
          data.organizationId = parseInt(organizationId, 10);
          UserClusterStore.createCluster(organizationId,da)
            .then((res) => {
              if (res) {
                if (res && res.failed) {
                  this.setState({
                    submitting: false,
                  });
                  Choerodon.prompt(res.message);
                } else {
                  this.loadCluster();
                  UserClusterStore.loadActiveCluster(organizationId);
                  this.setState({
                    sideType: 'token',
                    token: res,
                    submitting: false,
                    createSelectedRowKeys: [],
                    createSelected: [],
                  });
                }
              }
            });
        }
      });
    } else if (sideType === 'edit') {
      const id = UserClusterStore.getClsData.id;
      const proIds = _.map(tagKeys, t => t.id);
      this.props.form.validateFieldsAndScroll((err, data) => {
        if (!err) {
          data.skipCheckProjectPermission = checked;
          data.projects = proIds;
          UserClusterStore.updateCluster(organizationId, id, data)
            .then((res) => {
              if (res && res.failed) {
                this.setState({
                  submitting: false,
                });
                Choerodon.prompt(res.message);
              } else {
                UserClusterStore.setSelectedRk([]);
                UserClusterStore.setTagKeys([]);
                this.loadCluster();
                UserClusterStore.loadActiveCluster(organizationId);
                this.setState({ show: false, submitting: false, selectedRowKeys: false });
              }
            });
        }
      });
    }
  };

  /**
   * 关闭侧边栏
   */
  handleCancelFun = () => {
    const { UserClusterStore } = this.props;
    if (this.state.sideType === 'token') {
      this.loadCluster();
    }
    this.setState({ checked: true, show: false, createSelectedRowKeys: [], createSelected: [], selectedRowKeys: false });
    UserClusterStore.setClsData(null);
    UserClusterStore.setSelectedRk([]);
    UserClusterStore.setInfo({
      filters: {}, sort: { columnKey: 'id', order: 'descend' }, paras: [],
    });
    this.props.form.resetFields();
  };

  /**
   * 弹出侧边栏
   * @param sideType
   * @param id
   * @param name
   */
  showSideBar = (sideType, id, name) => {
    const { UserClusterStore } = this.props;
    const { organizationId } = AppState.currentMenuType;
    if (sideType === 'create') {
      this.setState({ checked: true });
      UserClusterStore.loadPro(organizationId, null, 0, HEIGHT <= 900 ? 10 : 15);
    } else if (sideType === 'edit') {
      UserClusterStore.loadClsById(organizationId, id)
        .then((data) => {
          if (data && data.failed) {
            Choerodon.prompt(data.message);
          } else {
            this.setState({ checked: data.skipCheckProjectPermission });
          }
        });
      UserClusterStore.loadPro(organizationId, id, 0, HEIGHT <= 900 ? 10 : 15);
      UserClusterStore.loadTagKeys(organizationId, id);
    } else if (sideType === 'key') {
      UserClusterStore.loadShell(organizationId, id);
    }
    this.setState({ sideType, show: true, clsName: name });
  };

  /**
   * 根据type显示右侧框标题
   * @returns {*}
   */
  showTitle = (sideType) => {
    if (sideType === 'create') {
      return <FormattedMessage id="user.cluster.create" />;
    } else if (sideType === 'edit') {
      return <FormattedMessage id="user.cluster.edit" />;
    } else if (sideType === 'permission') {
      return <FormattedMessage id="cluster.authority" />;
    } else {
      return <FormattedMessage id="user.cluster.active" />;
    }
  };

  /**
   * 根据type显示footer text
   * @param type
   * @returns {*}
   */
  okText = (type) => {
    const { intl: { formatMessage } } = this.props;
    if (type === 'create' || type === 'createGroup') {
      return formatMessage({ id: 'user.cluster.apply' });
    } else if (type === 'edit' || type === 'editGroup' || type === 'permission') {
      return formatMessage({ id: 'save' });
    } else {
      return formatMessage({ id: 'envPl.close' });
    }
  };

  /**
   * 页码改变的回调
   * @param page
   * @param size
   */
  onPageChange = (page, size) => {
    this.setState({ page: page - 1, size });
    this.loadCluster(page - 1, size);
    const { UserClusterStore } = this.props;
  };

  render() {
    const { type, organizationId, name } = AppState.currentMenuType;
    const { show, sideType, submitting, showDel, btnLoading, clsName } = this.state;
    const {
      UserClusterStore,
      intl: { formatMessage },
    } = this.props;
    const {
      getClsPageInfo: { current, total, pageSize },
      getLoading: loading,
      getData: clusters,
    } = UserClusterStore;
    const showBtns = (sideType === 'create' || sideType === 'edit' || sideType === 'permission');
    const titleName = sideType === 'create' ? name : clsName;

    return (
      <Page
        service={[
          'devops-service.apply-cluster.listCluster',
          'devops-service.apply-cluster.loadActiveCluster',
          'devops-service.apply-cluster.open',
          'devops-service.apply-cluster.type',
          'devops-service.apply-cluster.revoke',
          'devops-service.apply-cluster.loadClusterById',
        ]}
        className="c7n-region"
      >
        <Header title={<FormattedMessage id="user.cluster.head" />}>
          <Permission
            service={['devops-service.devops-cluster.create']}
            type={type}
            organizationId={organizationId}
          >
            <Button
              icon="playlist_add"
              funcType="flat"
              onClick={this.showSideBar.bind(this, 'create')}
            >
              <FormattedMessage id="user.cluster.create" />
            </Button>
          </Permission>
          <Permission
            service={['devops-service.devops-cluster.listCluster']}
            type={type}
            organizationId={organizationId}
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
        <Content code={clusters && clusters.length ? 'user.cluster' : ''} values={{ name }}>
          {show && <Sidebar
            title={this.showTitle(sideType)}
            visible={show}
            onOk={(sideType === 'token' || sideType === 'key') ? this.handleCancelFun : this.handleSubmit}
            onCancel={this.handleCancelFun.bind(this)}
            confirmLoading={submitting}
            okCancel={showBtns}
            cancelText={<FormattedMessage id="cancel" />}
            okText={this.okText(sideType)}
          >
            <Content code={`user.cluster.${sideType}`} values={{ clsName: titleName }} className="sidebar-content">
              {this.getFormContent()}
            </Content>
          </Sidebar>}
          {loading ? <LoadingBar display /> : (clusters && clusters.length ? <React.Fragment>
            <div className="c7n-cls-card-wrap">
              {this.getCluster()}
            </div>
            {clusters.length > this.state.size ? <div className="c7n-cls-pagination">
              <Pagination
                tiny={false}
                showSizeChanger
                showSizeChangerLabel={false}
                total={total || 0}
                current={current || 0}
                pageSize={pageSize || 0}
                onChange={this.onPageChange}
                onShowSizeChange={this.onPageChange}
              />
            </div> : null}
          </React.Fragment> : <Card title={formatMessage({ id: 'user.cluster.create' })} className="c7n-depPi-empty-card">
            <Button
              type="primary"
              funcType="raised"
              onClick={this.showSideBar.bind(this, 'create')}
            >
              <FormattedMessage id="user.cluster.create" />
            </Button>
          </Card>)}
        </Content>
        <Modal
          className="c7n-cls-del-modal"
          title={<FormattedMessage id="user.revoke.title" values={{ clsName }} />}
          visible={showDel}
          onOk={this.revoke}
          closable={false}
          footer={[
            <Button key="back"
                    onClick={() => this.setState({ delId: null, showDel: false })}
                    disabled={btnLoading}
            >
              <FormattedMessage id="cancel" />
            </Button>,
            <Button key="submit" type="primary" loading={btnLoading} onClick={this.revoke}>
              <FormattedMessage id="user.cluster.del.confirm" />
            </Button>,
          ]}
        >
        </Modal>
      </Page>
    );
  }
}

export default Form.create({})(withRouter(injectIntl(UserCluster)));
