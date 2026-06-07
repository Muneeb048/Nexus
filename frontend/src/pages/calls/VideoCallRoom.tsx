import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import toast from 'react-hot-toast';

export const VideoCallRoom: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { user } = useAuth();

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [remoteUserJoined, setRemoteUserJoined] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Initialize WebRTC
  useEffect(() => {
    if (!socket || !user || !roomId) return;

    let isComponentMounted = true;

    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
      ],
    };

    const initializeMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (!isComponentMounted) return;

        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        socket.emit('join-room', roomId, user.id);
      } catch (err) {
        toast.error('Failed to access camera and microphone');
        console.error(err);
      }
    };

    initializeMedia();

    // Socket Event Listeners
    const handleUserConnected = async (userId: string) => {
      console.log('User connected:', userId);
      setRemoteUserJoined(true);
      
      const peerConnection = new RTCPeerConnection(configuration);
      peerConnectionRef.current = peerConnection;

      localStreamRef.current?.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStreamRef.current!);
      });

      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('ice-candidate', { target: userId, candidate: event.candidate });
        }
      };

      peerConnection.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      try {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socket.emit('offer', { target: userId, caller: user.id, sdp: offer });
      } catch (error) {
        console.error('Error creating offer:', error);
      }
    };

    const handleOffer = async (incoming: { caller: string, sdp: RTCSessionDescriptionInit }) => {
      console.log('Received offer from:', incoming.caller);
      setRemoteUserJoined(true);

      const peerConnection = new RTCPeerConnection(configuration);
      peerConnectionRef.current = peerConnection;

      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('ice-candidate', { target: incoming.caller, candidate: event.candidate });
        }
      };

      peerConnection.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      localStreamRef.current?.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStreamRef.current!);
      });

      try {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(incoming.sdp));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        socket.emit('answer', { target: incoming.caller, sdp: answer });
      } catch (error) {
        console.error('Error handling offer:', error);
      }
    };

    const handleAnswer = async (incoming: { sdp: RTCSessionDescriptionInit }) => {
      console.log('Received answer');
      try {
        await peerConnectionRef.current?.setRemoteDescription(new RTCSessionDescription(incoming.sdp));
      } catch (error) {
        console.error('Error setting remote description:', error);
      }
    };

    const handleIceCandidate = async (candidate: RTCIceCandidateInit) => {
      try {
        await peerConnectionRef.current?.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error('Error adding ice candidate:', error);
      }
    };

    const handleUserDisconnected = () => {
      console.log('User disconnected');
      setRemoteUserJoined(false);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
    };

    socket.on('user-connected', handleUserConnected);
    socket.on('offer', handleOffer);
    socket.on('answer', handleAnswer);
    socket.on('ice-candidate', handleIceCandidate);
    socket.on('user-disconnected', handleUserDisconnected);

    return () => {
      isComponentMounted = false;
      socket.off('user-connected', handleUserConnected);
      socket.off('offer', handleOffer);
      socket.off('answer', handleAnswer);
      socket.off('ice-candidate', handleIceCandidate);
      socket.off('user-disconnected', handleUserDisconnected);
      
      // Stop media tracks
      localStreamRef.current?.getTracks().forEach(track => track.stop());
      
      // Close peer connection
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, [roomId, socket, user]);

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const endCall = () => {
    navigate('/meetings');
  };

  return (
    <div className="h-screen w-full bg-gray-900 flex flex-col relative overflow-hidden">
      
      {/* Top Bar */}
      <div className="p-4 absolute top-0 left-0 w-full z-10 bg-gradient-to-b from-black/70 to-transparent flex justify-between items-center text-white">
        <div>
          <h1 className="text-xl font-bold">Nexus Call Room</h1>
          <p className="text-sm opacity-80">Room: {roomId}</p>
        </div>
        <div>
          {!remoteUserJoined && (
             <span className="bg-yellow-500/20 text-yellow-300 px-3 py-1 rounded-full text-sm">Waiting for others to join...</span>
          )}
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 p-4 flex flex-col md:flex-row gap-4 justify-center items-center h-full pt-20 pb-24">
        
        {/* Local Video */}
        <div className={`relative rounded-xl overflow-hidden bg-gray-800 shadow-2xl transition-all duration-300 ${remoteUserJoined ? 'w-1/4 absolute bottom-24 right-8 z-20 border-2 border-gray-700' : 'w-full md:w-3/4 max-w-4xl h-full'}`}>
          <video 
            ref={localVideoRef} 
            autoPlay 
            playsInline 
            muted 
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-4 left-4 bg-black/50 px-2 py-1 rounded text-white text-xs">
            You {isMuted && '(Muted)'}
          </div>
        </div>

        {/* Remote Video */}
        {remoteUserJoined && (
          <div className="w-full h-full md:w-3/4 max-w-5xl relative rounded-xl overflow-hidden bg-gray-800 shadow-2xl">
            <video 
              ref={remoteVideoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-4 left-4 bg-black/50 px-2 py-1 rounded text-white text-xs">
              Partner
            </div>
          </div>
        )}
      </div>

      {/* Controls Bar */}
      <div className="absolute bottom-0 w-full p-6 bg-gradient-to-t from-black/90 to-transparent flex justify-center gap-6 items-center">
        <button 
          onClick={toggleMute}
          className={`p-4 rounded-full transition-colors ${isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'} text-white shadow-lg`}
        >
          {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
        </button>

        <button 
          onClick={toggleVideo}
          className={`p-4 rounded-full transition-colors ${isVideoOff ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'} text-white shadow-lg`}
        >
          {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
        </button>

        <button 
          onClick={endCall}
          className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg flex items-center justify-center transform hover:scale-105 transition-all"
        >
          <PhoneOff size={28} />
        </button>
      </div>
    </div>
  );
};
