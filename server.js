var express = require('express'),
    app     = express(),
    http    = require('http'),
    socketIO      = require('socket.io');

const PORT = process.env.PORT || 3000;
const INDEX = __dirname + '/static/index.html';
var server = http.createServer(app);
const io = socketIO.listen(server);

server.listen(PORT, () => { console.log("Server starts on http://localhost:"+ PORT+" !")});  

io.on('connection', (socket)=> {
  var all_rooms=[];
  var room_name;
  var symbol;
  // Если сокет уже находится в какой-то комнате,   
  if (socket.current_room_name !== undefined) {
    //выходим из нее 
    socket.leave(socket.current_room_name);
    //и создаём новую комнату
    room_name=socket.id.toString();
    socket.join(room_name);
    symbol='X';
  }  
  //если сокет не находится ни в какой комнате
  else
  {
    //узнали переданный в пути сокетid первого игрока
    var urlapi = require('url'),
    url = urlapi.parse(socket.handshake.headers.referer);
    var itog_socketid = url.pathname.slice(1, -1);    
    //ecли нет запроса, то добавляет сокет в комнату с новым именем
    if(itog_socketid==="")
    {
      room_name=socket.id.toString();
      socket.join(room_name);
      symbol='X';
    }    
    //если есть
    else
    {
      room_name=itog_socketid;
      var room = io.sockets.adapter.rooms[room_name];
      //если указано имя существующей комнаты
      if(room !== undefined)
      {
        //узнаём количество людей в комнате
        var number_of_clients_in_room = io.sockets.adapter.rooms[room_name].length;
        //присоединяем к комнате, если там есть уже один человек(т.к. это уже второй игрок)
        if(number_of_clients_in_room===1)
        {
          socket.join(room_name);
          symbol='O';
          socket.broadcast.to(room_name).emit('second_player');  
        }       
        //иначе запрос не актуален и добавляем сокет в комнату с новым именем
        else
        {
          room_name=socket.id.toString();
          socket.join(room_name);
          symbol='X';      
        }         
      }
      //если такой комнаты не существует, то добавляем сокет в комнату с новым именем
      else
      {
        room_name=socket.id.toString();
        socket.join(room_name);
        symbol='X';
      }
    }
  }
  //отправляем игроку его символ   
  socket.emit('your_player_symbol_and_current_room', {my_symbol: symbol, room: room_name} );     
  socket.on('disconnect', (socket) => {
    //отправляем другому игроку сообщение о том, что теперь он один
    io.to(room_name).emit('player_leaves');
     // this returns a list of all rooms this user is in
     var rooms = io.sockets.adapter.sids[socket.id];
     for(var room in rooms) {
         socket.leave(room);
     };
  })
  socket.on('new-message', (msg)=> {
    io.to(room_name).emit('receive-message',msg); 
  });
  // socket.on('update_board0', (data)=> {
  //   socket.broadcast.to(room_name).emit('update_board', data);
  // });
});

app.use('/', express.static(__dirname + '/static'));
app.get('/', function(req, res){
  res.sendFile(__dirname + "/static/index.html");
});

app.use('/([a-zA-Z0-9_-]{20})/', express.static(__dirname + '/static'));
app.get('/([a-zA-Z0-9_-]{20})/', function(req, res){
  res.sendFile(__dirname + "/static/index.html");
});