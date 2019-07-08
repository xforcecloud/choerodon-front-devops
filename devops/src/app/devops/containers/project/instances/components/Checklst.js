import React from 'react';
import { Modal, Button } from 'choerodon-ui';
import { injectIntl, FormattedMessage } from 'react-intl';
import PropTypes from 'prop-types';
import { axios } from 'choerodon-front-boot';

const mapping = {"status":"实例状态","app-ver-id":"版本状态", "command": "命令下发", "git-tag":"gitops同步", "env-file":"环境资源", "git-file":"git资源"}  

class Checklst extends React.Component {


    reasonRender = (id, result, type) => {
      const name = mapping[type]
      const fix =(id, type) => axios.put(`x-devops/fix/${id}/${type}`).then((data) => {
          //if(data.code == "-1"){
            Choerodon.prompt(data.message);
          //}
      });
      const forceFix = (id, type) => axios.put(`x-devops/fix/${id}/${type}?force=true`).then((data) => {
        //if(data.code == "-1"){
          Choerodon.prompt(data.message);
        //}
      });
    
      if(result != "ok" && (type == "app-ver-id" || type == "git-tag" || type == "git-file")){
        return <div>{name}: {result} <Button onClick={fix.bind(this, id, type)}>修复</Button> <Button onClick={forceFix.bind(this, id, type)}>强制修复</Button></div>
      }else{
        return <div>{name}: {result} </div>
      }
  }
  render() {
    const { open, handleOk, intl, name, reasons , id} = this.props;
    const listItems = (reasons || []).map((reason) => {
        return this.reasonRender(id, reason.reason, reason.resType)
    });
    return (
      <Modal
        title={`${intl.formatMessage({ id: 'ist.chk' })}“${name}”`}
        visible={open}
        closable={false}
        onOk={handleOk}

        footer={[
            <Button key="back" onClick={handleOk} ><FormattedMessage id="ok" /></Button>
        ]}
      >
        <p>
          检测结果
        </p>

        { listItems }
        
      </Modal>);
  }
}
Checklst.propTypes = {
  open: PropTypes.bool,
};
export default injectIntl(Checklst);
