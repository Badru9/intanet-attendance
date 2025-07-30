import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react'; // Menambahkan useEffect
import {
  Alert,
  Animated,
  ImageBackground, // Import ImageBackground
  KeyboardAvoidingView,
  Platform, // Tetap diimpor karena digunakan untuk KeyboardAvoidingView
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

// Pastikan path ini benar sesuai struktur proyek Anda
import { login } from '../../services/auth';
import { saveUser } from '../utils/user';

// --- Pilihan Warna (dari persyaratan sebelumnya) ---
const PRIMARY_COLOR = '#ffcc00'; // Kuning
// const SECONDARY_COLOR = '#36aac7'; // Tidak digunakan sebagai background polos

const TEXT_ON_DARK_GLASS = 'rgba(255, 255, 255, 0.95)'; // Teks sangat putih untuk kontras
const TEXT_ON_LIGHT_BUTTON = 'rgba(0, 0, 0, 0.85)'; // Teks gelap untuk tombol terang

// URL Gambar Placeholder untuk background
// >>>>> GANTI INI DENGAN URL GAMBAR ANDA SENDIRI atau require('./path/to/your/image.jpg') <<<<<
const BACKGROUND_IMAGE_URI =
  'https://images.unsplash.com/photo-1744194210914-0f5b2375645d?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHwxMnx8fGVufDB8fHx8fA%3D%3D';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  // Start animation on component mount
  useEffect(() => {
    // Menggunakan useEffect
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, scaleAnim]); // Menambahkan dependency array

  // Email validation
  const validateEmail = (inputEmail: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!inputEmail) {
      setEmailError('Email tidak boleh kosong');
      return false;
    }
    if (!emailRegex.test(inputEmail)) {
      setEmailError('Format email tidak valid');
      return false;
    }
    setEmailError('');
    return true;
  };

  // Password validation
  const validatePassword = (inputPassword: string) => {
    if (!inputPassword) {
      setPasswordError('Password tidak boleh kosong');
      return false;
    }
    if (inputPassword.length < 6) {
      setPasswordError('Password minimal 6 karakter');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleLogin = async () => {
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (isEmailValid && isPasswordValid) {
      setIsLoading(true);
      try {
        const response = await login({ email, password });
        console.log('response on login', response);

        if (response.success) {
          console.log(response.success);
          await saveUser(response.user);

          Animated.sequence([
            Animated.timing(scaleAnim, {
              toValue: 1.03,
              duration: 150,
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
              toValue: 1,
              duration: 150,
              useNativeDriver: true,
            }),
          ]).start(() => {
            router.navigate('/(tabs)/main/attendance');
          });
        } else {
          Alert.alert(
            'Login Gagal',
            response.message || 'Email atau password salah'
          );
        }
      } catch (error) {
        console.log('Error on Login', error);
        Alert.alert(
          'Error',
          'Terjadi kesalahan saat login. Silakan coba lagi.'
        );
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Floating elements tidak lagi diperlukan karena background image sudah cukup
  // memberikan visual interest.

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className='flex-1'
    >
      <StatusBar
        barStyle='light-content' // Umumnya cocok untuk gambar background
        translucent
        backgroundColor='transparent'
      />

      {/* ImageBackground sebagai pengganti background polos */}
      <ImageBackground
        source={{ uri: BACKGROUND_IMAGE_URI }}
        resizeMode='cover' // Sesuaikan mode resize sesuai kebutuhan (cover, contain, stretch, repeat, center)
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
      >
        {/* Blur overlay untuk memastikan kontras teks (seperti di iOS) */}
        <BlurView
          intensity={10}
          tint='dark'
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            flex: 1, // Penting agar BlurView mengambil seluruh ruang yang tersedia
          }}
        >
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: 'center',
              alignItems: 'center',
              paddingVertical: 40,
            }}
            showsVerticalScrollIndicator={false}
          >
            <View className='flex-1 items-center justify-center px-6'>
              {/* Main Glass Container with Animation */}
              <Animated.View
                style={{
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
                  width: '100%',
                  maxWidth: 400,
                  paddingHorizontal: 20,
                }}
              >
                <BlurView
                  intensity={20}
                  tint='dark'
                  className='w-full rounded-3xl overflow-hidden'
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.13)', // Sesuai dengan background dari CSS glass
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.44)', // Sesuai dengan border dari CSS glass
                    shadowColor: 'rgba(0, 0, 0, 0.1)', // Sesuai dengan box-shadow dari CSS glass
                    shadowOffset: {
                      width: 0,
                      height: 4, // Sesuai dengan offset dari CSS glass
                    },
                    shadowOpacity: 0.2, // Menggunakan 0.2 karena 0.1 di CSS itu lebih rendah di RN
                    shadowRadius: 15, // Disesuaikan agar mendekati 30px di CSS glass
                    elevation: 5,
                  }}
                >
                  <View className='p-8'>
                    {/* Header */}
                    <View className='items-center mb-10'>
                      <Text
                        style={{
                          fontSize: 36, // Font size yang proporsional untuk judul utama
                          fontWeight: '700', // Bold
                          color: TEXT_ON_DARK_GLASS, // Warna teks putih terang
                          letterSpacing: 0.5, // Sedikit letter spacing untuk modern look
                        }}
                      >
                        Selamat Datang!
                      </Text>
                      <Text
                        style={{
                          fontSize: 17, // Font size yang proporsional untuk sub-judul
                          fontWeight: '400', // Regular
                          color: 'rgba(255, 255, 255, 0.8)', // Agak transparan untuk sub-judul
                          textAlign: 'center',
                          marginTop: 4, // Sedikit spasi dari judul
                        }}
                      >
                        Silakan login untuk melanjutkan
                      </Text>
                    </View>

                    {/* Email Input */}
                    <View className='mb-4'>
                      <BlurView
                        intensity={12} // Sedikit lebih blur dari container utama agar terlihat berbeda
                        tint='dark'
                        className='rounded-xl overflow-hidden'
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.05)', // Background input lebih transparan
                          borderWidth: 0.7, // Border input lebih tipis dan halus
                          borderColor: emailError
                            ? 'rgba(255, 99, 71, 0.8)' // Tomat Red untuk error
                            : 'rgba(255, 255, 255, 0.2)', // Normal border
                          shadowColor: 'rgba(0, 0, 0, 0.05)', // Shadow input sangat halus
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: 0.1,
                          shadowRadius: 3,
                          elevation: 1,
                        }}
                      >
                        <View className='flex-row items-center'>
                          <View className='pl-4'>
                            <Feather
                              name='mail'
                              size={20}
                              color={TEXT_ON_DARK_GLASS} // Warna icon putih terang
                            />
                          </View>
                          <TextInput
                            className='flex-1 h-14 px-3'
                            style={{
                              fontSize: 16, // Font size input
                              fontWeight: '500', // Medium
                              color: TEXT_ON_DARK_GLASS, // Warna teks input
                              backgroundColor: 'transparent', // Pastikan transparan
                            }}
                            placeholder='Email'
                            placeholderTextColor='rgba(255, 255, 255, 0.5)' // Placeholder lebih transparan untuk iOS look
                            keyboardType='email-address'
                            autoCapitalize='none'
                            value={email}
                            onChangeText={(text) => {
                              setEmail(text);
                              if (emailError) validateEmail(text);
                            }}
                            onBlur={() => validateEmail(email)}
                          />
                        </View>
                      </BlurView>
                      {emailError ? (
                        <Text className='text-red-400 text-xs mt-1 ml-2 font-medium'>
                          {emailError}
                        </Text>
                      ) : null}
                    </View>

                    {/* Password Input */}
                    <View className='mb-6'>
                      <BlurView
                        intensity={12}
                        tint='dark'
                        className='rounded-xl overflow-hidden'
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          borderWidth: 0.7,
                          borderColor: passwordError
                            ? 'rgba(255, 99, 71, 0.8)'
                            : 'rgba(255, 255, 255, 0.2)',
                          shadowColor: 'rgba(0, 0, 0, 0.05)',
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: 0.1,
                          shadowRadius: 3,
                          elevation: 1,
                        }}
                      >
                        <View className='flex-row items-center'>
                          <View className='pl-4'>
                            <Feather
                              name='lock'
                              size={20}
                              color={TEXT_ON_DARK_GLASS}
                            />
                          </View>
                          <TextInput
                            className='flex-1 h-14 px-3'
                            style={{
                              fontSize: 16, // Font size input
                              fontWeight: '500', // Medium
                              color: TEXT_ON_DARK_GLASS, // Warna teks input
                              backgroundColor: 'transparent',
                            }}
                            placeholder='Password'
                            placeholderTextColor='rgba(255, 255, 255, 0.5)'
                            secureTextEntry={!showPassword}
                            value={password}
                            onChangeText={(text) => {
                              setPassword(text);
                              if (passwordError) validatePassword(text);
                            }}
                            onBlur={() => validatePassword(password)}
                          />
                          <TouchableOpacity
                            className='pr-4'
                            onPress={() => setShowPassword(!showPassword)}
                          >
                            <Feather
                              name={showPassword ? 'eye-off' : 'eye'}
                              size={20}
                              color={TEXT_ON_DARK_GLASS}
                            />
                          </TouchableOpacity>
                        </View>
                      </BlurView>
                      {passwordError ? (
                        <Text className='text-red-400 text-xs mt-1 ml-2 font-medium'>
                          {passwordError}
                        </Text>
                      ) : null}
                    </View>

                    {/* Forgot Password */}
                    <TouchableOpacity
                      className='items-end mb-8'
                      onPress={() =>
                        Alert.alert(
                          'Lupa Password?',
                          'Fitur ini akan segera tersedia.'
                        )
                      }
                    >
                      <Text
                        style={{
                          fontSize: 14, // Font size proporsional
                          fontWeight: '500', // Medium
                          color: 'rgba(255, 255, 255, 0.7)', // Agak transparan
                        }}
                      >
                        Lupa Password?
                      </Text>
                    </TouchableOpacity>

                    {/* Login Button */}
                    <TouchableOpacity
                      disabled={isLoading}
                      onPress={handleLogin}
                      activeOpacity={0.7}
                    >
                      <LinearGradient
                        colors={[PRIMARY_COLOR, PRIMARY_COLOR]} // Menggunakan warna primary (kuning)
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        className='rounded-xl overflow-hidden'
                        style={{
                          // iOS-like shadow for buttons
                          shadowColor: 'rgba(255, 204, 0, 0.3)', // Shadow yang menyala dari warna tombol
                          shadowOffset: {
                            width: 0,
                            height: 4, // Offset tidak terlalu besar
                          },
                          shadowOpacity: 0.6, // Opacity shadow lumayan terlihat
                          shadowRadius: 10, // Radius sedang
                          elevation: 5,
                        }}
                      >
                        <View
                          className={`h-14 items-center justify-center flex-row ${
                            isLoading ? 'opacity-70' : 'opacity-100'
                          }`}
                        >
                          {isLoading && (
                            <View className='mr-2'>
                              <Feather
                                name='loader'
                                size={20}
                                color={TEXT_ON_LIGHT_BUTTON}
                              />
                            </View>
                          )}
                          <Text
                            style={{
                              fontSize: 18, // Font size tombol konsisten
                              fontWeight: '700', // Bold
                              color: TEXT_ON_LIGHT_BUTTON, // Teks gelap untuk kontras dengan kuning
                            }}
                          >
                            {isLoading ? 'Loading...' : 'Login'}
                          </Text>
                        </View>
                      </LinearGradient>
                    </TouchableOpacity>

                    {/* Register Link */}
                    <View className='items-center mt-8'>
                      <Link href='/register' asChild>
                        <TouchableOpacity activeOpacity={0.7}>
                          <View className='flex-row'>
                            <Text
                              style={{
                                fontSize: 14, // Font size konsisten
                                fontWeight: '400', // Regular
                                color: 'rgba(255, 255, 255, 0.7)', // Agak transparan
                              }}
                            >
                              Belum memiliki akun?{' '}
                            </Text>
                            <Text
                              style={{
                                fontSize: 14, // Font size konsisten
                                fontWeight: '600', // Semi-bold untuk link
                                color: TEXT_ON_DARK_GLASS, // Warna link
                                textDecorationLine: 'underline', // Underline untuk link
                              }}
                            >
                              Daftar
                            </Text>
                          </View>
                        </TouchableOpacity>
                      </Link>
                    </View>
                  </View>
                </BlurView>
              </Animated.View>
            </View>
          </ScrollView>
        </BlurView>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
}
