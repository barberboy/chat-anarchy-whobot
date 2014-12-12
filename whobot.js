var set = require('set');
var util = require('util');

module.exports = function(options) {
    var rooms = {};
    return function(socket, next) {
        socket
            .on('join', function(room) {
                //console.log("whobot hears that %s joined %s", socket.user, socket.room);
                if (room) {
                    var roster = rooms[room];
                    if (!roster) {
                        roster = rooms[room] = new set();
                    }
                    roster.add(socket.user);
                    socket.nsp.in(socket.room).emit('count', roster.size());
                }
            })
            .on('message', function(message) {
                if (!message || !socket.room || !rooms[socket.room]) return;

                message = message.trim().toLowerCase();
                if (message === "who" || message === "who?" || message === "who's here?" || message === "who is here?") {
                    var roster = rooms[socket.room];
                    socket.nsp.in(socket.room).emit('announce',
                        util.format("%s are present.", roster.get().join(', ')));
                }
            })
            .on('disconnect', function() {
                //console.log("whobot hears that %s left %s", socket.user, socket.room);
                if (socket.room) {
                    var roster = rooms[socket.room];
                    if (roster) {
                        roster.remove(socket.user);
                        socket.nsp.in(socket.room).emit('count', roster.size());
                    }
                }
            });
        next();
    };
};