import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserType } from '../types';

export const saveUser = async (value: UserType) => {
  try {
    console.log('data yang akan di save', JSON.stringify(value));

    await AsyncStorage.setItem('user', JSON.stringify(value));
  } catch (error) {
    console.log('Terjadi error ketika menyimpan data', error);
    throw Error('Terjadi error' + error);
  }
};

export const getUser = async () => {
  try {
    const result = await AsyncStorage.getItem('user');
    return result;
  } catch (error) {
    console.log('Terjadi error ketika menyimpan data', error);
    throw Error('Terjadi error' + error);
  }
};
