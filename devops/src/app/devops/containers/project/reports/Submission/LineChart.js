import React, { PureComponent, Fragment } from 'react';
import ReactEchartsCore from 'echarts-for-react/lib/core';
import PropTypes from 'prop-types';
import { Spin, Avatar } from 'choerodon-ui';
import echarts from 'echarts/lib/echarts';
import { injectIntl } from 'react-intl';
import { getToDayStr } from '../../../../utils';

import 'echarts/lib/chart/line';
import 'echarts/lib/component/tooltip';
import 'echarts/lib/component/title';
import 'echarts/lib/component/grid';
import './Submission.scss';

class LineChart extends PureComponent {
  static propTypes = {
    color: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    loading: PropTypes.bool.isRequired,
    hasAvatar: PropTypes.bool.isRequired,
  };

  getOption = () => {
    const { color, data: { items }, intl: { formatMessage } } = this.props;
    const keys = items ? Object.keys(items) : [getToDayStr()];
    const value = items ? keys.map(item => items[item]) : [0];
    return {
      title: {
        show: false,
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: '#fff',
        textStyle: {
          color: '#000',
        },
        formatter(obj) {
          return `${formatMessage({ id: 'report.commit.date' })}${obj.name}<br/>${formatMessage({ id: 'report.commit.count' })}${obj.value}`;
        },
      },
      grid: {
        top: 42,
        left: 14,
        right: 20,
        bottom: 0,
        // 防止标签溢出
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        axisTick: {
          show: false,
        },
        axisLine: {
          show: true,
          lineStyle: {
            // color: '#bac3ca',
            color: '#eee',
          },
          onZero: true,
        },
        splitLine: {
          show: true,
          lineStyle: {
            // color: ['#bac3ca'],
            color: ['#eee'],
          },
        },
        axisLabel: {
          color: 'rgba(0,0,0,0.65)',
          formatter(item, idx) {
            return item.split('-').slice(1).join('/');
          },
        },
        data: keys,
      },
      yAxis: {
        name: formatMessage({ id: 'report.commit.num' }),
        min: Math.max(...value) > 3 ? null : 0,
        max: Math.max(...value) > 3 ? null : 4,
        minInterval: 1,
        nameTextStyle: {
          color: '#000',
        },
        axisLine: {
          show: true,
          lineStyle: {
            color: '#eee',
          },
        },
        axisTick: {
          show: false,
        },
        splitLine: {
          show: true,
          lineStyle: {
            color: ['#eee'],
          },
        },
        axisLabel: {
          color: 'rgba(0,0,0,0.65)',
        },
        type: 'value',
      },
      series: [{
        data: value,
        type: 'line',
        smooth: true,
        smoothMonotone: 'x',
        symbol: 'circle',
        itemStyle: {
          normal: {
            color,
          },
        },
        areaStyle: {
          color,
          opacity: '0.5',
        },
        lineStyle: {
          color,
        },
      }],
    };
  };

  render() {
    const { style, data: { avatar, count, items }, name, loading, hasAvatar } = this.props;
    return (<Spin spinning={loading}>
      <div className="c7n-report-commits-title">
        {hasAvatar ? (<span className="c7n-report-commits-avatar">
          {avatar
            ? <Avatar size="small" src={avatar} />
            : <Avatar size="small">{name ? name.toString().slice(0, 1).toUpperCase() : '?'}</Avatar>}
        </span>) : null}
        {name}
        {count ? <span className="c7n-report-commits-text">{count} commits</span> : null}
      </div>
      <ReactEchartsCore
        echarts={echarts}
        option={this.getOption()}
        style={style}
        notMerge
        lazyUpdate
      />
    </Spin>);
  }
}

export default injectIntl(LineChart);