import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { register } from '../../services/auth';
import { DESIGN_TOKENS } from '../constants/designTokens'; // Import DESIGN_TOKENS
import { saveUser } from '../utils/user';

// TypeScript type definitions for better type safety
type KeyboardType = 'default' | 'email-address' | 'numeric' | 'phone-pad';
// FontWeight type is now implicitly defined by DESIGN_TOKENS.typography properties

// API Response types
interface AuthResponse {
  success: boolean;
  message?: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

// Register request payload
interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

const { width: screenWidth } = Dimensions.get('window');

const BACKGROUND_IMAGE_URI =
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80';

// Form validation rules with TypeScript types
interface ValidationRule {
  required?: string;
  pattern?: RegExp;
  patternMessage?: string;
  minLength?: number;
  minLengthMessage?: string;
  matchField?: keyof FormData;
  matchMessage?: string;
}

type ValidationRules = {
  [K in keyof FormData]: ValidationRule;
};

// Use DESIGN_TOKENS for minLength where applicable
const VALIDATION_RULES: ValidationRules = {
  email: {
    required: 'Email diperlukan',
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    patternMessage: 'Format email tidak valid',
  },
  password: {
    required: 'Password diperlukan',
    minLength: 8, // Keeping 8 as per original logic, not tied to designTokens directly
    minLengthMessage: 'Password minimal 8 karakter',
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    patternMessage: 'Password harus mengandung huruf besar, kecil, dan angka',
  },
  confirmPassword: {
    required: 'Konfirmasi password diperlukan',
    matchField: 'password',
    matchMessage: 'Password tidak cocok',
  },
  name: {
    required: 'Nama lengkap diperlukan',
    minLength: 2, // Keeping 2 as per original logic
    minLengthMessage: 'Nama minimal 2 karakter',
  },
} as const;

// TypeScript interfaces for component props and state
interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface InputOptions {
  keyboardType?: KeyboardType;
  secureTextEntry?: boolean;
  showPasswordToggle?: boolean;
  showPassword?: boolean;
  onTogglePassword?: () => void;
}

// Feather icon names type (commonly used ones)
type FeatherIconName = 'user' | 'mail' | 'lock' | 'eye' | 'eye-off' | 'loader';

export default function RegisterScreen() {
  const router = useRouter();

  // Form state
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const headerAnim = useRef(
    new Animated.Value(-DESIGN_TOKENS.spacing.md)
  ).current; // Use DESIGN_TOKENS
  const inputAnimRefs = useRef([
    new Animated.Value(DESIGN_TOKENS.spacing.md), // Use DESIGN_TOKENS
    new Animated.Value(DESIGN_TOKENS.spacing.lg), // Use DESIGN_TOKENS
    new Animated.Value(DESIGN_TOKENS.spacing.xl), // Use DESIGN_TOKENS
    new Animated.Value(DESIGN_TOKENS.spacing.xxl), // Use DESIGN_TOKENS
  ]).current;
  const buttonAnim = useRef(
    new Animated.Value(DESIGN_TOKENS.spacing.xxxl)
  ).current; // Use DESIGN_TOKENS

  // Component lifecycle
  useEffect(() => {
    startEntranceAnimation();
  }, []);

  // Animation methods with proper TypeScript typing
  const startEntranceAnimation = (): void => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      Animated.stagger(80, [
        Animated.timing(headerAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        ...inputAnimRefs.map((anim: Animated.Value) =>
          Animated.timing(anim, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          })
        ),
        Animated.timing(buttonAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };

  const animateButtonPress = (): void => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.98,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  /**
   * Validates a single form field based on predefined rules.
   * @param field The name of the field to validate.
   * @param value The current value of the field.
   * @returns An error message string if validation fails, otherwise an empty string.
   */
  const validateField = useCallback(
    (field: keyof FormData, value: string): string => {
      const rules = VALIDATION_RULES[field];

      if (rules.required && !value.trim()) {
        return rules.required;
      }

      if (rules.pattern && !rules.pattern.test(value)) {
        return rules.patternMessage || 'Format tidak valid';
      }

      if (rules.minLength && value.length < rules.minLength) {
        return rules.minLengthMessage || `Minimal ${rules.minLength} karakter`;
      }

      // Specific logic for confirmPassword matching
      if (rules.matchField && value !== formData[rules.matchField]) {
        return rules.matchMessage || 'Nilai tidak cocok';
      }

      return '';
    },
    [formData.password]
  ); // Dependency on formData.password for confirmPassword validation

  /**
   * Validates the entire form by iterating through all fields.
   * Updates the formErrors state.
   * @returns True if the form is valid, false otherwise.
   */
  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {
      // Initialize with empty strings for all fields
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    };

    let isValid = true;
    (Object.keys(formData) as (keyof FormData)[]).forEach((field) => {
      const error = validateField(field, formData[field]);
      newErrors[field] = error;
      if (error) {
        isValid = false;
      }
    });

    setFormErrors(newErrors);
    return isValid;
  }, [formData, validateField]); // Dependencies on formData and validateField

  /**
   * Handles changes to an input field.
   * Updates formData and clears the corresponding error if typing starts.
   * @param field The name of the field being changed.
   * @param value The new value of the field.
   */
  const handleFieldChange = useCallback(
    (field: keyof FormData, value: string): void => {
      setFormData((prev) => ({ ...prev, [field]: value }));

      // Clear error for the current field as user types
      if (formErrors[field]) {
        setFormErrors((prev) => ({ ...prev, [field]: '' }));
      }

      // Special handling for confirmPassword: re-validate if password changes
      if (field === 'password' && formData.confirmPassword) {
        setFormErrors((prev) => ({
          ...prev,
          confirmPassword: validateField(
            'confirmPassword',
            formData.confirmPassword
          ),
        }));
      }
    },
    [formData.confirmPassword, formErrors, validateField]
  );

  /**
   * Handles the blur event for an input field.
   * Triggers validation for the blurred field and updates errors.
   * @param field The name of the field being blurred.
   */
  const handleFieldBlur = useCallback(
    (field: keyof FormData): void => {
      const error = validateField(field, formData[field]);
      setFormErrors((prev) => ({ ...prev, [field]: error }));
      setFocusedField(null); // Clear focused field state
    },
    [formData, validateField]
  );

  /**
   * Handles the registration process.
   * Validates the form, calls the API, and navigates on success or shows an alert on failure.
   */
  const handleRegister = async (): Promise<void> => {
    if (isLoading) return; // Prevent multiple submissions

    // Validate the entire form before attempting registration
    const isFormValid = validateForm();
    if (!isFormValid) {
      Alert.alert('Form Tidak Valid', 'Mohon periksa kembali input Anda.');
      return;
    }

    setIsLoading(true);
    animateButtonPress();

    try {
      const payload: any = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      };

      const response: any = await register(payload);

      if (response.success && response.user) {
        await saveUser(response.user);

        // Success animation
        Animated.timing(scaleAnim, {
          toValue: 1.02,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          router.navigate('/(tabs)/main/Home'); // Navigate to the main tab group index
        });
      } else {
        // Handle API-specific error messages
        Alert.alert(
          'Registrasi Gagal',
          response.message || 'Terjadi kesalahan tidak dikenal.'
        );
      }
    } catch (error: unknown) {
      console.error('Register error:', error);
      // More user-friendly error message for network/unexpected issues
      Alert.alert(
        'Error',
        'Terjadi kesalahan jaringan atau server. Silakan coba lagi nanti.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Render methods with strict TypeScript typing
  const renderInput = (
    field: keyof FormData,
    placeholder: string,
    icon: FeatherIconName,
    animIndex: number,
    options: InputOptions = {}
  ) => {
    const hasError: boolean = !!formErrors[field];
    const isFocused: boolean = focusedField === field;

    return (
      <Animated.View
        style={{
          marginBottom: DESIGN_TOKENS.spacing.md,
          transform: [{ translateY: inputAnimRefs[animIndex] }],
        }}
      >
        <BlurView
          intensity={Platform.OS === 'ios' ? 15 : 12}
          tint='systemMaterialDark'
          style={{
            borderRadius: DESIGN_TOKENS.borderRadius.md,
            overflow: 'hidden',
            backgroundColor: isFocused
              ? DESIGN_TOKENS.colors.glassInputFocused
              : DESIGN_TOKENS.colors.glassInputBg,
            borderWidth: 1,
            borderColor: hasError
              ? DESIGN_TOKENS.colors.error
              : isFocused
                ? DESIGN_TOKENS.colors.primary
                : DESIGN_TOKENS.colors.glassBorder,
            shadowColor: isFocused
              ? DESIGN_TOKENS.colors.primary
              : 'rgba(0,0,0,0.1)',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isFocused ? 0.2 : 0.1,
            shadowRadius: 4,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: DESIGN_TOKENS.spacing.md,
              height: 56,
            }}
          >
            <Feather
              name={icon as any}
              size={20}
              color={
                isFocused
                  ? DESIGN_TOKENS.colors.primary
                  : DESIGN_TOKENS.colors.textSecondary
              }
              style={{ marginRight: DESIGN_TOKENS.spacing.sm }}
            />
            <TextInput
              style={{
                flex: 1,
                ...DESIGN_TOKENS.typography.body,
                color: DESIGN_TOKENS.colors.textPrimary,
              }}
              placeholder={placeholder}
              placeholderTextColor={DESIGN_TOKENS.colors.textPlaceholder}
              value={formData[field]}
              onChangeText={(text) => handleFieldChange(field, text)}
              onFocus={() => setFocusedField(field)}
              onBlur={() => handleFieldBlur(field)}
              keyboardType={options.keyboardType || 'default'}
              secureTextEntry={options.secureTextEntry}
              autoCapitalize={field === 'email' ? 'none' : 'words'}
              autoCorrect={false}
            />
            {options.showPasswordToggle && (
              <TouchableOpacity
                onPress={options.onTogglePassword}
                style={{ padding: DESIGN_TOKENS.spacing.xs }}
              >
                <Feather
                  name={options.showPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color={DESIGN_TOKENS.colors.textSecondary}
                />
              </TouchableOpacity>
            )}
          </View>
        </BlurView>
        {hasError && (
          <Text
            style={{
              ...DESIGN_TOKENS.typography.error,
              color: DESIGN_TOKENS.colors.error,
              marginTop: DESIGN_TOKENS.spacing.sm,
              marginLeft: DESIGN_TOKENS.spacing.xs,
            }}
          >
            {formErrors[field]}
          </Text>
        )}
      </Animated.View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <StatusBar
        barStyle='light-content'
        translucent
        backgroundColor='transparent'
      />

      <ImageBackground
        source={{ uri: BACKGROUND_IMAGE_URI }}
        style={{ flex: 1 }}
        resizeMode='cover'
      >
        <BlurView
          intensity={Platform.OS === 'ios' ? 20 : 15}
          tint='dark'
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: 'center',
              paddingHorizontal: DESIGN_TOKENS.spacing.lg,
              paddingVertical: DESIGN_TOKENS.spacing.xxl,
            }}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
                maxWidth: 400,
                width: '100%',
                alignSelf: 'center',
              }}
            >
              <BlurView
                intensity={Platform.OS === 'ios' ? 30 : 25}
                tint='systemMaterialDark'
                style={{
                  borderRadius: DESIGN_TOKENS.borderRadius.xl,
                  overflow: 'hidden',
                  backgroundColor: DESIGN_TOKENS.colors.glassBg,
                  borderWidth: 0.5,
                  borderColor: DESIGN_TOKENS.colors.glassBorder,
                  shadowColor: 'rgba(0, 0, 0, 0.3)',
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.3,
                  shadowRadius: 20,
                }}
              >
                <View style={{ padding: DESIGN_TOKENS.spacing.xl }}>
                  {/* Header */}
                  <Animated.View
                    style={{
                      alignItems: 'center',
                      marginBottom: DESIGN_TOKENS.spacing.xxl,
                      transform: [{ translateY: headerAnim }],
                    }}
                  >
                    <Text
                      style={{
                        ...DESIGN_TOKENS.typography.h1, // Use h1 from DESIGN_TOKENS
                        color: DESIGN_TOKENS.colors.textPrimary,
                        textAlign: 'center',
                      }}
                    >
                      Buat Akun Baru
                    </Text>
                    <Text
                      style={{
                        ...DESIGN_TOKENS.typography.caption, // Use subtitle from DESIGN_TOKENS
                        color: DESIGN_TOKENS.colors.textSecondary,
                        textAlign: 'center',
                        marginTop: DESIGN_TOKENS.spacing.sm,
                      }}
                    >
                      Bergabunglah dengan kami hari ini
                    </Text>
                  </Animated.View>

                  {/* Form Inputs */}
                  {renderInput('name', 'Nama Lengkap', 'user', 0)}

                  {renderInput('email', 'Email', 'mail', 1, {
                    keyboardType: 'email-address',
                  })}

                  {renderInput('password', 'Password', 'lock', 2, {
                    secureTextEntry: !showPassword,
                    showPasswordToggle: true,
                    showPassword,
                    onTogglePassword: () => setShowPassword(!showPassword),
                  })}

                  {renderInput(
                    'confirmPassword',
                    'Konfirmasi Password',
                    'lock',
                    3,
                    {
                      secureTextEntry: !showConfirmPassword,
                      showPasswordToggle: true,
                      showPassword: showConfirmPassword,
                      onTogglePassword: () =>
                        setShowConfirmPassword(!showConfirmPassword),
                    }
                  )}

                  {/* Register Button */}
                  <Animated.View
                    style={{
                      transform: [{ translateY: buttonAnim }],
                      marginBottom: DESIGN_TOKENS.spacing.lg,
                    }}
                  >
                    <TouchableOpacity
                      disabled={isLoading}
                      onPress={handleRegister}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={[DESIGN_TOKENS.colors.primary, '#0056CC']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{
                          borderRadius: DESIGN_TOKENS.borderRadius.md,
                          height: 56,
                          justifyContent: 'center',
                          alignItems: 'center',
                          flexDirection: 'row',
                          shadowColor: DESIGN_TOKENS.colors.primary,
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.3,
                          shadowRadius: 12,
                          opacity: isLoading ? 0.8 : 1,
                        }}
                      >
                        {isLoading && (
                          <Animated.View
                            style={{ marginRight: DESIGN_TOKENS.spacing.sm }}
                          >
                            <Feather
                              name='loader'
                              size={20}
                              color={DESIGN_TOKENS.colors.textOnButton}
                            />
                          </Animated.View>
                        )}
                        <Text
                          style={{
                            ...DESIGN_TOKENS.typography.button,
                            color: DESIGN_TOKENS.colors.textOnButton,
                          }}
                        >
                          {isLoading ? 'Mendaftar...' : 'Daftar Sekarang'}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </Animated.View>

                  {/* Login Link */}
                  <View style={{ alignItems: 'center' }}>
                    <Link href='/login' asChild>
                      <TouchableOpacity activeOpacity={0.7}>
                        <View style={{ flexDirection: 'row' }}>
                          <Text
                            style={{
                              ...DESIGN_TOKENS.typography.caption,
                              fontWeight: '400', // Ensure fontWeight is explicit if not part of typography preset
                              color: DESIGN_TOKENS.colors.textSecondary,
                            }}
                          >
                            Sudah punya akun?{' '}
                          </Text>
                          <Text
                            style={{
                              ...DESIGN_TOKENS.typography.caption,
                              fontWeight: '600',
                              color: DESIGN_TOKENS.colors.primary,
                            }}
                          >
                            Masuk
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </Link>
                  </View>
                </View>
              </BlurView>
            </Animated.View>
          </ScrollView>
        </BlurView>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
}
