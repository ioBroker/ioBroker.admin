import I18n from '@iobroker/adapter-react-v5/i18n';
import React, { useEffect } from 'react';

const InfoPanel = ({
    socket, idHost, memRssId, currentHost, instances,
}) => {
    if (currentHost.startsWith('system.host.')) {
        currentHost = currentHost.replace(/^system\.host./, '');
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        socket.getHostInfo(idHost, null, 10000)
            .catch(error => {
                console.error(error);
                return error;
            })
            .then(hostData => {
                this.setState({ hostData });
            });

        async function asyncFunc() {
            const host = this.states[memRssId];
            let processes = 1;
            let mem = host ? host.val : 0;
            for (const id in instances) {
                if (instances.hasOwnProperty(id)) {
                    const inst = instances[id];
                    if (!inst || !inst.common) {
                        return;
                    }
                    if (inst.common.host !== currentHost) {
                        return;
                    }
                    if (inst.common.enabled && inst.common.mode === 'daemon') {
                        memRssId = `${inst._id}.memRss`;
                        this.states[memRssId] = this.states[memRssId] || (await socket.getState(memRssId));
                        const m = this.states[memRssId];
                        mem += m ? m.val : 0;
                        processes++;
                    }
                }
            }
            let memState;
            const memAvailable = await socket.getState(`system.host.${currentHost}.memAvailable`);
            const freemem = await socket.getState(`system.host.${currentHost}.freemem`);
            const object = await socket.getObjecI18n.t(`system.host.${currentHost}`);
            if (memAvailable) {
                memState = memAvailable;
            } else if (freemem) {
                memState = freemem;
            }
            if (memState) {
                const totalmem = (object?.native.hardware.totalmem / (1024 * 1024));
                const percent = Math.round((memState.val / totalmem) * 100);
                this.setState({
                    percent,
                    memFree: memState.val,
                });
            }
        }

        asyncFunc()
            .catch(e => console.error(`Cannot get host info: ${e}`));
    }, []);
    return <div>
        {
            `${I18n.I18n.t('Disk free')}: 
        ${Math.round(this.state.hostData['Disk free'] / (this.state.hostData['Disk size'] / 100))}%,
         ${I18n.t('Total RAM usage')}: ${this.state.mem} Mb / ${I18n.t('Free')}: 
         ${this.state.percent}% = ${this.state.memFree} Mb [${I18n.t('Host')}: 
         ${currentHost} - ${this.state.processes} ${I18n.t('processes')}]`
        }
    </div>;
};

export default InfoPanel;
