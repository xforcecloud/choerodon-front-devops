import React, { Component, Fragment } from 'react';
import { Table, Button, Input, Form, Modal, Tooltip, Select, Icon, Popover,Switch ,Radio, Popconfirm,message} from 'choerodon-ui';
import { observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { Content, Header, Page, Permission, stores } from 'choerodon-front-boot';
import _ from 'lodash';
import { injectIntl, FormattedMessage } from 'react-intl';
import { commonComponent } from '../../../../components/commonFunction';
import LoadingBar from '../../../../components/loadingBar';
import './Apply.scss';
import '../../../main.scss';
import MouserOverWrapper from '../../../../components/MouseOverWrapper';

const { AppState } = stores;
const { Sidebar } = Modal;
const { Option } = Select;
const RadioGroup = Radio.Group;
const FormItem = Form.Item;
const RadioButton = Radio.Button;
const { TextArea } = Input;
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

@commonComponent('ApplyStore')
@observer
class Apply extends Component {


  constructor(props) {
    const menu = AppState.currentMenuType;
    const { location: { state } } = props.history;
    super(props);
    this.state = {
      page: 0,
      id: '',
      projectId: menu.id,
      orgId:'',
      show: state && state.show,
      type: state && state.modeType,
      submitting: false,
      visible: false,
      clusterId:'',
      check:"0",
    };
  }

  componentDidMount() {
    this.loadAllData(0,this.state.page);
  }

  showModal = (record) => {
    this.setState({clusterId:record.clusterId,orgId:record.organizationId});
    this.setState({
      visible: true,
    });
  }

  handleOk = (e) => {
    const { clusterId,orgId } = this.state;
    const { ApplyStore } = this.props;
    this.setState({check:"2"});
    this.props.form.validateFieldsAndScroll((err, data) => {
      if (!err) {
        ApplyStore.reject(clusterId,orgId,data.reason).then((data) => {
          this.setState({
            clusterId:'',
            orgId:'',
            visible: false,
          });
          this.loadAllData(2,this.state.page);
        })
      }
    });
  }

  handleCancel = (e) => {
    this.setState({
      visible: false,
    });
  }


  getColumn = () => {
    const { ApplyStore, intl: { formatMessage },form: { getFieldDecorator } } = this.props;
    const { type, id: projectId, organizationId: orgId } = AppState.currentMenuType;
    const { filters, sort: { columnKey, order } } = ApplyStore.getInfo;
    return [{
      title: <FormattedMessage id="apply.cluster.orgName" />,
      dataIndex: 'organizationName',
      key: 'organizationName',
      filters: [],
      filteredValue: filters.organizationName || [],
      render: text => (<MouserOverWrapper text={text} width={0.2}>
        {text}
      </MouserOverWrapper>),
    }, {
      title: <FormattedMessage id="apply.cluster.name" />,
      dataIndex: 'clusterName',
      key: 'clusterName',
      filters: [],
      filteredValue: filters.clusterName || [],
    }, {
      title: <FormattedMessage id="apply.cluster.description" />,
      dataIndex: 'clusterDescription',
      key: 'clusterDescription',
      filters: [],
      filteredValue: filters.clusterDescription || [],
    }, {
      title: <FormattedMessage id="apply.cluster.reason" />,
      dataIndex: 'description',
      key: 'description',
      filters: [],
      filteredValue: filters.description || [],
      render: text => (<MouserOverWrapper text={text} width={0.25}>
        {text}
      </MouserOverWrapper>),
    },{
      title: <FormattedMessage id="apply.cluster.status" />,
      dataIndex: 'isConnected',
      key: 'isConnected',
      filters: [{
        text: formatMessage({ id: 'apply.untreated' }),
        value: 0,
      }, {
        text: formatMessage({ id: 'apply.pass' }),
        value: 1,
      }, {
        text: formatMessage({ id: 'apply.reject' }),
        value: 2,
      }],
      filteredValue: filters.isConnected || [],
      render: this.getAppStatus,
    }, {
      title: <FormattedMessage id="apply.cluster.operation" />,
      align: 'right',
      width: 104,
      key: 'action',
      render: record => (
        <Fragment>
          <Fragment>
            {record.isConnected == 0 ? <Tooltip placement="bottom" title={<FormattedMessage id="reject" />}>
              <Popconfirm title={<FormattedMessage id="confirm.reject" />} onConfirm={() => this.handleReject(record)}>
              <Button
                type="danger"
                icon="cancel"
                shape="circle"
                size="small"
              />
              </Popconfirm>
            </Tooltip> : null}
            {record.isConnected == 0 ? <Tooltip
              placement="bottom"
              title={<Fragment> <FormattedMessage id="pass" /></Fragment>}
            ><Popconfirm title={<FormattedMessage id="confirm.pass" />} onConfirm={() => this.handlePass(record)}>
              <Button
                  type="primary"
                  icon="finished"
                  shape="circle"
                  size="small"
                  >
              </Button>
            </Popconfirm>
            </Tooltip> : null}
            </Fragment>
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
    if (record.isConnected == 1) {
      icon = 'check_circle';
      msg = 'pass';
      color = '#00bf96';
    } else if(record.isConnected == 2){
      icon = 'cancel';
      msg = 'reject';
      color = '#f44336';
    } else if(record.isConnected == 0){
      icon = 'remove_circle';
      msg = 'untreated';
      color = '#3A5FCD';
    }
    return (<span><Icon style={{ color, ...style }} type={icon} /><FormattedMessage id={`apply.${msg}`} /></span>);
  };

  onChange = (value) => {
    if (value.target.value == 1){
      this.setState({check:"1"});
      this.loadAllData(value.target.value,this.state.page);
    } else if(value.target.value == 2){
      this.setState({check:"2"});
      this.loadAllData(value.target.value,this.state.page);
    }else{
      this.setState({check:"0"});
      this.loadAllData(value.target.value,this.state.page);
    }

  }
  handleReject = (record) => {
    const { ApplyStore } = this.props;
    this.showModal(record);
  }

  handlePass = (record) => {
    const { ApplyStore } = this.props;
    ApplyStore.pass(record.clusterId,record.organizationId).then((datas) => {
      const res = this.handleProptError(datas);
      if (res == 'ok'){
        message.success('开通成功');
        this.setState({check:"1"});
        this.loadAllData(1,this.state.page);
      } else {
        message.error('开通失败: '+res);
      }
    });
  }



  /**
   * 处理刷新函数
   */
  handleRefresh1 = () => {
    const { ApplyStore } = this.props;
    this.setState({check:"0"});
    this.loadAllData(0,this.state.page);
  };

  /**
   * table 操作
   * @param pagination
   * @param filters
   * @param sorter
   * @param paras
   */
  tableChange1 = (pagination, filters, sorter, paras) => {
    const { ApplyStore } = this.props;
    ApplyStore.setInfo({ filters, sort: sorter, paras });
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
    this.loadAllData(0,this.state.page);
  };

  /**
   * 关闭操作框
   */
  hideSidebar = () => {
    const { ApplyStore } = this.props;
    ApplyStore.setSingleData(null);
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
    const { ApplyStore } = this.props;
    const { projectId } = this.state;
    if (type === 'create') {
      const record = {};
      this.setState({ show: true, type ,record});
    } else {
      this.setState({ show: true, type, id,record });
    }
  };

  render() {
    const { type, id: projectId, organizationId: orgId, name } = AppState.currentMenuType;
    const {
      ApplyStore: {
        getAllData: serviceData,
        getInfo: { paras },
        isRefresh,
        loading,
      },
      intl: { formatMessage },
      form: { getFieldDecorator },
    } = this.props;
    const { type: modeType, show, submitting, openRemove, name: appName, id,record} = this.state;
    const formContent = (<Form layout="vertical" className="c7n-sidebar-form">
      <FormItem
        {...formItemLayout}
      >
        {getFieldDecorator('reason')(
          <TextArea
            autosize={{ minRows: 3 }}
            maxLength={30}
            label={<FormattedMessage id="reject.reason" />}
          />,
        )}
      </FormItem>
    </Form>);
    return (
      <Page
        className="c7n-region c7n-app-wrapper"
        service={[
                  'devops-service.apply-management.listCluster',
                  'devops-service.apply-management.reject',
                  'devops-service.apply-management.pass',
        ]}
      >
        { isRefresh ? <LoadingBar display /> : <Fragment>
          <Header title={<FormattedMessage id="apply.head" />}>
            <div>
              <RadioGroup value={this.state.check}  onChange={this.onChange} >
                <RadioButton value="0"><FormattedMessage id="apply.untreated" /></RadioButton>
                <RadioButton value="1"><FormattedMessage id="apply.pass" /></RadioButton>
                <RadioButton value="2"><FormattedMessage id="apply.reject" /></RadioButton>
              </RadioGroup>
            </div>
            <Button
              icon="refresh"
              onClick={this.handleRefresh1}
            >
              <FormattedMessage id="refresh" />
            </Button>
          </Header>
          <Content code="apply" values={{ name }}>
            <Table
              filterBarPlaceholder={formatMessage({ id: 'filter' })}
              loading={loading}
              onChange={this.tableChange1}
              columns={this.getColumn()}
              dataSource={serviceData.slice()}
              rowKey={record => record.organizationId+""+record.clusterId}
              filters={paras.slice()}
            />
          </Content>
        </Fragment>}

        <Modal
          title={<FormattedMessage id="reject.reason.input" />}
          visible={this.state.visible}
          onOk={this.handleOk}
          onCancel={this.handleCancel}
          width={550}
        >
          <Content className="sidebar-content">
            {formContent}
          </Content>
        </Modal>
      </Page>
    );
  }
}

export default Form.create({})(withRouter(injectIntl(Apply)));
