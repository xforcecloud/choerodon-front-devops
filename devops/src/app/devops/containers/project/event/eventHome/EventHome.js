import React, { Component } from 'react';
import { observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { Table, Button, Form, Tooltip, Modal, Select } from 'choerodon-ui';
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

@commonComponent('EventStore')
@observer
class EventHome extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      openRemove: false,
      submitting: false,
      show: false,
    };
  }

  componentDidMount() {
    const { id: projectId } = AppState.currentMenuType;
    EnvOverviewStore.loadActiveEnv(projectId)
      .then((env) => {
        if (env.length) {
          const envId = EnvOverviewStore.getTpEnvId;
          if (envId) {
            // 这个方法定义在 commonComponent装饰器中
            this.loadAllData(15);
          }
        }
      })
  }



  /**
   * 环境选择
   * @param value
   */
  handleEnvSelect = (value) => {
    EnvOverviewStore.setTpEnvId(value);
    this.loadAllData(value);
  };

  render() {
    const { EventStore, intl: { formatMessage } } = this.props;
    const data = EventStore.getAllData;
    const envData = EnvOverviewStore.getEnvcard;
    const envId = EnvOverviewStore.getTpEnvId;
    const envState = envData.length
      ? envData.filter(d => d.id === Number(envId))[0] : { connect: false };
    const { filters, sort: { columnKey, order } } = EventStore.getInfo;
    const { type, id: projectId, organizationId: orgId, name } = AppState.currentMenuType;
    const columns = [{
      title: formatMessage({ id: 'event.kind_name' }),
      key: 'name',
      width: '25%',
      dataIndex: 'name',
      sorter: true,
      sortOrder: columnKey === 'name' && order,
      filters: [],
      filteredValue: filters.name || [],
      render: (text, record) => <div className="c7n-network-service">
        <MouserOverWrapper text={text} width={0.16}>{text}</MouserOverWrapper>
        <StatusIcon
          name=""
          status={record.commandStatus || ''}
          error={record.error || ''}
        />
      </div>,
    }, {
      title: formatMessage({ id: 'event.kind' }),
      key: 'domain',
      filters: [],
      filteredValue: filters.domain || [],
      dataIndex: 'domain',
    }, {
      title: formatMessage({ id: 'event.nameSpace' }),
      key: 'envName',
      sorter: true,
      sortOrder: columnKey === 'envName' && order,
      filters: [],
      filteredValue: filters.envName || [],
      render: record => (
        <React.Fragment>
          { record.envStatus ? <Tooltip title={<FormattedMessage id="connect" />}>
            <span className="env-status-success" />
          </Tooltip> : <Tooltip title={<FormattedMessage id="disconnect" />}>
            <span className="env-status-error" />
          </Tooltip> }
          {record.envName}
        </React.Fragment>
      ),
    }, {
      title: formatMessage({ id: 'event.message' }),
      className: 'c7n-network-col',
      key: 'path',
      filters: [],
      filteredValue: filters.path || [],
      render: record => _.map(record.pathList, router => (<div className="c7n-network-col_border" key={`${record.id}-${router.path}`}>
        <span>{router.path}</span>
      </div>)),
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
        { EventStore.isRefresh ? <LoadingBar display /> : (envData && envData.length && envId ? <React.Fragment>
          <Header title={formatMessage({ id: 'event.header.title' })}>
            <Select
              className={`${envId? 'c7n-header-select' : 'c7n-header-select c7n-select_min100'}`}
              dropdownClassName="c7n-header-env_drop"
              placeholder={formatMessage({ id: 'envoverview.noEnv' })}
              value={envData && envData.length ? envId : undefined}
              disabled={envData && envData.length === 0}
              onChange={this.handleEnvSelect}
            >
              {_.map(envData,  e => (
                <Option key={e.id} value={e.id} disabled={!e.permission} title={e.name}>
                  <Tooltip placement="right" title={e.name}>
                    <span className="c7n-ib-width_100">
                      {e.connect ? <span className="c7n-ist-status_on" /> : <span className="c7n-ist-status_off" />}
                      {e.name}
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
                onClick={this.handleRefresh}
              >
                <i className="icon-refresh icon" />
                <FormattedMessage id="refresh" />
              </Button>
            </Permission>
          </Header>
          <Content code="event" values={{ name }}>
            <Table
              filterBarPlaceholder={formatMessage({ id: 'filter' })}
              loading={EventStore.loading}
              onChange={this.tableChange}
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
