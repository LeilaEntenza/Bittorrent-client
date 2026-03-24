'use strict';

const dgram = require('dgram');
const Buffer = require('buffer').Buffer;
const urlParse = require('url').parse;
const torrentParser = require('./torrent-parser');
const util = require('./util');

module.exports.getPeers = (torrent, callback) => {
    const socket = dgram.createSocket('udp4');
    const url = torrent.announce.toString('utf8');

    udpSend(socket, buildConnReq(), url);

    socket.on('message', response => {
        if (respType(response) === 'connect'){
            const connResp = parseConnResp(response);
            const announceReq = buildAnnounceReq(connResp.connectionId, torrent);
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
        connectionId: resp.slice(8)
    }
}

const buildAnnounceReq = (connId, torrent, port=6881) => {
    const buf = Buffer.allocUnsafe(98);
    connId.copy(buf, 0);
    buf.writeUInt32BE(1, 8);
    crypto.randomBytes(4).copy(buf, 12);
    torrentParser.infoHash(torrent).buf(16);
    util.genId().copy(buf, 36);
    Buffer.alloc(8).copy(buf, 56);
    torrentParser.size(torrent).copy(buf, 64);
    Buffer.alloc(8).copy(buf, 72);
    buf.writeUInt32BE(0, 80);
    buf.writeUint32BE(0, 80);
    crypto.randomBytes(4).copy(buf, 88);
    buf.writeInt32BE(-1, 92);
    buf.writeUInt16BE(port, 96);
    return buf;
}

const parseAnnounceResp = (resp) => {
    const group = (iterable, groupSize) => {
        let groups = [];
        for(let i = 0; i < iterable.length; i+=groupSize){
            groups.push(iterable.slice(i, i + groupSize));
        }
        return groups;
    }

    return{
        action: resp.readUint32BE(0),
        transactionId: resp.readUint32BE(4),
        leechers: resp.readUint32BE(8),
        seeders: resp.readUint32BE(12),
        peers: group(resp.slice(20), 6).map(address => {
            return{
                ip: address.slice(0, 4).join('.'),
                port: address.readUint32BE(4)
            }
        })
    }
}