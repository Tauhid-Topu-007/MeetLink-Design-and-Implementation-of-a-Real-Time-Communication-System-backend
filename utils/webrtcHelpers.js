/**
 * WebRTC Helpers - Utility functions for WebRTC
 */

/**
 * Get STUN/TURN servers configuration
 */
const getIceServers = () => {
  return {
    iceServers: [
      // Google STUN servers
      {
        urls: 'stun:stun.l.google.com:19302'
      },
      {
        urls: 'stun:stun1.l.google.com:19302'
      },
      {
        urls: 'stun:stun2.l.google.com:19302'
      },
      {
        urls: 'stun:stun3.l.google.com:19302'
      },
      {
        urls: 'stun:stun4.l.google.com:19302'
      },
      // Public STUN server
      {
        urls: 'stun:stun.stunprotocol.org:3478'
      },
      // TURN server (for NAT traversal)
      {
        urls: 'turn:openrelay.metered.ca:80',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      },
      {
        urls: 'turn:openrelay.metered.ca:443',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      },
      {
        urls: 'turn:openrelay.metered.ca:443?transport=tcp',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      }
    ],
    iceCandidatePoolSize: 10,
    bundlePolicy: 'max-bundle',
    rtcpMuxPolicy: 'require'
  };
};

/**
 * Generate unique meeting ID
 */
const generateMeetingId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let meetingId = '';
  for (let i = 0; i < 9; i++) {
    meetingId += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return meetingId;
};

/**
 * Validate meeting ID format
 */
const isValidMeetingId = (meetingId) => {
  const pattern = /^[A-Z0-9]{9}$/;
  return pattern.test(meetingId);
};

/**
 * Get media constraints based on device capabilities
 */
const getMediaConstraints = (options = {}) => {
  const { video = true, audio = true, resolution = 'hd' } = options;
  
  const constraints = {
    audio: audio ? {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true
    } : false,
    video: video ? {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 30 }
    } : false
  };
  
  if (resolution === 'hd') {
    constraints.video.width = { ideal: 1920 };
    constraints.video.height = { ideal: 1080 };
  } else if (resolution === 'sd') {
    constraints.video.width = { ideal: 640 };
    constraints.video.height = { ideal: 480 };
  }
  
  return constraints;
};

/**
 * Format duration in minutes and seconds
 */
const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Calculate bitrate based on resolution
 */
const getBitrateForResolution = (width, height) => {
  const pixels = width * height;
  if (pixels <= 640 * 480) return 300; // 300 kbps for SD
  if (pixels <= 1280 * 720) return 800; // 800 kbps for HD
  if (pixels <= 1920 * 1080) return 1500; // 1500 kbps for Full HD
  return 2500; // 2500 kbps for 4K
};

/**
 * Check if browser supports WebRTC
 */
const isWebRTCSupported = () => {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
};

/**
 * Get browser media capabilities
 */
const getMediaCapabilities = async () => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const hasCamera = devices.some(device => device.kind === 'videoinput');
    const hasMicrophone = devices.some(device => device.kind === 'audioinput');
    const hasSpeakers = devices.some(device => device.kind === 'audiooutput');
    
    return {
      hasCamera,
      hasMicrophone,
      hasSpeakers,
      webRTCSupported: isWebRTCSupported(),
      deviceCount: {
        cameras: devices.filter(d => d.kind === 'videoinput').length,
        microphones: devices.filter(d => d.kind === 'audioinput').length,
        speakers: devices.filter(d => d.kind === 'audiooutput').length
      }
    };
  } catch (error) {
    console.error('Error getting media capabilities:', error);
    return {
      hasCamera: false,
      hasMicrophone: false,
      hasSpeakers: false,
      webRTCSupported: false,
      error: error.message
    };
  }
};

module.exports = {
  getIceServers,
  generateMeetingId,
  isValidMeetingId,
  getMediaConstraints,
  formatDuration,
  getBitrateForResolution,
  isWebRTCSupported,
  getMediaCapabilities
};