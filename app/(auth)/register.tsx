import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { getToken } from '@/utils/token';
import { DESIGN_TOKENS } from '../../constants/designTokens';
import { register, RegisterType } from '../../services/auth';
import { saveUser } from '../../utils/user';

// TypeScript type definitions for better type safety
type KeyboardType = 'default' | 'email-address' | 'numeric' | 'phone-pad';

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

const VALIDATION_RULES: ValidationRules = {
  name: {
    required: 'Nama lengkap diperlukan',
    minLength: 2,
    minLengthMessage: 'Nama minimal 2 karakter',
  },
  email: {
    required: 'Email diperlukan',
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    patternMessage: 'Format email tidak valid',
  },
  phone: {
    required: 'Nomor telepon diperlukan',
    pattern: /^[0-9]{10,15}$/,
    patternMessage: 'Format nomor telepon tidak valid (10-15 digit)',
  },
  address: {
    required: 'Alamat diperlukan',
    minLength: 8,
    minLengthMessage: 'Alamat minimal 8 karakter',
  },
  password: {
    required: 'Password diperlukan',
    minLength: 6,
    minLengthMessage: 'Password minimal 6 karakter',
  },
  confirmPassword: {
    required: 'Konfirmasi password diperlukan',
    matchField: 'password',
    matchMessage: 'Password tidak cocok',
  },
} as const;

// TypeScript interfaces for component props and state
interface FormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  name: string;
  email: string;
  phone: string;
  address: string;
  password: string;
  confirmPassword: string;
}

interface InputOptions {
  keyboardType?: KeyboardType;
  secureTextEntry?: boolean;
  showPasswordToggle?: boolean;
  isPasswordVisible?: boolean;
  onTogglePassword?: () => void;
  multiline?: boolean;
  numberOfLines?: number;
}

// Feather icon names type
type FeatherIconName =
  | 'user'
  | 'mail'
  | 'lock'
  | 'eye'
  | 'eye-off'
  | 'loader'
  | 'phone'
  | 'map-pin';

// Loading spinner component
const LoadingSpinner = () => {
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spin = () => {
      spinValue.setValue(0);
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start(() => spin());
    };
    spin();
  }, [spinValue]);

  const rotate = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={{ transform: [{ rotate }] }}>
      <Feather
        name='loader'
        size={20}
        color={DESIGN_TOKENS.colors.textTertiary}
      />
    </Animated.View>
  );
};

