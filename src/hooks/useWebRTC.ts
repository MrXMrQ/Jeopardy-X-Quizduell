import { useEffect, useState, useRef } from 'react';
import Peer from 'peerjs';

export const useWebRTC = (socket: any, gameState: any) => {
  const [myStream, setMyStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  const peerInstance = useRef<Peer | null>(null);

  // PeerJS Initialisierung
  useEffect(() => {
    const peer = new Peer(); 
    peerInstance.current = peer;
    
    peer.on('open', (id) => {
      socket.emit('update_peer_id', { peerId: id });
    });
    
    peer.on('call', (call) => {
      call.answer(myStream as MediaStream); 
      call.on('stream', (incomingStream) => {
        const callerSid = call.metadata.callerSid;
        if (callerSid) {
          setRemoteStreams(prev => ({ ...prev, [callerSid]: incomingStream }));
        }
      });
    });
    
    return () => { peer.destroy(); };
  }, [socket, myStream]);

  // Verbindungsaufbau zu anderen Spielern
  useEffect(() => {
    if (!gameState || !peerInstance.current) return;
    
    Object.entries(gameState.players).forEach(([sid, p]: any) => {
      if (sid !== socket.id && p.peerId && !remoteStreams[sid]) {
        setTimeout(() => {
          if (!peerInstance.current || peerInstance.current.destroyed) return;
          const call = peerInstance.current.call(p.peerId, myStream as MediaStream, {
            metadata: { callerSid: socket.id }
          });
          call?.on('stream', (incomingStream) => {
            setRemoteStreams(prev => ({ ...prev, [sid]: incomingStream }));
          });
        }, 500);
      }
    });
  }, [gameState, myStream, remoteStreams, socket.id]);

  // Kamera umschalten
  const handleToggleCam = async () => {
    if (myStream) {
      myStream.getTracks().forEach(track => track.stop());
      setMyStream(null);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 320, height: 240, frameRate: 15 },
          audio: false 
        });
        setMyStream(stream);
      } catch (err) {
        alert("Kamera-Zugriff fehlgeschlagen!");
      }
    }
  };

  return { myStream, remoteStreams, handleToggleCam };
};