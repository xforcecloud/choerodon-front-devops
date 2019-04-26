import React, { PureComponent, Fragment } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { Icon, Tooltip } from 'choerodon-ui';
import classnames from 'classnames';
import _ from 'lodash';
import { timeConvert } from '../../../../../utils';
import { statusIcon } from '../statusMap';
import { STAGE_FLOW_MANUAL } from '../Constans';

import './DetailTitle.scss';

export default class DetailTitle extends PureComponent {
  static propTypes = {
    name: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    time: PropTypes.number,
    status: PropTypes.string,
    isCadence: PropTypes.bool,
  };

  static defaultProps = {
    name: '',
    type: 'auto',
    checking: null,
  };

  render() {
    const { name, time, type, user, status, checking, isCadence } = this.props;
    const statusStyle = classnames({
      'c7ncd-pipeline-status': true,
      [`c7ncd-pipeline-status_${status}`]: true,
    });
    const bkColor = classnames({
      'c7ncd-pipeline-title': true,
      [`c7ncd-pipeline-title_${status}`]: true,
    });

    /**
     * 手动流转模式说明
     * 待流转，未开启审核： 所有 user 的 audit 属性为 false，checking 属性为 null
     * 待流转，已开启审核： 所有 user 的 audit 属性为 false，checking 属性为 true
     * 已审核，通过：             只要有 audit 属性为 true，status   属性为 success
     * 已审核，终止：             只要有 audit 属性为 true，status   属性为 stop
     */
    let triggerDom = null;

    if (type === STAGE_FLOW_MANUAL) {

      const audit = _.find(user, 'audit');
      if (audit) {

        const isStopFlow = status === 'stop' || isCadence && checking;
        const spanClass = classnames({
          'c7ncd-manualflow-pass': !isStopFlow,
          'c7ncd-manualflow-stop': isStopFlow,
        });
        const { realName, imageUrl } = audit;
        triggerDom = <Fragment>
          <Tooltip title={realName}>
            {imageUrl
              ? <img className="c7ncd-trigger-img" src={imageUrl} alt="avatar" />
              : <span className="c7ncd-trigger-text">{_.toString(realName).toUpperCase().substring(0, 1)
              }</span>}
          </Tooltip>
          <span className={spanClass}><FormattedMessage id={`pipeline.flow.${type}`} /></span>
        </Fragment>;

      } else {

        const userName = _.map(user, ({ realName }) => realName).join('，');
        const spanClass = classnames({
          'c7ncd-manualflow-pending': !!checking,
        });
        triggerDom = <Tooltip title={userName}>
          <span className={spanClass}>
            <FormattedMessage id={`pipeline.flow.${type}`} />
          </span>
        </Tooltip>;

      }

    } else {

      const spanClass = classnames({
        'c7ncd-autoflow-pass': status === 'success',
      });
      triggerDom = <span className={spanClass}>
        <FormattedMessage id={`pipeline.flow.${type}`} />
      </span>;

    }

    return (
      <div className={bkColor}>
        <div className={statusStyle}>
          <Icon className="stage-icon" type={statusIcon[status]} />
        </div>
        <div className="c7ncd-pipeline-detail-execute">
          <div className="c7ncd-pipeline-execute-name">{name}</div>
          <div className="c7ncd-pipeline-execute-time">{timeConvert(Number(time))}</div>
        </div>
        <div className="c7ncd-pipeline-title-trigger">
          {triggerDom}
        </div>
      </div>
    );
  }
}
