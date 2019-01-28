import React, { Component } from 'react';
import { Button, Input, Form, Tooltip, Modal, Popover, Table, Tag, Icon, Radio, Pagination, Card, Select } from 'choerodon-ui';
import { observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { Content, Header, Page, Permission, stores } from 'choerodon-front-boot';
import { injectIntl, FormattedMessage } from 'react-intl';
import _ from 'lodash';
import CopyToBoard from 'react-copy-to-clipboard';
import LoadingBar from '../../../../components/loadingBar';
import { commonComponent } from '../../../../components/commonFunction';
import './AdminCluster.scss';
import '../../../project/envPipeline/EnvPipeLineHome.scss';
import '../../../main.scss';
import '../../../../components/DepPipelineEmpty/DepPipelineEmpty.scss';

const HEIGHT = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;

const { AppState } = stores;
const Sidebar = Modal.Sidebar;
const RadioGroup = Radio.Group;
const FormItem = Form.Item;
const { TextArea } = Input;
const Option = Select.Option;
const InputGroup = Input.Group;


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

const selectBefore = (
  <Select defaultValue="N" style={{ width: 80 }}>
    <Option value="N">N</Option>
    <Option value="P">P</Option>
    <Option value="T">T</Option>
    <Option value="F">F</Option>
  </Select>
);

@commonComponent('AdminClusterStore')
@observer
class AdminCluster extends Component {
  /**
   * 检查编码是否合法
   * @param rule
   * @param value
   * @param callback
   */
  checkCode = _.debounce((rule, value, callback) => {
    const { AdminClusterStore, intl: { formatMessage } } = this.props;
    const pa = /^[a-z]([-a-z0-9]*[a-z0-9])?$/;
    if (value && pa.test(value)) {
      AdminClusterStore.checkCode(this.state.organizationId, value)
        .then((error) => {
          if (error && error.failed) {
            callback(formatMessage({ id: 'envPl.code.check.exist' }));
          } else {
            callback();
          }
        });
    } else if (value && !pa.test(value)) {
      callback(formatMessage({ id: 'envPl.code.check.failed' }));
    } else {
      callback();
    }
  }, 1000);

  /**
   * 检查名称唯一性
   * @param rule
   * @param value
   * @param callback
   */
  checkName = _.debounce((rule, value, callback) => {
    const { AdminClusterStore: { checkName, getClsData: clsData }, intl: { formatMessage } } = this.props;
    const { organizationId } = this.state;
    if ((clsData && value !== clsData.name) || !clsData) {
      checkName(organizationId, value)
        .then((data) => {
          if (data && data.failed) {
            callback(formatMessage({ id: 'template.checkName' }));
          } else {
            callback();
          }
        }).catch((error) => {
        Choerodon.prompt(error.response.data.message);
      });
    } else {
      callback();
    }
  }, 600);

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
    };
  }

  componentDidMount() {
    this.loadCluster();
  }

  handleRefresh1 = () => {
    this.loadCluster(this.state.page, this.state.size);
  };

  loadCluster = (page, size) => {
    const { AdminClusterStore } = this.props;
    const { organizationId } = AppState.currentMenuType;
    AdminClusterStore.loadCluster(organizationId, page, size);
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
    const { AdminClusterStore } = this.props;
    const {
      getTagKeys: tagKeys,
      getPrmPro: prmPro,
    } = AdminClusterStore;
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
    AdminClusterStore.setSelectedRk(keys);
    AdminClusterStore.setTagKeys(s);
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
    const { AdminClusterStore } = this.props;
    const { organizationId } = AppState.currentMenuType;
    AdminClusterStore.setInfo({ filters, sort: sorter, paras });
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
      AdminClusterStore.loadPro(organizationId, null, page, pagination.pageSize, sort, postData);
    } else {
      const id = AdminClusterStore.getClsData.id;
      AdminClusterStore.loadPro(organizationId, id, page, pagination.pageSize, sort, postData);
    }
  };

  /**
   * 辅助函数
   */
  handleCopy = () => {
    const { intl: { formatMessage } } = this.props;
    this.setState({ copyMsg: formatMessage({ id: 'envPl.token.coped' }) });
  };

  mouseEnter = () => {
    const { intl: { formatMessage } } = this.props;
    this.setState({ copyMsg: formatMessage({ id: 'envPl.code.copy.tooltip' }) });
  };

  delClusterShow = (id, name) => {
    this.setState({
      showDel: true,
      delId: id,
      clsName: name,
    })
  };

  delCluster = () => {
    const { AdminClusterStore } = this.props;
    const { organizationId } = AppState.currentMenuType;
    const clusters = AdminClusterStore.getData;
    this.setState({
      btnLoading: true,
    });
    AdminClusterStore.delCluster(organizationId, this.state.delId)
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
            } else {
              this.loadCluster(this.state.page, this.state.size);
            }
          })
        }
      })
  };

  getCluster = () => {
    const {
      AdminClusterStore,
      intl: { formatMessage },
    } = this.props;
    const { organizationId, type } = AppState.currentMenuType;
    const clusters = AdminClusterStore.getData;
    return _.map(clusters, c => (
      <Tooltip key={c.id} placement="bottom" title={c.upgrade ? <FormattedMessage id="cluster.status.update" /> : null}>
        <div className={`c7n-cls-card1 ${c.isActive ? 'c7n-cls-card-connect1' : ''}`}>
          <div className="c7n-cls-card-head">
            <div>
              <div className="c7n-cls-card-head-state">
                {c.isActive ? formatMessage({ id: 'user' }) : formatMessage({ id: 'noUser' })}
              </div>
              <i className="c7n-cls-card-head-state_after" />
            </div>
            {c.isDefault ?
              <div>
                <div className="c7n-cls-card-head-state2">
                  {formatMessage({id: 'admin.open'})}
                </div>
                <i className="c7n-cls-card-head-state_after2"/>
              </div>
            :<div>
                <div className="c7n-cls-card-head-state-no">
                  {formatMessage({id: 'admin.noOpen'})}
                </div>
                <i className="c7n-cls-card-head-state_after-no"/>
              </div>}
            <div className="c7n-cls-card-head-action">
              <Permission
                service={['devops-service.devops-cluster.update']}
                type={type}
                organizationId={organizationId}
              >
                <Tooltip title={<FormattedMessage id="cluster.edit" />}>
                  <Button
                    funcType="flat"
                    shape="circle"
                    onClick={this.showSideBar.bind(this, 'edit', c.id, c.name)}
                  >
                    <Icon type="mode_edit" />
                  </Button>
                </Tooltip>
              </Permission>
              <Permission
                service={['devops-service.devops-cluster.deleteCluster']}
                type={type}
                organizationId={organizationId}
              >
                <Tooltip title={<FormattedMessage id="cluster.del" />}>
                  <Button
                    funcType="flat"
                    shape="circle"
                    onClick={this.delClusterShow.bind(this, c.id, c.name)}
                  >
                    <Icon type="delete_forever" />
                  </Button>
                </Tooltip>
              </Permission>
            </div>
          </div>
          <div className="c7n-cls-card-content">
            <div className="c7n-cls-card-state">
              <div className="c7n-cls-icon-wrap">
                {c.isActive ? <Icon type="running" /> : <Icon type="disconnect" />}
              </div>
            </div>
            <div className="c7n-cls-card-des">
              <div className="c7n-cls-card-des-name">{c.name}</div>
              <div className="c7n-cls-card-des-des" title={c.description}>{c.description}</div>
            </div>
          </div>
        </div>
      </Tooltip>))
  };

  getFormContent = () => {
    const {
      AdminClusterStore,
      intl: { formatMessage },
      form: { getFieldDecorator },
    } = this.props;
    const {
      getClsData: clsData,
      getShell: shell,
      getTagKeys: tagKeys,
      getTableLoading: tableLoading,
      getSelectedRk,
    } = AdminClusterStore;
    const { copyMsg, token, sideType, checked, createSelectedRowKeys, createSelected, selectedRowKeys } = this.state;
    const rowCreateSelection = {
      selectedRowKeys: createSelectedRowKeys,
      onChange: this.onCreateSelectChange,
    };
    const rowSelection = {
      selectedRowKeys: _.map(tagKeys, s => s.id),
      onChange: this.onSelectChange,
    };
    const tagCreateDom = _.map(createSelected, t => <Tag className="c7n-env-tag" key={t.id}>{t.name} {t.code}</Tag>);
    const tagDom = _.map(tagKeys, (t) => {
      if (t) {
        return <Tag className="c7n-env-tag" key={t.id}>{t.name} {t.code}</Tag>;
      }
      return null;
    });

    const selectBefore = (
      <Select defaultValue="N-" style={{ width: 80 }} >
        <Option value="N-">N</Option>
        <Option value="P-">P</Option>
        <Option value="T-">T</Option>
        <Option value="F-">F</Option>
      </Select>
    );

    const prefixSelector = getFieldDecorator('prefix', {
      initialValue: 'N-',
    })(
      <Select style={{ width: 70 }}>
        <Option value="N-">N-</Option>
        <Option value="P-">P-</Option>
      </Select>
    );

    const columns = [{
      key: 'name',
      title: formatMessage({ id: 'cluster.project.name' }),
      dataIndex: 'name',
    }, {
      key: 'code',
      title: formatMessage({ id: 'cluster.project.code' }),
      dataIndex: 'code',
    }];

    let formContent = null;
    switch ( sideType ) {
      case 'create':
        formContent = (<div>
          <Form className="c7n-sidebar-form" layout="vertical">
            <FormItem
              {...formItemLayout}
            >
              {getFieldDecorator('code', {
                rules: [{
                  required: true,
                  message: formatMessage({ id: 'required' }),
                }, {
                  validator: this.checkCode,
                }],
              })(
                <Input
                  maxLength={30}
                  label={<FormattedMessage id="cluster.code" />}
                />,
              )}
            </FormItem>
            <div>
            <FormItem
            >
              {getFieldDecorator('name', {
                rules: [{
                  required: true,
                  message: formatMessage({ id: 'required' }),
                }, {
                  pattern: /^N|P|T|F/,
                  message: formatMessage({ id: `admin.cluster.checkName` }),
                }, {
                  validator: this.checkName,
                }],
              })(
                  <Input
                    before={selectBefore}
                    maxLength={10}
                    label={<FormattedMessage id="admin.cluster.name" />}
                  />,
              )}
            </FormItem>
            </div>
            <FormItem
              {...formItemLayout}
              label={<FormattedMessage id="envPl.form.description" />}
            >
              {getFieldDecorator('description')(
                <TextArea
                  autosize={{ minRows: 2 }}
                  maxLength={30}
                  label={<FormattedMessage id="cluster.des" />}
                />,
              )}
            </FormItem>
            <FormItem
              {...formItemLayout}
            >
              {getFieldDecorator('isDefault', {
                initialValue: 1,
              })(
                <RadioGroup >
                  {<FormattedMessage id="admin.cluster.open" />}<br/>
                  <Radio value={1}>开通</Radio>
                  <Radio value={0}>关闭</Radio>
                </RadioGroup>
              )}
            </FormItem>
            <FormItem
              {...formItemLayout}
            >
              {getFieldDecorator('isActive', {
                initialValue: 1,
              })(
                <RadioGroup >
                  {<FormattedMessage id="admin.cluster.user" />}<br/>
                  <Radio value={1}>可用</Radio>
                  <Radio value={0}>不可用</Radio>
                </RadioGroup>
              )}
            </FormItem>
          </Form>
        </div>);
        break;
      case 'token':
        formContent = (<div className="c7n-env-token c7n-sidebar-form">
          <div className="c7n-env-shell-wrap">
            <TextArea
              disabled={true}
              className="c7n-input-readOnly"
              autosize
              copy="true"
              readOnly
              value={token || ''}
            />
          </div>
        </div>);
        break;
      case 'key':
        formContent = (<div className="c7n-env-token c7n-sidebar-form">
          <div className="c7n-env-shell-wrap">
            <TextArea
              label={<FormattedMessage id="envPl.token" />}
              className="c7n-input-readOnly"
              autosize
              copy="true"
              readOnly
              value={shell || ''}
            />
          </div>
        </div>);
        break;
      case 'edit':
        formContent = (<div>
          <Form className="c7n-sidebar-form">
            <FormItem
              {...formItemLayout}
            >
              {getFieldDecorator('name', {
                rules: [{
                  required: true,
                  message: formatMessage({ id: 'required' }),
                }, {
                  validator: this.checkName,
                }],
                initialValue: clsData ? clsData.name : '',
              })(
                <Input
                  maxLength={10}
                  label={<FormattedMessage id="cluster.name" />}
                />,
              )}
            </FormItem>
            <FormItem
              {...formItemLayout}
            >
              {getFieldDecorator('description', {
                initialValue: clsData ? clsData.description : '',
              })(
                <TextArea
                  autosize={{ minRows: 2 }}
                  maxLength={30}
                  label={<FormattedMessage id="cluster.des" />}
                />,
              )}
            </FormItem>
            <FormItem
              {...formItemLayout}
            >
              {getFieldDecorator('isDefault', {
                initialValue: clsData ? clsData.isDefault : 1,
              })(
                <RadioGroup >
                  <Radio value={1}>开通</Radio>
                  <Radio value={0}>关闭</Radio>
                </RadioGroup>
              )}
            </FormItem>
            <FormItem
              {...formItemLayout}
            >
              {getFieldDecorator('isActive', {
                initialValue: clsData ? clsData.isActive : 1,
              })(
                <RadioGroup >
                  <Radio value={1}>可用</Radio>
                  <Radio value={0}>不可用</Radio>
                </RadioGroup>
              )}
            </FormItem>
          </Form>
        </div>);
        break;
      default:
        formContent = null;
    }
    return formContent;
  };

  /**
   * 提交数据
   * @param e
   */
  handleSubmit = (e) => {
    e.preventDefault();
    const { AdminClusterStore } = this.props;
    const { organizationId, sideType, checked, createSelectedRowKeys } = this.state;
    const tagKeys = AdminClusterStore.getTagKeys;
    this.setState({
      submitting: true,
    });
    if (sideType === 'create') {
      this.props.form.validateFieldsAndScroll((err, data) => {
        if (!err) {
          this.setState({ clsName: data.name });
          data.skipCheckProjectPermission = checked;
          data.projects = createSelectedRowKeys;
          AdminClusterStore.createCluster(organizationId, data)
            .then((res) => {
              if (res) {
                if (res && res.failed) {
                  this.setState({
                    submitting: false,
                  });
                  Choerodon.prompt(res.message);
                } else {
                  this.loadCluster();
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
      const id = AdminClusterStore.getClsData.id;
      const proIds = _.map(tagKeys, t => t.id);
      this.props.form.validateFieldsAndScroll((err, data) => {
        if (!err) {
          data.skipCheckProjectPermission = checked;
          data.projects = proIds;
          AdminClusterStore.updateCluster(organizationId, id, data)
            .then((res) => {
              if (res && res.failed) {
                this.setState({
                  submitting: false,
                });
                Choerodon.prompt(res.message);
              } else {
                AdminClusterStore.setSelectedRk([]);
                AdminClusterStore.setTagKeys([]);
                this.loadCluster();
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
    const { AdminClusterStore } = this.props;
    if (this.state.sideType === 'token') {
      this.loadCluster();
    }
    this.setState({ checked: true, show: false, createSelectedRowKeys: [], createSelected: [], selectedRowKeys: false });
    AdminClusterStore.setClsData(null);
    AdminClusterStore.setSelectedRk([]);
    AdminClusterStore.setInfo({
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
    const { AdminClusterStore } = this.props;
    const { organizationId } = AppState.currentMenuType;
    if (sideType === 'create') {
      this.setState({ checked: true });
      AdminClusterStore.loadPro(organizationId, null, 0, HEIGHT <= 900 ? 10 : 15);
    } else if (sideType === 'edit') {
      AdminClusterStore.loadClsById(organizationId, id)
        .then((data) => {
          if (data && data.failed) {
            Choerodon.prompt(data.message);
          } else {
            this.setState({ checked: data.skipCheckProjectPermission });
          }
        });
      AdminClusterStore.loadPro(organizationId, id, 0, HEIGHT <= 900 ? 10 : 15);
      AdminClusterStore.loadTagKeys(organizationId, id);
    } else if (sideType === 'key') {
      AdminClusterStore.loadShell(organizationId, id);
    }
    this.setState({ sideType, show: true, clsName: name });
  };

  /**
   * 根据type显示右侧框标题
   * @returns {*}
   */
  showTitle = (sideType) => {
    if (sideType === 'create') {
      return <FormattedMessage id="admin.cluster.create" />;
    } else if (sideType === 'edit') {
      return <FormattedMessage id="admin.cluster.edit" />;
    } else if (sideType === 'permission') {
      return <FormattedMessage id="admin.cluster.authority" />;
    } else {
      return <FormattedMessage id="admin.cluster.active" />;
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
      return formatMessage({ id: 'create' });
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
  };

  render() {
    const { type, organizationId, name } = AppState.currentMenuType;
    const { show, sideType, submitting, showDel, btnLoading, clsName } = this.state;
    const {
      AdminClusterStore,
      intl: { formatMessage },
    } = this.props;
    const {
      getClsPageInfo: { current, total, pageSize },
      getLoading: loading,
      getData: clusters,
    } = AdminClusterStore;
    const showBtns = (sideType === 'create' || sideType === 'edit' || sideType === 'permission');
    const titleName = sideType === 'create' ? name : clsName;

    return (
      <Page
        service={[
          'devops-service.admin-cluster.listCluster',
          'devops-service.admin-cluster.createCluster',
          'devops-service.admin-cluster.updateCluster',
          'devops-service.admin-cluster.deleteCluster',
          'devops-service.admin-cluster.loadClsById',
        ]}
        className="c7n-region"
      >
        <Header title={<FormattedMessage id="cluster.head" />}>
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
              <FormattedMessage id="admin.cluster.create" />
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
              onClick={this.handleRefresh1}
            >
              <FormattedMessage id="refresh" />
            </Button>
          </Permission>
        </Header>
        <Content code={clusters && clusters.length ? 'admin.cluster' : ''} values={{ name }}>
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
            <Content code={`admin.cluster.${sideType}`} values={{ clsName: titleName }} className="sidebar-content">
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
          </React.Fragment> : <Card title={formatMessage({ id: 'cluster.create' })} className="c7n-depPi-empty-card">
            <div className="c7n-noEnv-content">
              <FormattedMessage id="cluster.noData.text1" /><br/>
              <FormattedMessage id="cluster.noData.text2" /><br/>
              <FormattedMessage id="cluster.noData.text3" />
              <a
                href={formatMessage({ id: 'cluster.link' })}
                rel="nofollow me noopener noreferrer"
                target="_blank"
              >
                <FormattedMessage id="depPl.more" /><Icon type="open_in_new" />
              </a>
              <div className="c7n-cluster-notice">
                <Icon type="error" />
                <FormattedMessage id="cluster.notice" />
              </div>
            </div>
            <Button
              type="primary"
              funcType="raised"
              onClick={this.showSideBar.bind(this, 'create')}
            >
              <FormattedMessage id="cluster.create" />
            </Button>
          </Card>)}
        </Content>
        <Modal
          className="c7n-cls-del-modal"
          title={<FormattedMessage id="cluster.del.title" values={{ clsName }} />}
          visible={showDel}
          onOk={this.delCluster}
          closable={false}
          footer={[
            <Button key="back"
                    onClick={() => this.setState({ delId: null, showDel: false })}
                    disabled={btnLoading}
            >
              <FormattedMessage id="cancel" />
            </Button>,
            <Button key="submit" type="danger" loading={btnLoading} onClick={this.delCluster}>
              <FormattedMessage id="admin.cluster.del.confirm" />
            </Button>,
          ]}
        >
        </Modal>
      </Page>
    );
  }
}

export default Form.create({})(withRouter(injectIntl(AdminCluster)));
