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

import { DESIGN_TOKENS } from '../../constants/designTokens'; // Import DESIGN_TOKENS
import { login } from '../../services/auth';
import { saveUser } from '../../utils/user';

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

// Latar belakang yang sama untuk konsistensi
const BACKGROUND_IMAGE_URI =
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80';

type FeatherIconName = 'mail' | 'lock' | 'eye' | 'eye-off' | 'loader';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

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

  useEffect(() => {
    startEntranceAnimation();
  }, []);

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
      const response: any = await login(payload);
      console.log('Login response:', response);

      if (response.success && response.user) {
        await saveUser(response.user);

        Animated.timing(scaleAnim, {
          toValue: 1.02,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          router.navigate('/(tabs)/main/Home');
        });
      } else {
        Alert.alert(
          'Login Gagal',
          response.message || 'Email atau password salah.'
        );
      }
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
              name={icon}
              size={20}
              color={
                isFocused
                  ? DESIGN_TOKENS.colors.primary
                  : DESIGN_TOKENS.colors.textSecondary
              }
              style={{ marginRight: DESIGN_TOKENS.spacing.sm }} // Use DESIGN_TOKENS
            />
            <TextInput
              style={{
                flex: 1,
                ...DESIGN_TOKENS.typography.body,
                color: DESIGN_TOKENS.colors.textPrimary,
              }}
              placeholder={placeholder}
              placeholderTextColor={DESIGN_TOKENS.colors.textPlaceholder}
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
        </BlurView>
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
                      Selamat Datang
                    </Text>
                    <Text
                      style={{
                        ...DESIGN_TOKENS.typography.caption, // Use subtitle from DESIGN_TOKENS
                        color: DESIGN_TOKENS.colors.textSecondary,
                        textAlign: 'center',
                        marginTop: DESIGN_TOKENS.spacing.sm,
                      }}
                    >
                      Masuk untuk melanjutkan
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
                          {isLoading ? 'Memproses...' : 'Masuk'}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </Animated.View>

                  <View style={{ alignItems: 'center' }}>
                    <Link href='/register' asChild>
                      <TouchableOpacity activeOpacity={0.7}>
                        <View style={{ flexDirection: 'row' }}>
                          <Text
                            style={{
                              ...DESIGN_TOKENS.typography.caption,
                              fontWeight: '400',
                              color: DESIGN_TOKENS.colors.textSecondary,
                            }}
                          >
                            Belum punya akun?{' '}
                          </Text>
                          <Text
                            style={{
                              ...DESIGN_TOKENS.typography.caption,
                              fontWeight: '600',
                              color: DESIGN_TOKENS.colors.primary,
                            }}
                          >
                            Daftar Sekarang
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
