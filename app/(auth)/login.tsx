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

import { useAuth } from '@/contexts/authContext'; // Add AuthContext
import { DESIGN_TOKENS } from '../../constants/designTokens'; // Import DESIGN_TOKENS

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

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

// Login request payload
interface LoginPayload {
  email: string;
  password: string;
}

type FeatherIconName = 'mail' | 'lock' | 'eye' | 'eye-off' | 'loader';

export default function LoginScreen() {
  const router = useRouter();
  const { login: authLogin } = useAuth(); // Use AuthContext login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const spinValue = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const headerAnim = useRef(
    new Animated.Value(-DESIGN_TOKENS.spacing.md)
  ).current; // Use DESIGN_TOKENS
  const inputAnimRefs = useRef([
    new Animated.Value(DESIGN_TOKENS.spacing.md), // Use DESIGN_TOKENS
    new Animated.Value(DESIGN_TOKENS.spacing.lg), // Use DESIGN_TOKENS
  ]).current;
  const buttonAnim = useRef(
    new Animated.Value(DESIGN_TOKENS.spacing.xxl)
  ).current; // Use DESIGN_TOKENS

  const startEntranceAnimation = useCallback((): void => {
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
  }, [fadeAnim, scaleAnim, headerAnim, inputAnimRefs, buttonAnim]);

  useEffect(() => {
    startEntranceAnimation();
  }, [startEntranceAnimation]);

  const startSpinning = useCallback(() => {
    spinValue.setValue(0);
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();
  }, [spinValue]);

  useEffect(() => {
    if (isLoading) {
      startSpinning();
    } else {
      spinValue.stopAnimation();
    }
  }, [isLoading, spinValue, startSpinning]);

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

  const validateEmail = useCallback((inputEmail: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!inputEmail.trim()) {
      setEmailError('Email diperlukan');
      return false;
    }
    if (!emailRegex.test(inputEmail)) {
      setEmailError('Format email tidak valid');
      return false;
    }
    setEmailError('');
    return true;
  }, []);

  const validatePassword = useCallback((inputPassword: string): boolean => {
    if (!inputPassword) {
      setPasswordError('Password diperlukan');
      return false;
    }
    // Using minLength from DESIGN_TOKENS for consistency if defined, otherwise default to 6
    // Note: DESIGN_TOKENS.typography doesn't have minLength for password, so keep 6 for now
    if (inputPassword.length < 6) {
      setPasswordError('Password minimal 6 karakter');
      return false;
    }
    setPasswordError('');
    return true;
  }, []);

  const handleLogin = async (): Promise<void> => {
    if (isLoading) return;

    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
      Alert.alert(
        'Login Gagal',
        'Mohon periksa kembali email dan password Anda.'
      );
      return;
    }

    setIsLoading(true);
    animateButtonPress();

    try {
      const payload: LoginPayload = { email, password };

      // Use AuthContext login instead of direct API call
      await authLogin(payload);
      console.log('Login successful through AuthContext');

      // Navigate to home after successful login
      Animated.timing(scaleAnim, {
        toValue: 1.02,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        router.navigate('/home');
      });
    } catch (error: unknown) {
      console.error('Login error:', error);
      Alert.alert(
        'Error',
        'Terjadi kesalahan jaringan atau server. Silakan coba lagi nanti.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const renderInput = (
    fieldId: string,
    value: string,
    onChangeText: (text: string) => void,
    onBlur: () => void,
    placeholder: string,
    icon: FeatherIconName,
    error: string,
    anim: Animated.Value,
    isPassword?: boolean,
    showPassword?: boolean,
    onTogglePassword?: () => void
  ) => {
    const hasError: boolean = !!error;
    const isFocused: boolean = focusedField === fieldId;

    return (
      <Animated.View
        style={{
          marginBottom: DESIGN_TOKENS.spacing.md,
          transform: [{ translateY: anim }],
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
            <TextInput
              style={{
                flex: 1,
                ...DESIGN_TOKENS.typography.body,
                color: DESIGN_TOKENS.colors.textPrimary,
              }}
              placeholder={placeholder}
              placeholderTextColor={DESIGN_TOKENS.colors.textSecondary}
              value={value}
              onChangeText={onChangeText}
              onFocus={() => setFocusedField(fieldId)}
              onBlur={() => {
                setFocusedField(null);
                onBlur();
              }}
              keyboardType={isPassword ? 'default' : 'email-address'}
              secureTextEntry={isPassword ? !showPassword : false}
              autoCapitalize={isPassword ? 'none' : 'none'}
              autoCorrect={false}
            />
            {isPassword && onTogglePassword && (
              <TouchableOpacity
                onPress={onTogglePassword}
                style={{ padding: DESIGN_TOKENS.spacing.xs }} // Use DESIGN_TOKENS
              >
                <Feather
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color={DESIGN_TOKENS.colors.textSecondary}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
        {hasError && (
          <Text
            style={{
              ...DESIGN_TOKENS.typography.error,
              color: DESIGN_TOKENS.colors.error,
              marginTop: DESIGN_TOKENS.spacing.sm, // Use DESIGN_TOKENS
              marginLeft: DESIGN_TOKENS.spacing.xs, // Use DESIGN_TOKENS
            }}
          >
            {error}
          </Text>
        )}
      </Animated.View>
    );
  };

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

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
                      fontFamily: DESIGN_TOKENS.typography.baseText.fontFamily,
                    }}
                  >
                    Selamat Datang Kembali
                  </Text>
                </Animated.View>

                {/* Email Input */}
                {renderInput(
                  'email',
                  email,
                  (text) => {
                    setEmail(text);
                    if (emailError) validateEmail(text);
                  },
                  () => validateEmail(email),
                  'Email',
                  'mail',
                  emailError,
                  inputAnimRefs[0],
                  false
                )}

                {/* Password Input */}
                {renderInput(
                  'password',
                  password,
                  (text) => {
                    setPassword(text);
                    if (passwordError) validatePassword(text);
                  },
                  () => validatePassword(password),
                  'Password',
                  'lock',
                  passwordError,
                  inputAnimRefs[1],
                  true,
                  showPassword,
                  () => setShowPassword(!showPassword)
                )}

                <TouchableOpacity
                  style={{
                    alignItems: 'flex-end',
                    marginBottom: DESIGN_TOKENS.spacing.lg,
                    transform: [{ translateY: buttonAnim }],
                  }}
                  onPress={() =>
                    Alert.alert(
                      'Lupa Password?',
                      'Fitur ini akan segera tersedia.'
                    )
                  }
                >
                  <Text
                    style={{
                      ...DESIGN_TOKENS.typography.caption,
                      fontWeight: '400',
                      color: DESIGN_TOKENS.colors.primary,
                    }}
                  >
                    Lupa Password?
                  </Text>
                </TouchableOpacity>

                <Animated.View
                  style={{
                    transform: [{ translateY: buttonAnim }],
                    marginBottom: DESIGN_TOKENS.spacing.lg,
                  }}
                >
                  <TouchableOpacity
                    disabled={isLoading}
                    onPress={handleLogin}
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
                          style={{
                            marginRight: DESIGN_TOKENS.spacing.sm,
                            transform: [{ rotate: spin }],
                          }}
                        >
                          <Feather
                            name='loader'
                            size={20}
                            color={DESIGN_TOKENS.colors.textTertiary}
                          />
                        </Animated.View>
                      )}
                      <Text
                        style={{
                          ...DESIGN_TOKENS.typography.button,
                          color: DESIGN_TOKENS.colors.textTertiary,
                        }}
                      >
                        {isLoading ? 'Memproses...' : 'Masuk'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>

                <Animated.View
                  style={{
                    alignItems: 'center',
                    transform: [{ translateY: buttonAnim }],
                  }}
                >
                  <Link href='/register' asChild>
                    <TouchableOpacity activeOpacity={0.7}>
                      <View style={{ flexDirection: 'row' }}>
                        <Text
                          style={{
                            ...DESIGN_TOKENS.typography.caption,
                            fontWeight: '400',
                            color: DESIGN_TOKENS.colors.textPrimary,
                          }}
                        >
                          Belum memiliki akun?{' '}
                        </Text>
                        <Text
                          style={{
                            ...DESIGN_TOKENS.typography.caption,
                            fontWeight: '600',
                            color: DESIGN_TOKENS.colors.primary,
                          }}
                        >
                          Daftar
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
