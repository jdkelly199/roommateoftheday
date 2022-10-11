import React, {useState} from 'react';
import logo from './logo.svg';
import './App.css';
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Poll from 'react-polls';

import { io } from 'socket.io-client';
const socket = io();

const admins = ["Akash", "Josh", "JD", "Ian"];

function App() {
  const [voteData, setVoteData] = useState({"voters":[]});
  const [name, setName] = useState(null);
  const [login, setLogin] = useState(false);
  const [storeVote, setStoreVote] = useState('JD');

  socket.on('loginSuccess', (msg) => {
    setLogin(true);
    setVoteData(msg);
  });

  socket.on('newVoter', (msg) => {
    setVoteData(msg);
  });

  socket.on('dataUpdate', (msg) => {
    setVoteData(msg);
  });

  socket.on('loginFail', () => {
    setLogin(false);
    alert("Login Attempt Failed");
  });

  function startVote() {
    socket.emit('startVotePress', {})
  }

  function handleSubmit(event) {
    event.preventDefault();
    socket.emit('login', name)
  }

  function handleVote(voteAnswer) {
    setStoreVote(voteAnswer);
    socket.emit('newVote', voteAnswer)
  }

  return (
    <div className="App">
      <header className="App-header">
        {(login) ?
          <div>
            {voteData["voteStarted"] ?
              <div>
                {(voteData["voteFinished"]) ?
                  <Poll question={"Roommate of the Day"} answers={voteData["votes"]} onVote={handleVote} vote={storeVote} customStyles={{theme:'white', questionColor:'#ffffff'}} noStorage={true}/> :
                  <Poll question={"Vote for Roommate of the Day"} answers={voteData["votes"]} onVote={handleVote} customStyles={{theme:'white', questionColor:'#ffffff'}} noStorage={true}/> }
              </div> :
              <div>
                <h1>Roommates Present</h1>
                {voteData["voters"].map((item, index) => (
                  <h3>{item}</h3>
                ))}

                {(voteData["voteReady"]) ?
                  <h5>Quorum Achieved!</h5> :
                  <h5>Quorum Not Yet Achieved</h5>}
                {(admins.includes(name) & voteData["voteReady"]) ?
                  <Button block="true" size="lg" onClick={startVote} >Start Vote</Button> :<></>}
              </div>
            }
          </div> :
          <div className="Login">
            <h1> Roommate of the Day </h1>
            <Form onSubmit={handleSubmit}>
              <Form.Group size="lg" controlId="email">
                <Form.Label>Name</Form.Label>
                <br></br>
                <Form.Control
                  autoFocus
                  type="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Form.Group>
              <Button block="true" size="lg" type="submit">
                Login
              </Button>
            </Form>
          </div>
        }
      </header>
    </div>
  );
}

export default App;
