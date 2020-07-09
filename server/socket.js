'use strict';

class Socket{

    constructor(socket)
    {
        this.io = socket;
        this.online_users = [];
    }

    ioConfig()
    {
        this.io.use((socket, next) => {

            socket['id'] = 'user_' + socket.handshake.query.user_id;

            if(socket.handshake.query.mylist != '' || typeof socket.handshake.query.mylist != 'undefined') {
                socket['my_friend'] = socket.handshake.query.mylist.split(',');
            } else {
                socket['my_friend'] = [];
            }

            if(socket.handshake.query.username != '' || typeof socket.handshake.query.username != 'undefined') {
                socket['username'] = socket.handshake.query.username;
            } else {
                socket['username'] = [];
            }

            if(socket.handshake.query.status != '' || typeof socket.handshake.query.status != 'undefined') {
                socket['status']    = socket.handshake.query.status;
            } else {
                socket['status']    = 'online';
            }

            next();
        });
    }

    socketConnection()
    {
        this.ioConfig();

        this.io.on('connection', (socket) => {
            // when connect fire connect emit and then make the operations there

            this.online_users = Object.keys(this.io.sockets.sockets); // get the online users from the sockets directly

            this.checkOnline(socket);

            this.changeUserStatus(socket);

            this.responseStatus(socket);

            this.sendPrivateMessage(socket);

            this.sendPrivateBroadcast(socket);

            this.socketDisconnection(socket);
        });
    }

    emitMethod(user_id, name, data)
    {
        if(this.checkInOnlineList(user_id)) {
            this.io.sockets.connected[user_id].emit(name, data);
        }
    }

    emitFrom(use_type, from, user_id, name, data)
    {
        if(use_type == 'online' && this.checkInOnlineList(from)) {
            this.io.sockets.connected[user_id].emit(name, data);
        } else if (use_type == 'offline' && this.checkInOnlineList(from) === false) {
            this.io.sockets.connected[user_id].emit(name, data);
        }
    }

    checkInOnlineList(user_id)
    {
        return this.online_users.indexOf(user_id) != -1;
    }

    checkOnline(socket)
    {
        socket.on('check_online', (data) => { // fire

            this.emitMethod(data.user_id, 'iam_online', {
                user_id: socket.id,
                status: socket.status
            });

            this.emitMethod(data.user_id, 'request_status', {
                user_id: socket.id
            });


            this.emitFrom('online', data.user_id, socket.id, 'is_online', {
                user_id: data.user_id,
                status:'online'
            });

            this.emitFrom('offline',data.user_id, socket.id, 'is_online', {
                user_id: data.user_id,
                status:'offline'
            });

            // this.io.sockets.connected[socket.id].emit('is_online', { // fire is_online emit
            //     user_id: data.user_id,
            //     status: other_status // this is supposed to be from the database
            // });

        });
    }

    changeUserStatus(socket)
    {
        socket.on('change_status', (data) => {
            var my_friends = socket.my_friend;

            if (my_friends.length > 0) {
                my_friends.forEach((user) => {

                    this.emitMethod('user_' + user, 'new_status', {
                        user_id: socket.id,
                        status: data.status
                    });

                });
            }
        });
    }

    responseStatus(socket)
    {
        socket.on('response_status', (data) => {
            this.emitMethod(data.to_user_id, 'is_online', {
                user_id:socket.id,
                status:data.status
            });
        });
    }

    sendPrivateMessage(socket)
    {
        socket.on('send_private_message', (data) => {
            this.emitMethod(socket.id, 'new_private_message', {
                username:socket.username,
                from_uid:data.to_uid,
                sender:socket.id,
                message:data.message
            });

            this.emitMethod(data.to_uid, 'new_private_message', {
                username:socket.username,
                from_uid:socket.id,
                sender:socket.id,
                message:data.message
            });
        });
    }

    sendPrivateBroadcast(socket)
    {
        socket.on('private_broadcast', (data) => {
            this.emitMethod(data.to, 'new_broadcast', {
                'from_uid': socket.id,
                'to_uid': data.to,
                username: data.username
            });
        });
    }

    socketDisconnection(socket)
    {
        socket.on('disconnect', (data) => {
            var myfriend = socket.my_friend;

            myfriend.forEach((user) => {
                this.emitMethod('user_' + user, 'iam_offline', {
                    user_id: socket.id,
                    status: 'offline'
                });
            });
            socket.disconnect();
            var removedUser0 = this.online_users.indexOf(socket.id);
            var removedUser1 = Object.keys(this.io.sockets.sockets).indexOf(socket.id);

            Object.keys(this.io.sockets.sockets).splice(removedUser1,1);
            this.online_users.splice(removedUser0,1);

        });
    }

}

module.exports = Socket;
