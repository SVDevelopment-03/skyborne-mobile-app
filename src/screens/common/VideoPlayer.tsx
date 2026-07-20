import React, { useState } from 'react';
import { View, Modal, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import Video from 'react-native-video';
import { X } from 'lucide-react-native';

interface VideoPlayerProps {
  url: string;
  isVisible: boolean;
  onClose: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ url, isVisible, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [paused, setPaused] = useState(false);

  return (
    <Modal visible={isVisible} transparent={true} animationType="fade">
      <View style={styles.container}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <X size={28} color="#fff" />
        </TouchableOpacity>

        <Video
          source={{ uri: url }}
          style={styles.video}
          controls
          paused={paused}
          resizeMode="contain"
          onLoadStart={() => setLoading(true)}
          onLoad={() => setLoading(false)}
        />

        {loading && (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '60%',
    backgroundColor: 'black',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },
  loading: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -18,
    marginTop: -18,
  },
});

export default VideoPlayer;