export default function RegisterScreen() {
  const router = useRouter();

  // Form state
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    confirmPassword: '',
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({
    name: '',
    email: '',
    phone: '',
    address: '',
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
  ).current;
  const inputAnimRefs = useRef([
    new Animated.Value(DESIGN_TOKENS.spacing.md),
    new Animated.Value(DESIGN_TOKENS.spacing.lg),
    new Animated.Value(DESIGN_TOKENS.spacing.xl),
    new Animated.Value(DESIGN_TOKENS.spacing.xxl),
    new Animated.Value(DESIGN_TOKENS.spacing.xxxl),
    new Animated.Value(DESIGN_TOKENS.spacing.xxxl),
  ]).current;
  const buttonAnim = useRef(
    new Animated.Value(DESIGN_TOKENS.spacing.xxxl)
  ).current;

  const startEntranceAnimation = useCallback(() => {
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
  }, [buttonAnim, fadeAnim, headerAnim, inputAnimRefs, scaleAnim]);

  // Component lifecycle
  useEffect(() => {
    startEntranceAnimation();
  }, [startEntranceAnimation]);

  // Animation methods with proper TypeScript typing
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

  // Password visibility toggle functions
  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  const toggleConfirmPasswordVisibility = useCallback(() => {
    setShowConfirmPassword((prev) => !prev);
  }, []);

  /**
   * Validates a single form field based on predefined rules.
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
    [formData]
  );

  /**
   * Validates the entire form by iterating through all fields.
   */
  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {
      name: '',
      email: '',
      phone: '',
      address: '',
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
  }, [formData, validateField]);

  /**
   * Handles changes to an input field.
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
   */
  const handleFieldBlur = useCallback(
    (field: keyof FormData): void => {
      const error = validateField(field, formData[field]);
      setFormErrors((prev) => ({ ...prev, [field]: error }));
      setFocusedField(null);
    },
    [formData, validateField]
  );

  /**
   * Handles the registration process.
   */
  const handleRegister = async (): Promise<void> => {
    if (isLoading) return;

    const isFormValid = validateForm();
    if (!isFormValid) {
      Alert.alert('Form Tidak Valid', 'Mohon periksa kembali input Anda.');
      return;
    }

    setIsLoading(true);
    animateButtonPress();

    try {
      const payload: RegisterType = {
        name: formData.name,
        address: formData.address,
        phone: formData.phone,
        email: formData.email,
        password: formData.password,
        password_confirmation: formData.confirmPassword,
      };

      const response: any = await register(payload);

      if (response.success && response.user) {
        const token = await getToken();
        await saveUser(response.user, token || response.access_token || '');

        // Success animation
        Animated.timing(scaleAnim, {
          toValue: 1.02,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          router.navigate('/home');
        });
      } else {
        Alert.alert(
          'Registrasi Gagal',
          response.message || 'Terjadi kesalahan tidak dikenal.'
        );
      }
    } catch (error: unknown) {
      console.error('Register error:', error);
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

    // Tentukan apakah input ini adalah field password
    const isPasswordField = field === 'password' || field === 'confirmPassword';

    // Tentukan nilai secureTextEntry berdasarkan state visibilitas
    const dynamicSecureTextEntry = isPasswordField
      ? field === 'password'
        ? !showPassword
        : !showConfirmPassword
      : false;

    // Tentukan nama ikon dinamis
    const dynamicIconName = isPasswordField
      ? dynamicSecureTextEntry
        ? 'eye'
        : 'eye-off'
      : (icon as any);

    return (
      <Animated.View
        style={{
          marginBottom: DESIGN_TOKENS.spacing.md,
          transform: [{ translateY: inputAnimRefs[animIndex] }],
        }}
      >
        <View
          style={{
            borderRadius: DESIGN_TOKENS.borderRadius.md,
            overflow: 'hidden',
            backgroundColor: DESIGN_TOKENS.colors.background,
            borderWidth: 1,
            borderColor: hasError
              ? DESIGN_TOKENS.colors.error
              : isFocused
                ? DESIGN_TOKENS.colors.primary
                : DESIGN_TOKENS.colors.border,
            shadowColor: isFocused
              ? DESIGN_TOKENS.colors.primary
              : 'rgba(0,0,0,0.1)',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isFocused ? 0.2 : 0.1,
            shadowRadius: 4,
            elevation: isFocused ? 4 : 2, // For Android shadow
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: DESIGN_TOKENS.spacing.md,
              minHeight: 56,
              paddingVertical: options.multiline ? 10 : 0,
            }}
          >
            <Feather
              name={icon as any} // Tetap gunakan ikon statis di sini
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
                textAlignVertical: options.multiline ? 'top' : 'center',
              }}
              placeholder={placeholder}
              placeholderTextColor={DESIGN_TOKENS.colors.textSecondary}
              value={formData[field]}
              onChangeText={(text) => handleFieldChange(field, text)}
              onFocus={() => setFocusedField(field)}
              onBlur={() => handleFieldBlur(field)}
              keyboardType={options.keyboardType || 'default'}
              // Gunakan nilai dinamis untuk secureTextEntry
              secureTextEntry={dynamicSecureTextEntry}
              autoCapitalize={field === 'email' ? 'none' : 'words'}
              autoCorrect={false}
              multiline={options.multiline}
              numberOfLines={options.numberOfLines}
            />
            {options.showPasswordToggle && (
              <TouchableOpacity
                onPress={options.onTogglePassword}
                style={{
                  padding: DESIGN_TOKENS.spacing.xs,
                  borderRadius: DESIGN_TOKENS.borderRadius.sm,
                }}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                {/* Gunakan ikon dinamis di sini */}
                <Feather
                  name={dynamicIconName as any}
                  size={20}
                  color={
                    isFocused
                      ? DESIGN_TOKENS.colors.primary
                      : DESIGN_TOKENS.colors.textSecondary
                  }
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
        {hasError && (
          <Animated.View
            style={{
              opacity: hasError ? 1 : 0,
              marginTop: DESIGN_TOKENS.spacing.sm,
              marginLeft: DESIGN_TOKENS.spacing.xs,
            }}
          >
            <Text
              style={{
                ...DESIGN_TOKENS.typography.error,
                color: DESIGN_TOKENS.colors.error,
              }}
            >
              {formErrors[field]}
            </Text>
          </Animated.View>
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

      <View
        style={{ flex: 1, backgroundColor: DESIGN_TOKENS.colors.background }}
      >
        <View style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: 'center',
              paddingHorizontal: DESIGN_TOKENS.spacing.lg,
              paddingVertical: DESIGN_TOKENS.spacing.xxl,
            }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps='handled'
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
              <View style={{ padding: DESIGN_TOKENS.spacing.xl }}>
                {/* Header */}
                <Animated.View
                  style={{
                    alignItems: 'center',
                    marginBottom: DESIGN_TOKENS.spacing.xxl,
                    transform: [{ translateY: headerAnim }],
                  }}
                >
                  <Image
                    source={require('@/assets/images/intanet.png')}
                    style={{ width: 80, height: 80, marginBottom: 20 }}
                  />
                  <Text
                    style={{
                      ...DESIGN_TOKENS.typography.h1,
                      color: DESIGN_TOKENS.colors.textPrimary,
                      textAlign: 'center',
                    }}
                  >
                    Selamat Datang
                  </Text>
                </Animated.View>

                {/* Form Inputs */}
                {renderInput('name', 'Nama Lengkap', 'user', 0)}

                {renderInput('email', 'Email', 'mail', 1, {
                  keyboardType: 'email-address',
                })}

                {renderInput('phone', 'Nomor Telepon', 'phone', 2, {
                  keyboardType: 'phone-pad',
                })}

                {renderInput('address', 'Alamat', 'map-pin', 3, {
                  multiline: true,
                  numberOfLines: 3,
                })}

                {renderInput('password', 'Password', 'lock', 4, {
                  secureTextEntry: !showPassword,
                  showPasswordToggle: true,
                  isPasswordVisible: showPassword,
                  onTogglePassword: togglePasswordVisibility,
                })}

                {renderInput(
                  'confirmPassword',
                  'Konfirmasi Password',
                  'lock',
                  5,
                  {
                    secureTextEntry: !showConfirmPassword,
                    showPasswordToggle: true,
                    isPasswordVisible: showConfirmPassword,
                    onTogglePassword: toggleConfirmPasswordVisibility,
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
                    style={{
                      shadowColor: DESIGN_TOKENS.colors.primary,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 12,
                      elevation: 6, // For Android shadow
                    }}
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
                        opacity: isLoading ? 0.8 : 1,
                      }}
                    >
                      {isLoading && (
                        <View style={{ marginRight: DESIGN_TOKENS.spacing.sm }}>
                          <LoadingSpinner />
                        </View>
                      )}
                      <Text
                        style={{
                          ...DESIGN_TOKENS.typography.button,
                          color: DESIGN_TOKENS.colors.textTertiary,
                        }}
                      >
                        {isLoading ? 'Mendaftar...' : 'Daftar Sekarang'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>

                {/* Login Link */}
                <Animated.View
                  style={{
                    alignItems: 'center',
                    transform: [{ translateY: buttonAnim }],
                  }}
                >
                  <Link href='/login' asChild>
                    <TouchableOpacity activeOpacity={0.7}>
                      <View style={{ flexDirection: 'row' }}>
                        <Text
                          style={{
                            ...DESIGN_TOKENS.typography.caption,
                            fontWeight: '400',
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
                </Animated.View>
              </View>
            </Animated.View>
          </ScrollView>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
