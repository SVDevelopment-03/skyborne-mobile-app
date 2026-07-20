import { Platform } from 'react-native';
import Sound from 'react-native-sound';

// Enable playing sound in silence mode (iOS)
Sound.setCategory('Playback', true);

/**
 * Service for managing notification sound playback
 * Handles both foreground and background notifications with platform-specific logic
 */
class NotificationSoundService {
  private sound: Sound | null = null;
  private isPlaying = false;

  /**
   * Play notification sound
   * Uses platform-specific sound file paths
   */
  async playNotificationSound(): Promise<void> {
    try {
      // Release any existing sound to prevent conflicts
      if (this.sound) {
        await this.releaseSound();
      }

      // Platform-specific sound file paths
      const soundFileName = 'notification';
      const soundPath = Platform.OS === 'ios' 
        ? `${soundFileName}.wav` // iOS: stored in main bundle
        : `${soundFileName}.wav`; // Android: stored in raw resources (notification.wav)

      this.sound = new Sound(
        soundPath,
        Sound.MAIN_BUNDLE, // iOS uses MAIN_BUNDLE, Android uses RNFetchBlob.fs.dirs.DocumentDir
        (error: any) => {
          if (error) {
            console.warn('[NotificationSoundService] Failed to load sound:', error);
            return;
          }

          if (this.sound && !this.isPlaying) {
            this.isPlaying = true;
            
            this.sound.play((success: boolean) => {
              this.isPlaying = false;
              
              if (!success) {
                console.warn('[NotificationSoundService] Sound playback failed');
              }
            });
          }
        }
      );
    } catch (error) {
      console.warn('[NotificationSoundService] Error playing notification sound:', error);
    }
  }

  /**
   * Stop notification sound if currently playing
   */
  async stopNotificationSound(): Promise<void> {
    try {
      if (this.sound && this.isPlaying) {
        this.sound.stop();
        this.isPlaying = false;
      }
    } catch (error) {
      console.warn('[NotificationSoundService] Error stopping notification sound:', error);
    }
  }

  /**
   * Release sound resources
   */
  private async releaseSound(): Promise<void> {
    return new Promise((resolve) => {
      if (this.sound) {
        this.sound.stop(() => {
          this.sound?.release();
          this.sound = null;
          this.isPlaying = false;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    await this.releaseSound();
  }
}

// Export singleton instance
export const notificationSoundService = new NotificationSoundService();
