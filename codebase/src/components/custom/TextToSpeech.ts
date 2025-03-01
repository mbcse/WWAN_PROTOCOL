/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Voice gender type
 */
type VoiceGender = 'male' | 'female';

/**
 * Voice category with predefined voices
 */
interface VoiceCategory {
  /** Array of male voices */
  male: string[];
  /** Array of female voices */
  female: string[];
}

/**
 * Options for text-to-speech conversion
 */
interface TextToSpeechOptions {
  /** Specific voice name to use (if available) */
  voiceName?: string;
  /** Voice gender preference */
  gender?: VoiceGender;
  /** Index of the voice to use (0-2 for each gender) */
  voiceIndex?: number;
  /** Speech rate (0.1 to 10, default: 1) */
  rate?: number;
  /** Speech pitch (0 to 2, default: 1) */
  pitch?: number;
  /** Speech volume (0 to 1, default: 1) */
  volume?: number;
}

/**
 * Converts text to speech using the Web Speech API with support for predefined male and female voices
 */
class SpeechService {
  private voices: SpeechSynthesisVoice[] = [];
  private voiceCategories: VoiceCategory = {
    male: [],
    female: []
  };
  private initialized = false;
  private initializing = false;

  /**
   * Initialize the speech service and load available voices
   */
  public initialize(): Promise<void> {
    if (this.initialized) {
      return Promise.resolve();
    }

    if (this.initializing) {
      return new Promise<void>((resolve) => {
        const checkInterval = setInterval(() => {
          if (this.initialized) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
      });
    }

    this.initializing = true;

    return new Promise<void>((resolve, reject) => {
      if (!window.speechSynthesis) {
        this.initializing = false;
        reject(new Error("Speech synthesis not supported in this browser"));
        return;
      }

      const loadVoices = () => {
        this.voices = window.speechSynthesis.getVoices();
        
        if (this.voices.length > 0) {
          this.categorizeVoices();
          this.initialized = true;
          this.initializing = false;
          resolve();
        } else {
          // Some browsers may load voices asynchronously
          setTimeout(loadVoices, 100);
        }
      };

      // Chrome loads voices asynchronously
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => {
          this.voices = window.speechSynthesis.getVoices();
          this.categorizeVoices();
          this.initialized = true;
          this.initializing = false;
          resolve();
        };
        
        // Also try loading immediately in case voices are already available
        loadVoices();
      } else {
        // For browsers that load voices synchronously
        loadVoices();
      }
    });
  }

  /**
   * Categorize available voices into male and female categories
   */
  private categorizeVoices(): void {
    const maleVoices: string[] = [];
    const femaleVoices: string[] = [];
    
    // Try to find English voices first for better compatibility
    const englishVoices = this.voices.filter(voice => 
      voice.lang.startsWith('en-') || voice.lang === 'en'
    );
    
    const allVoices = englishVoices.length >= 6 ? englishVoices : this.voices;
    
    // Find voices that are likely to be male/female based on name or properties
    allVoices.forEach(voice => {
      const name = voice.name.toLowerCase();
      
      // Some voices have gender info in voice.name
      if (
        name.includes('male') || 
        name.includes('man') || 
        name.includes('guy') ||
        (voice as any).gender === 'male'
      ) {
        maleVoices.push(voice.name);
      } else if (
        name.includes('female') || 
        name.includes('woman') ||
        name.includes('girl') ||
        (voice as any).gender === 'female'
      ) {
        femaleVoices.push(voice.name);
      } else {
        // Make best guess based on common names in voice APIs
        if (
          name.includes('david') || 
          name.includes('tom') ||
          name.includes('alex') ||
          name.includes('daniel') ||
          name.includes('james') ||
          name.includes('john')
        ) {
          maleVoices.push(voice.name);
        } else if (
          name.includes('lisa') || 
          name.includes('sarah') || 
          name.includes('samantha') ||
          name.includes('victoria') ||
          name.includes('karen') ||
          name.includes('amy')
        ) {
          femaleVoices.push(voice.name);
        } else {
          // If we can't determine, add to whatever category needs more voices
          if (maleVoices.length <= femaleVoices.length) {
            maleVoices.push(voice.name);
          } else {
            femaleVoices.push(voice.name);
          }
        }
      }
    });
    
    // Ensure we have at least 3 of each, duplicating if necessary
    while (maleVoices.length < 3 && this.voices.length > 0) {
      maleVoices.push(this.voices[maleVoices.length % this.voices.length].name);
    }
    
    while (femaleVoices.length < 3 && this.voices.length > 0) {
      femaleVoices.push(this.voices[femaleVoices.length % this.voices.length].name);
    }
    
    // Take only first 3 of each
    this.voiceCategories = {
      male: maleVoices.slice(0, 3),
      female: femaleVoices.slice(0, 3)
    };
  }

  /**
   * Get all available voices
   */
  public getVoices(): SpeechSynthesisVoice[] {
    return this.voices;
  }

  /**
   * Get categorized voices (male and female)
   */
  public getVoiceCategories(): VoiceCategory {
    return this.voiceCategories;
  }

  /**
   * Speak the provided message
   * @param message - Text to be spoken
   * @param options - Speech options
   */
  public speak(message: string, options: TextToSpeechOptions = {}): Promise<void> {
    return this.initialize().then(() => {
      return new Promise<void>((resolve, reject) => {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();
  
        // Create speech utterance
        const utterance = new SpeechSynthesisUtterance(message);
        
        // Determine which voice to use
        let voiceName = options.voiceName;
        
        if (!voiceName && (options.gender || options.voiceIndex !== undefined)) {
          const gender = options.gender || 'male';
          const index = options.voiceIndex !== undefined ? 
            Math.min(options.voiceIndex, 2) : 
            0;
          
          voiceName = this.voiceCategories[gender][index];
        }
        
        // Set voice if we have one
        if (voiceName) {
          const voice = this.voices.find(v => v.name === voiceName);
          // console.log("voices", this.voices)
          // console.log("voice", voice, voiceName)
          if (voice) {
            utterance.voice = voice;
          }
        }
        
        // Set optional parameters with defaults
        utterance.rate = options.rate !== undefined ? options.rate : 1;
        utterance.pitch = options.pitch !== undefined ? options.pitch : 1;
        utterance.volume = options.volume !== undefined ? options.volume : 1;
        
        // Handle events
        utterance.onend = () => resolve();
        utterance.onerror = (event) => reject(new Error(`Speech synthesis error: ${event.error}`));
        
        // Start speaking
        window.speechSynthesis.speak(utterance);
      });
    });
  }
}

// Create singleton instance
const speechService = new SpeechService();

export default speechService;