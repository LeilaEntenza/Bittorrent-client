'use strict';

const dgram = require('dgram');
const Buffer = require('buffer').Buffer;
const urlParse = require('url').parse;

module.exports.getPeers = (torrent, callback) => {
    const socket = dgram.createSocket('udp4');
    const url = torrent.announce.toString('utf8');

    udpSend(socket, buildConnReq(), url);

    socket.on('message', response => {
        if (respType(response) === 'connect'){
            const connResp = parseConnResp(response);
            const announceReq = buildAnnounceReq(connResp.connectionId);
            udpSend(socket, announceReq, url);
        }
        else if (respType(response) === 'announce'){
            const announceResp = parseAnnounceResp(response);
            callback(announceResp.peers);
        }
    });
}

const udpSend = (socket, message, rawUrl, callback = () => {}) => {
    const url = urlParse(rawUrl);
    socket.send(message, 0, message.length, url.port, url.host, callback);
}

const respType = (resp) => {

}

const crypto = require('crypto')
const buildConnReq = () => {
    const buf = Buffer.alloc(16);
    buf.writeUint32BE(0x417, 0);
    buf.writeUInt32BE(0x27101980, 4);
    buf.writeUint32BE(0, 8);
    crypto.randomBytes(4).copy(buf, 12);    
    return buf;
}

const parseConnResp = (resp) => {
    return{
        action: resp.readUint32BE(0),
        transactionId: resp.readUint32BE(4),
        connectionId: resp.readUint32BE(8)
    }
}

const buildAnnounceReq = (connId) => {

}

const parseAnnounceResp = (resp) => {

}