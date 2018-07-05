import React, { Component } from 'react';
import { observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { Button, Tooltip, Modal, Table, Popover, Progress, Select } from 'choerodon-ui';
import { Content, Header, Page, Permission, stores } from 'choerodon-front-boot';
import classnames from 'classnames';
import { injectIntl, FormattedMessage } from 'react-intl';
import '../../../main.scss';
import './BranchHome.scss';
import CreateBranch from '../CreateBranch';
import TimePopover from '../../../../components/timePopover';
import EditBranch from '../editBranch';
import IssueDetail from '../issueDetail';
import '../commom.scss';


const { AppState } = stores;
const Option = Select.Option;

@observer
class BranchHome extends Component {
  constructor(props) {
    super(props);
    const menu = AppState.currentMenuType;
    this.state = {
      projectId: menu.id,
      appId: props.match.params.id,
      appName: props.match.params.name,
      page: 0,
      pageSize: 10,
    };
  }

  componentDidMount() {
    const { BranchStore, intl } = this.props;
    BranchStore.loadApps();
    // this.loadData();
  }
  componentWillUnmount() {
    clearTimeout(this.timer);
  }

  /**
   * 获取issue的options
   * @param s
   * @returns {*}
   */
  getOptionContent =(s) => {
    const { formatMessage } = this.props.intl;
    let mes = '';
    let icon = '';
    let color = '';
    switch (s.typeCode) {
      case 'story':
        mes = formatMessage({ id: 'branch.issue.story' });
        icon = 'turned_in';
        color = '#00bfa5';
        break;
      case 'bug':
        mes = formatMessage({ id: 'branch.issue.bug' });
        icon = 'bug_report';
        color = '#f44336';
        break;
      case 'issue_epic':
        mes = formatMessage({ id: 'branch.issue.epic' });
        icon = 'priority';
        color = '#743be7';
        break;
      case 'sub_task':
        mes = formatMessage({ id: 'branch.issue.subtask' });
        icon = 'relation';
        color = '#4d90fe';
        break;
      default:
        mes = formatMessage({ id: 'branch.issue.task' });
        icon = 'assignment';
        color = '#4d90fe';
    }
    return (<span>
      <Tooltip title={mes}>
        <div style={{ background: color }} className="branch-issue"><i className={`icon icon-${icon}`} /></div>
        <span className="branch-issue-content"><span>{s.issueNum}</span>{s.summary}</span>
      </Tooltip>
    </span>);
  };
  /**
   * 获取列表的icon
   * @param type 分支类型
   * @returns {*}
   */
  getIcon =(name) => {
    let icon;
    let type;
    if (name) {
      type = name.split('-')[0];
    }
    switch (type) {
      case 'feature':
        icon = <span className="c7n-branch-icon icon-feature">F</span>;
        break;
      case 'bugfix':
        icon = <span className="c7n-branch-icon icon-develop">B</span>;
        break;
      case 'hotfix':
        icon = <span className="c7n-branch-icon icon-hotfix">H</span>;
        break;
      case 'master':
        icon = <span className="c7n-branch-icon icon-master">M</span>;
        break;
      case 'release':
        icon = <span className="c7n-branch-icon icon-release">R</span>;
        break;
      default:
        icon = <span className="c7n-branch-icon icon-custom">C</span>;
    }
    return icon;
  };

  /**
   * 获取分支列表正文
   * @returns {*}
   */
  get tableBranch() {
    const { BranchStore, intl } = this.props;
    const menu = AppState.currentMenuType;
    const { type, organizationId: orgId } = menu;
    const branchColumns = [
      {
        title: <FormattedMessage id="branch.name" />,
        dataIndex: 'name',
        render: (text, record) => (<div>
          {this.getIcon(record.name)}
          <span>{record.name}</span>
        </div>),
      },
      {
        title: <FormattedMessage id="branch.commit" />,
        render: (text, record) => (<div>
          <div><span className="icon icon-point branch-column-icon" /><a href={record.commitUrl} target="_blank" rel="nofollow me noopener noreferrer"><span>{record.sha}</span></a></div>
          {record.commitUserName && record.commitUserUrl ? <Tooltip title={record.commitUserName}>
            <div className="branch-user-img" ><img src={record.commitUserUrl} alt="" width={'100%'} /></div>
          </Tooltip> : <div className="branch-user-img" >{record.commitUserName.slice(0, 1)}</div> }
          <div style={{ display: 'inline-block' }}>{record.commitComent}</div>
        </div>),
      },
      {
        title: <FormattedMessage id="branch.time" />,
        dataIndex: 'commit.committedDate',
        render: (text, record) => (<div>
          {record.createUserName && record.createUserUrl ? <Tooltip title={record.createUserName}>
            <div className="branch-user-img" >
              <img src={record.createUserUrl} alt="" width={'100%'} />
            </div>
          </Tooltip>
            : <React.Fragment>
              {record.createUserName ? <div className="branch-user-img" >{record.createUserName.slice(0, 1)}</div> : null}
            </React.Fragment> }
          <TimePopover content={record.createDate} style={{ display: 'inline-block' }} />
        </div>),
      },
      {
        title: <FormattedMessage id="branch.issue" />,
        dataIndex: 'commit.message',
        render: (text, record) => (<div>
          {record.typeCode ? this.getOptionContent(record) : null}
          <a onClick={this.showIssue.bind(this, record.issueId)} role={'none'}><Tooltip title={record.issueName}>{record.issueCode}</Tooltip></a>
        </div>),
      },
      {
        align: 'right',
        className: 'operateIcons',
        key: 'action',
        render: (test, record) => (
          <div>
            {record.name !== 'master' ?
              <React.Fragment>
                <Permission projectId={this.state.projectId} organizationId={orgId} type={type} service={['devops-service.devops-git.update']}>
                  <Tooltip
                    placement="bottom"
                    title={<FormattedMessage id="branch.edit" />}
                  >
                    <Button size={'small'} shape="circle" onClick={this.handleEdit.bind(this, record.name)}>
                      <span className="icon icon-mode_edit" />
                    </Button>
                  </Tooltip>
                </Permission>
                <Tooltip
                  placement="bottom"
                  title={<FormattedMessage id="branch.request" />}
                >
                  <a href={record.commitUrl && `${record.commitUrl.split('/commit')[0]}/merge_requests/new?merge_request[source_branch]=${record.name}&merge_request[target_branch]=master`} target="_blank" rel="nofollow me noopener noreferrer">
                    <Button size={'small'} shape="circle">
                      <span className="icon icon-wrap_text" />
                    </Button>
                  </a>
                </Tooltip>
                <Permission projectId={this.state.projectId} organizationId={orgId} type={type} service={['devops-service.devops-git.delete']}>
                  <Tooltip
                    placement="bottom"
                    title={<FormattedMessage id="delete" />}
                  >
                    <Button size={'small'} shape="circle" onClick={this.openRemove.bind(this, record.name)}>
                      <span className="icon icon-delete" />
                    </Button>
                  </Tooltip>
                </Permission>
              </React.Fragment>
              : null
            }
          </div>
        ),
      },
    ];
    const title = (<div>
      <span className="c7n-header-table">
        <FormattedMessage id="branch.list" />
      </span>
      <Popover
        // getPopupContainer={triggerNode => triggerNode.parentNode}
        overlayClassName="branch-popover"
        placement="rightTop"
        content={<section>
          <div>
            <span className="branch-popover-span span-master" />
            <div className="branch-popover-content">
              <p className="branch-popover-p">
                <FormattedMessage id="branch.master" />
              </p>
              <p>
                <FormattedMessage id="branch.masterDes" />
              </p>
            </div>
          </div>
          <div className="c7n-branch-block">
            <span className="branch-popover-span span-feature" />
            <div className="branch-popover-content">
              <p className="branch-popover-p">
                <FormattedMessage id="branch.feature" />
              </p>
              <p>
                <FormattedMessage id="branch.featureDes" />
              </p>
            </div>
          </div>
          <div className="c7n-branch-block" >
            <span className="branch-popover-span span-bugfix" />
            <div className="branch-popover-content">
              <p className="branch-popover-p">
                <FormattedMessage id="branch.bugfix" />
              </p>
              <p>
                <FormattedMessage id="branch.bugfixDes" />
              </p>
            </div>
          </div>
          <div className="c7n-branch-block">
            <span className="branch-popover-span span-release" />
            <div className="branch-popover-content">
              <p className="branch-popover-p">
                <FormattedMessage id="branch.release" />
              </p>
              <p>
                <FormattedMessage id="branch.releaseDes" />
              </p>
            </div>
          </div>
          <div className="c7n-branch-block">
            <span className="branch-popover-span span-hotfix" />
            <div className="branch-popover-content">
              <p className="branch-popover-p">
                <FormattedMessage id="branch.hotfix" />
              </p>
              <p>
                <FormattedMessage id="branch.hotfixDes" />
              </p>
            </div>
          </div>
          <div className="c7n-branch-block">
            <span className="branch-popover-span span-custom" />
            <div className="branch-popover-content">
              <p className="branch-popover-p">
                <FormattedMessage id="branch.custom" />
              </p>
              <p>
                <FormattedMessage id="branch.customDes" />
              </p>
            </div>
          </div>
        </section>}
      >
        <span className="icon icon-help branch-icon-help" />
      </Popover>
    </div>);
    return (
      <Table
        loading={BranchStore.loading}
        filterBar={false}
        className="c7n-branch-table"
        rowClassName="c7n-branch-tr"
        title={() => title}
        pagination={false}
        columns={branchColumns}
        dataSource={BranchStore.branchData.slice()}
        rowKey={record => record.id}
      />
    );
  }

  /**
   * 获取分支和标记列表
   */
  loadData = (value) => {
    const { projectId } = this.state;
    const { BranchStore } = this.props;
    BranchStore.setApp(value);
    BranchStore.setBranchData([]);
    BranchStore.loadBranchData(projectId, value);
  };
  /**
   * 修改相关联问题
   * @param name
   */
  handleEdit =(name) => {
    const { BranchStore } = this.props;
    BranchStore.loadBranchByName(this.state.projectId, BranchStore.app, name);
    BranchStore.setCreateBranchShow('edit');
  };

  /**
   * 刷新
   */
  handleRefresh =() => {
    const { BranchStore } = this.props;
    this.loadData(BranchStore.app);
  };

  /**
   * 创建分支的弹框
   */
  showSidebar = () => {
    const { BranchStore } = this.props;
    BranchStore.loadTagData(this.state.projectId, BranchStore.app);
    BranchStore.setCreateBranchShow('create');
  };

  showIssue =(id) => {
    const { BranchStore } = this.props;
    BranchStore.loadIssueById(this.state.projectId, id);
    BranchStore.setCreateBranchShow('detail');
  };

  /**
   * 关闭sidebar
   */
  hideSidebar = () => {
    const { BranchStore } = this.props;
    BranchStore.setCreateBranchShow(false);
    this.loadData(BranchStore.app);
  };
  /**
   * 打开删除框
   * @param name
   */
  openRemove = (name) => {
    this.setState({ visible: true, name });
  };
  /**
   * 关闭删除框
   */
  closeRemove = () => {
    this.setState({ visible: false });
  };

  /**
   * 删除数据
   */
  handleDelete = () => {
    const { BranchStore } = this.props;
    const { name } = this.state;
    const menu = AppState.currentMenuType;
    const organizationId = menu.id;
    BranchStore.deleteData(organizationId, BranchStore.app, name).then((data) => {
      this.loadData(BranchStore.app);
      this.closeRemove();
    }).catch((error) => {
      Choerodon.handleResponseError(error);
    });
  };

  render() {
    const { BranchStore, intl } = this.props;
    const menu = AppState.currentMenuType;
    const apps = BranchStore.apps.slice();
    return (
      <Page
        className="c7n-region c7n-branch"
        service={[
          'devops-service.application.listByActive',
          'devops-service.devops-git.createBranch',
          'devops-service.devops-git.queryByAppId',
          'devops-service.devops-git.delete',
          'devops-service.devops-git.listByAppId',
          'devops-service.git-flow.queryTags',
          'devops-service.devops-git.update',
        ]}
      >
        <Header title={<FormattedMessage id="branch.title" />}>
          {BranchStore.branchData.length && BranchStore.app ? <Permission
            service={['devops-service.devops-git.createBranch']}
          >
            <Tooltip
              title={<FormattedMessage id="branch.createTip" />}
              placement="rightTop"
            >
              <Button
                ghost
                onClick={this.showSidebar}
              >
                <span className="icon icon-playlist_add" />
                <FormattedMessage id="branch.create" />
              </Button>
            </Tooltip>
          </Permission> : null}
          <Button
            funcType="flat"
            ghost="true"
            onClick={this.handleRefresh}
          >
            <span className="icon icon-refresh" />
            <FormattedMessage id="refresh" />
          </Button>
        </Header>
        <Content className="page-content">
          <h2 className="c7n-space-first">
            <FormattedMessage
              id="branch.head"
              values={{
                name: `${menu.name}`,
              }}
            />
          </h2>
          <p>
            <FormattedMessage id="branch.description" />
            <a href={intl.formatMessage({ id: 'branch.link' })} rel="nofollow me noopener noreferrer" target="_blank" className="c7n-external-link">
              <span className="c7n-external-link-content">
                <FormattedMessage id="learnmore" />
              </span>
              <span className="icon icon-open_in_new" />
            </a>
          </p>
          <Select
            onChange={this.loadData}
            value={BranchStore.app ? BranchStore.app : undefined}
            className="branch-select_512"
            label={this.props.intl.formatMessage({ id: 'deploy.step.one.app' })}
            filterOption={(input, option) =>
              option.props.children.props.children.props.children
                .toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
            filter
          >
            {
              _.map(apps, (app, index) =>
                (
                  <Option value={app.id}>
                    <Tooltip title={app.code} key={index}>
                      <span style={{ width: '100%', display: 'inline-block' }}>
                        {app.name}
                      </span>
                    </Tooltip>
                  </Option>),
              )
            }
          </Select>
          {this.tableBranch}
        </Content>
        {BranchStore.createBranchShow === 'create' && <CreateBranch
          name={_.filter(apps, app => app.id === BranchStore.app)[0].name}
          appId={BranchStore.app}
          store={BranchStore}
          visible={BranchStore.createBranchShow === 'create'}
          onClose={this.hideSidebar}
        /> }
        {BranchStore.createBranchShow === 'edit' && <EditBranch
          appId={BranchStore.app}
          store={BranchStore}
          visible={BranchStore.createBranchShow === 'edit'}
          onClose={this.hideSidebar}
        /> }
        {BranchStore.createBranchShow === 'detail' && <IssueDetail
          store={BranchStore}
          name={_.filter(apps, app => app.id === BranchStore.app)[0].name}
          visible={BranchStore.createBranchShow === 'detail'}
          onClose={this.hideSidebar}
        /> }
        <Modal
          visible={this.state.visible}
          title={<FormattedMessage id={'branch.action.delete'} />}
          footer={[
            <Button key="back" onClick={this.closeRemove}>{<FormattedMessage id={'cancel'} />}</Button>,
            <Button key="submit" type="danger" onClick={this.handleDelete}>
              {this.props.intl.formatMessage({ id: 'delete' })}
            </Button>,
          ]}
        >
          <p>{this.props.intl.formatMessage({ id: 'branch.delete.tooltip' })}</p>
        </Modal>
      </Page>
    );
  }
}

export default withRouter(injectIntl(BranchHome));