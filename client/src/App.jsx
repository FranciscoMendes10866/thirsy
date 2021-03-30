import IconButton from "@material-ui/core/IconButton"
import TextField from "@material-ui/core/TextField"
import AssignmentIcon from "@material-ui/icons/Assignment"
import PhoneIcon from "@material-ui/icons/Phone"
import Card from '@material-ui/core/Card'
import Grid from '@material-ui/core/Grid'
import React, { useEffect, useRef, useState } from "react"
import { CopyToClipboard } from "react-copy-to-clipboard"
import Peer from "simple-peer"
import io from "socket.io-client"

const socket = io.connect('http://localhost:5000')

const App = () => {
  const [me, setMe] = useState("")
  const [stream, setStream] = useState()
  const [receivingCall, setReceivingCall] = useState(false)
  const [caller, setCaller] = useState("")
  const [callerSignal, setCallerSignal] = useState()
  const [callAccepted, setCallAccepted] = useState(false)
  const [idToCall, setIdToCall] = useState("")
  const [callEnded, setCallEnded] = useState(false)
  const [name, setName] = useState("")
  const myVideo = useRef()
  const userVideo = useRef()
  const connectionRef = useRef()

  useEffect(() => {
    navigator
      .mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setStream(stream)
        myVideo.current.srcObject = stream
      })

    socket.on("me", (id) => {
      setMe(id)
    })

    socket.on("callUser", (data) => {
      setReceivingCall(true)
      setCaller(data.from)
      setName(data.name)
      setCallerSignal(data.signal)
    })
  }, [])

  const callUser = (id) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: stream
    })
    peer.on("signal", (data) => {
      socket.emit("callUser", {
        userToCall: id,
        signalData: data,
        from: me,
        name: name
      })
    })
    peer.on("stream", (stream) => {
      userVideo.current.srcObject = stream
    })
    socket.on("callAccepted", (signal) => {
      setCallAccepted(true)
      peer.signal(signal)
    })
    connectionRef.current = peer
  }

  const answerCall = () => {
    setCallAccepted(true)
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: stream
    })
    peer.on("signal", (data) => {
      socket.emit("answerCall", { signal: data, to: caller })
    })
    peer.on("stream", (stream) => {
      userVideo.current.srcObject = stream
    })

    peer.signal(callerSignal)
    connectionRef.current = peer
  }

  const leaveCall = () => {
    setCallEnded(true)
    connectionRef.current.destroy()
  }
  return (
    <>
      <Grid container>
        <Grid item xs="6">
          {stream && <video playsInline muted ref={myVideo} autoPlay style={{ height: '100vh', width: '50vw' }} />}
        </Grid>
        <Grid item xs="6">
          {callAccepted && !callEnded ?
            <video playsInline ref={userVideo} autoPlay style={{ height: '100vh', width: '50vw' }} /> : null}
        </Grid>
      </Grid>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          paddingLeft: 10,
          paddingRight: 10,
          paddingTop: 10,
          paddingBottom: 10,
          top: 0,
          right: 0,
          position: 'fixed'
        }}
      >
        <CopyToClipboard text={me}>
          <IconButton aria-label="copy" color="primary">
            <AssignmentIcon />
          </IconButton>
        </CopyToClipboard>
      </div>
      <Card
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          paddingLeft: 20,
          paddingRight: 20,
          paddingTop: 15,
          paddingBottom: 15,
          bottom: 0,
          position: 'fixed'
        }}
      >
        <div className="call-button">
          {callAccepted && !callEnded ? (
            <IconButton variant="contained" color="secondary" onClick={leaveCall}>
              <PhoneIcon fontSize="medium" />
            </IconButton>
          ) : (
            <>
              <TextField
                id="filled-basic"
                label="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ marginRight: 20 }}
              />
              <TextField
                id="filled-basic"
                label="Insert ID"
                value={idToCall}
                style={{ marginRight: 20 }}
                onChange={(e) => setIdToCall(e.target.value)}
              />
              <IconButton color="primary" aria-label="call" onClick={() => callUser(idToCall)}>
                <PhoneIcon fontSize="medium" />
              </IconButton>
            </>
          )}
        </div>
      </Card>
      {receivingCall && !callAccepted ? (
        <Card
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            paddingLeft: 20,
            paddingRight: 20,
            paddingTop: 10,
            paddingBottom: 10,
            right: 0,
            bottom: 0,
            position: 'fixed'
          }}
        >
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <h3>{name}</h3>
            <p style={{ marginBottom: 10 }}>is calling...</p>
            <IconButton color="primary" variant="contained" onClick={answerCall}>
              <PhoneIcon fontSize="medium" />
            </IconButton>
          </div>
        </Card>
      ) : null}
    </>
  )
}

export default App
