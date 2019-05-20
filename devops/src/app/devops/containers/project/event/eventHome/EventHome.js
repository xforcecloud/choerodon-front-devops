import React, { Component,moment } from 'react';
import { observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { Table, Button, Form, Tooltip, Modal, Select, Switch, Radio,Icon  } from 'choerodon-ui';
import { injectIntl, FormattedMessage } from 'react-intl';
import { Content, Header, Page, Permission, stores } from 'choerodon-front-boot';
import _ from 'lodash';
import LoadingBar from '../../../../components/loadingBar';
import './EventHome.scss';
import '../../../main.scss';
import { commonComponent } from '../../../../components/commonFunction';
import StatusIcon from '../../../../components/StatusIcon';
import MouserOverWrapper from '../../../../components/MouseOverWrapper/MouserOverWrapper';
import EnvOverviewStore from '../../../../stores/project/envOverview';
import DepPipelineEmpty from "../../../../components/DepPipelineEmpty/DepPipelineEmpty";

const { AppState } = stores;
const { Option } = Select;
const RadioGroup = Radio.Group;

@commonComponent('EventStore')
@observer
class EventHome extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      openRemove: false,
      submitting: false,
      show: false,
      checked:true,
    };
  }

  componentDidMount() {
    const { id: projectId } = AppState.currentMenuType;
    const {EventStore} = this.props;
    EventStore.loadEnvCluster(projectId);
    EnvOverviewStore.loadActiveEnvCluster(projectId)
      .then((env) => {
        if (env.length) {
          const envId = EnvOverviewStore.getTpEnvId;
          const envCode = EnvOverviewStore.getTpEnvCode;
          const envCluster = EnvOverviewStore.getTpEnvCluster;
          EventStore.loadEventState(envCluster,envCode);
          const organizationId = AppState.currentMenuType.organizationId;
          let cc = [organizationId, envCode];
          if (envCode) {
            // 这个方法定义在 commonComponent装饰器中
            this.loadAllData(cc);
          }
        }
      })
  }

  reload = () =>{
    const { id: projectId } = AppState.currentMenuType;
    const {EventStore} = this.props;
    EnvOverviewStore.loadActiveEnvCluster(projectId)
      .then((env) => {
        if (env.length) {
          const envId = EnvOverviewStore.getTpEnvId;
          const envCode = EnvOverviewStore.getTpEnvCode;
          const envCluster = EnvOverviewStore.getTpEnvCluster;
          EventStore.loadEventState(envCluster,envCode);
          const organizationId = AppState.currentMenuType.organizationId;
          let cc = [organizationId, envCode];
          if (envCode) {
            // 这个方法定义在 commonComponent装饰器中
            this.loadAllData(cc);
          }
        }
      })
  }

  componentWillUnmount() {
    const { EventStore } = this.props;
    EventStore.setPageInfo({ number: 0, totalElements: 0, size: 30 });
  }

  /**
   * 处理刷新函数
   */
  handleRefresh1 = () => {
    const { id: projectId } = AppState.currentMenuType;
    EnvOverviewStore.loadActiveEnv(projectId)
      .then((env) => {
        if (env.length) {
          const envId = EnvOverviewStore.getTpEnvId;
          const envCode = EnvOverviewStore.getTpEnvCode;
          const organizationId = AppState.currentMenuType.organizationId;
          let cc = [organizationId, envCode];
          if (envCode) {
            // 这个方法定义在 commonComponent装饰器中
            this.loadAllData(cc);
          }
        }
      })
  };

  onChange = (checked) => {
    const { EventStore } = this.props;
    const envCluster = EnvOverviewStore.getTpEnvCluster;
    const envCode = EnvOverviewStore.getTpEnvCode;
    const orgId = AppState.currentMenuType.organizationId;
     if(!checked){
       const config = {
         "devopsClusterId": envCluster,
         "namespace": envCode,
         "orgId": orgId,
         "type": 0,
       }
       EventStore.updateStatus(config);
       this.reload();
     } else {
       const config = {
         "devopsClusterId": envCluster,
         "namespace": envCode,
         "orgId": orgId,
         "type": 1,
       }
       EventStore.updateStatus(config);
       this.reload();
     }
  };

  /**
   * table 操作
   * @param pagination
   * @param filters
   * @param sorter
   * @param paras
   */
  tableChange1 = (pagination, filters, sorter, paras) => {
    const { EventStore } = this.props;
    const { id } = AppState.currentMenuType;
    EventStore.setInfo({ filters, sort: sorter, paras });
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
    const envId = EnvOverviewStore.getTpEnvId;
    const envCode = EnvOverviewStore.getTpEnvCode;
    const organizationId = AppState.currentMenuType.organizationId;
    let cc = [organizationId, envCode];
    EventStore.loadData(
      false,
      id,
      cc,
      page,
      pagination.pageSize,
      sort,
      postData
    );
  };


  /**
   * 环境选择
   * @param value
   */
  handleEnvSelect = (value) => {
    EnvOverviewStore.setTpEnvId(value);
    EnvOverviewStore.setTpEnvCode(value)
    const organizationId = AppState.currentMenuType.organizationId;
    let cc = [organizationId, value];
    this.loadAllData(cc);
  };

  format = (data) =>{
    for (var i=0;i<data.length;i++){
        var time = new Date(data[i].createtime);
        data[i].createtime = this.dateFtt("yyyy-MM-dd hh:mm:ss",time);
    }
  }

   dateFtt = (fmt,date) => { //author: meizz
    var o = {
      "M+" : date.getMonth()+1,                 //月份
      "d+" : date.getDate(),                    //日
      "h+" : date.getHours(),                   //小时
      "m+" : date.getMinutes(),                 //分
      "s+" : date.getSeconds(),                 //秒
      "q+" : Math.floor((date.getMonth()+3)/3), //季度
      "S"  : date.getMilliseconds(),            //毫秒
    };
    if(/(y+)/.test(fmt))
      fmt=fmt.replace(RegExp.$1, (date.getFullYear()+"").substr(4 - RegExp.$1.length));
    for(var k in o)
      if(new RegExp("("+ k +")").test(fmt))
        fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)));
    return fmt;
  }

  render() {
    const { EventStore, intl: { formatMessage } } = this.props;
    const data = EventStore.getAllData;
    const envData = EnvOverviewStore.getEnvcard;
    const envId = EnvOverviewStore.getTpEnvId;
    const envCode = EnvOverviewStore.getTpEnvCode;
    const eventState = EventStore.getEventState;
    const result = eventState.result;
    const status = result ? result.status : undefined;
    const { filters, sort: { columnKey, order } } = EventStore.getInfo;
    const { type, id: projectId, organizationId: orgId, name } = AppState.currentMenuType;
    const columns = [ {
      title: formatMessage({ id: 'event.kind_name' }),
      key: 'kindName',
      filters: [],
      filteredValue: filters.kindName || [],
      dataIndex: 'kindName',
    }, {
      title: formatMessage({ id: 'event.kind' }),
      key: 'kind',
      filters: [],
      filteredValue: filters.domain || [],
      dataIndex: 'kind',
    }, {
      title: formatMessage({ id: 'event.message' }),
      width:'25%',
      key: 'message',
      filters: [],
      filteredValue: filters.message || [],
      dataIndex: 'message',
    },{
      title: formatMessage({ id: 'event.createTime' }),
      key: 'createtime',
      filters: [],
      filteredValue: filters.createtime || [],
      dataIndex: 'createtime',
      render: text => this.dateFtt("yyyy-MM-dd hh:mm:ss",new Date(text)),
    },{
      title: formatMessage({ id: 'event.receiveTime' }),
      key: 'receivetime',
      filters: [],
      filteredValue: filters.receivetime || [],
      dataIndex: 'receivetime',
      render: text => this.dateFtt("yyyy-MM-dd hh:mm:ss",new Date(text)),
    }, {
      title: formatMessage({ id: 'event.count' }),
      key: 'count',
      filters: [],
      filteredValue: filters.count || [],
      dataIndex: 'count',
    }, {
      title: formatMessage({ id: 'event.type' }),
      key: 'type',
      filters: [],
      filteredValue: filters.type || [],
      dataIndex: 'type',
    }];

    return (
      <Page
        className="c7n-region c7n-domain-wrapper"
        service={[
          'devops-service.devops-ingress.create',
          'devops-service.devops-ingress.checkDomain',
          'devops-service.devops-ingress.checkName',
          'devops-service.devops-ingress.pageByOptions',
          'devops-service.devops-ingress.queryDomainId',
          'devops-service.devops-ingress.update',
          'devops-service.devops-ingress.delete',
          'devops-service.devops-service.listByEnvId',
          'devops-service.devops-environment.listByProjectIdAndActive',
        ]}
      >
        { EventStore.isRefresh ? <LoadingBar display /> : (envData && envData.length && envCode ? <React.Fragment>
          <Header title={formatMessage({ id: 'event.header.title' })}>
            <Select
              className={`${envCode? 'c7n-header-select' : 'c7n-header-select c7n-select_min100'}`}
              dropdownClassName="c7n-header-env_drop"
              placeholder={formatMessage({ id: 'envoverview.noEnv' })}
              value={envData && envData.length ? envCode : undefined}
              disabled={envData && envData.length === 0}
              onChange={this.handleEnvSelect}
            >
              {_.map(envData,  e => (
                <Option key={e.code} value={e.code} disabled={!e.permission} title={e.code}>
                  <Tooltip placement="right" title={e.name}>
                    <span className="c7n-ib-width_100">
                      {e.connect ? <span className="c7n-ist-status_on" /> : <span className="c7n-ist-status_off" />}
                      {e.code}
                    </span>
                  </Tooltip>
                </Option>))}
            </Select>
            <Permission
              service={['devops-service.devops-ingress.pageByOptions']}
              type={type}
              projectId={projectId}
              organizationId={orgId}
            >
              <Button
                funcType="flat"
                onClick={this.handleRefresh1}
              >
                <i className="icon-refresh icon" />
                <FormattedMessage id="refresh" />
              </Button>
            </Permission>
            <Permission
              service={['devops-service.devops-ingress.pageByOptions']}
              type={type}
              projectId={projectId}
              organizationId={orgId}
            ><br/>
              <Switch checkedChildren="开" unCheckedChildren="关"   checked={status?true:false}  onChange={this.onChange}/>

            </Permission>
          </Header>
          <Content code="event" values={{ name }}>
            <Table
              filterBarPlaceholder={formatMessage({ id: 'filter' })}
              loading={EventStore.loading}
              onChange={this.tableChange1}
              pagination={EventStore.pageInfo}
              columns={columns}
              dataSource={data}
              rowKey={record => record.id}
            />

          </Content>
        </React.Fragment> : <DepPipelineEmpty title={formatMessage({ id: 'event.header.title' })} type="env" />)}
      </Page>
    );
  }
}

export default Form.create({})(withRouter(injectIntl(EventHome)));
