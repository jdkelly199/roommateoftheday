const express = require('express');
const path = require('path');
const app = express();
const server = require('http').createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);
const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, '../../build')));
app.get('*', (req, res, next) => res.sendFile(path.resolve(__dirname, '../../build', 'index.html')));

const admins = ["Akash", "Josh", "JD", "Ian"];
const voteData = {
  "voters": [],
  "timeLeft": 60,
  "votes": [],
  "voteReady": false,
  "voteStarted": false,
  "voteFinished": false,
  "votesRecorded": 0
};

var socketData = {}

function checkQuorum() {
  const time = new Date();
  const ptHour = Number(time.toLocaleString('en-US', {timeZone: 'America/Los_Angeles', hour12:false}).split(", ")[1].split(":")[0]);

  let numAdmins = 0;
  for(let i = 0; i < admins.length; i++){
    if(voteData["voters"].includes(admins[i])) numAdmins += 1;
  }

  if(numAdmins >= 4 | ptHour + numAdmins >= 24) voteData["voteReady"] = true;
  else voteData["voteReady"] = false;
}

function createPoll() {
  for(let i = 0; i < voteData["voters"].length; i++){
    voteData["votes"].push({ option: voteData["voters"][i], votes: 0 })
  }
}

io.on('connection', function(socket){
  socketData[socket.id] = null;
  console.log("user connected");

  socket.on('login', (msg) => {
    socketData[socket.id] = msg;
    if (socketData[socket.id] != null & !voteData["voters"].includes(socketData[socket.id])) {
      voteData["voters"].push(socketData[socket.id]);
      checkQuorum()

      io.emit('newVoter', voteData);
      socket.emit('loginSuccess', voteData);
    } else {
      socket.emit('loginFail', {});
    }
  })

  socket.on('startVotePress', () => {
    if(admins.includes(socketData[socket.id]) & voteData["voteReady"]) {
      voteData["voteStarted"] = true;
      createPoll();
      io.emit('dataUpdate', voteData);
    }
  })

  socket.on('newVote', (voteAnswer) => {
    for(let i = 0; i < voteData["voters"].length; i++){
      if (voteData["votes"][i].option == voteAnswer & !voteData["voteFinished"]) {
        voteData["votes"][i].votes += 1;
        voteData["votesRecorded"] += 1;
      }
    }

    if (voteData["votesRecorded"] >= voteData["voters"].length) {
      voteData["voteFinished"] = true;
      console.log(voteData);
      io.emit('dataUpdate', voteData);
      io.emit('dataUpdate', voteData);
    }
  })

  socket.on('disconnect', () => {
    console.log("user disconnected");
    console.log(voteData)
    console.log(socketData);
    if (voteData["voters"].includes(socketData[socket.id])) {

      let newVoters = [];
      for(let i = 0; i < voteData["voters"].length; i++){
        if ((voteData["voters"][i]) != socketData[socket.id]) {
          newVoters.push(voteData["voters"][i]);
        }
      }

      voteData["voters"] = newVoters;
      if(!voteData["voteStarted"]) checkQuorum();

      if(voteData["voters"].length == 0) {
        socketData = {};
        voteData["voters"] = [];
        voteData["votes"] = [];
        voteData["voteReady"] = false;
        voteData["voteStarted"] = false;
        voteData["voteFinished"] = false;
        voteData["votesRecorded"] = 0;
      }

      io.emit('dataUpdate', voteData);
    }
  })
});

server.listen(port);
