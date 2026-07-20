import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { X } from 'lucide-react-native';
import { FontFamilies } from '../constants/fonts';
import { WebView } from 'react-native-webview';

interface PolicyModalProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  url: string;
  onClose: () => void;
}

const PolicyModal = ({
  visible,
  title,
  subtitle,
  url,
  onClose,
}: PolicyModalProps) => {
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <View style={styles.headerTextContainer}>
              <Text style={styles.title}>{title}</Text>
              {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={18} color="#494949" />
            </TouchableOpacity>
          </View>

          <View style={styles.webViewContainer}>
            <WebView
              source={{ uri: url }}
              originWhitelist={['https://*', 'http://*']}
              javaScriptEnabled
              domStorageEnabled
              startInLoadingState
              allowsBackForwardNavigationGestures
              style={styles.webView}
              renderLoading={() => (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#B95E82" />
                  <Text style={styles.loadingText}>Loading policy...</Text>
                </View>
              )}
            />
          </View>

          <TouchableOpacity onPress={onClose} style={styles.actionButton}>
            <Text style={styles.actionText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default PolicyModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  modal: {
    maxHeight: '82%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingTop: 18,
    paddingHorizontal: 18,
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
    gap: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    color: '#111111',
    fontFamily: FontFamilies.SatoshiBold,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 12,
    color: '#6B7280',
    fontFamily: FontFamilies.SatoshiRegular,
    lineHeight: 18,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  webViewContainer: {
    height: 520,
    overflow: 'hidden',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  webView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: FontFamilies.SatoshiRegular,
  },
  actionButton: {
    height: 48,
    borderRadius: 14,
    backgroundColor: '#B95E82',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: FontFamilies.SatoshiMedium,
  },
});