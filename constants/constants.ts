import { ColorValue } from 'react-native';

export const BACKGROUND_IMAGE_URI = '../assets/images/background.png';
export const BACKGROUND_IMAGE_LOGO = '../assets/images/background.png';

export const BUTTON_COLORS: {
  [key: string]: [ColorValue, ColorValue, ...ColorValue[]];
} = {
  primary: ['#3B82F6', '#0056CC'], // Blue for Clock In
  danger: ['#EF4444', '#B91C1C'], // Red for Clock Out
  success: ['#10B981', '#059669'], // Green for Completed
  warning: ['#F59E0B', '#D68200'], // Yellow for Leave
  secondary: ['#6B7280', '#4B5563'], // Gray for Loading/Disabled
};

export const ATTENDANCE_STATUS = {
  clock_in_pending: 'clock_in_pending',
  clock_out_pending: 'clock_out_pending',
  completed: 'completed',
  loading: 'loading',
};
