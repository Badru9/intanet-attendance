import { Feather } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import { useLinkBuilder, useTheme } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { JSX, useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

type IconMap = {
  [key: string]: (props: { color: string }) => JSX.Element;
};

const { width: screenWidth } = Dimensions.get('window');
const TAB_WIDTH = 60;
const TAB_MARGIN = 10;
const CONTAINER_PADDING = 5;

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors } = useTheme();
  const { buildHref } = useLinkBuilder();

  // Shared value untuk posisi background slider
  const backgroundPosition = useSharedValue(0);

  const icon: IconMap = {
    home: (props) => <Feather name='home' size={24} {...props} />,
    leave: (props) => <Feather name='calendar' size={24} {...props} />,
    profile: (props) => <Feather name='user' size={24} {...props} />,
  };

  // Update posisi background ketika tab berubah
  useEffect(() => {
    const newPosition = state.index * (TAB_WIDTH + TAB_MARGIN * 2 + 20); // 20 adalah gap
    backgroundPosition.value = withTiming(newPosition, { duration: 300 });
  }, [state.index]);

  // Style animasi untuk background slider
  const animatedBackgroundStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: backgroundPosition.value }],
    };
  });

  return (
    <LinearGradient
      colors={['#999999', '#FAFAFA']}
      start={{ x: 0, y: 1 }}
      end={{ x: 0, y: 0 }}
      style={styles.tabBar}
    >
      <View style={styles.tabBarContainer}>
        {/* Background slider yang bergerak */}
        <Animated.View
          style={[styles.backgroundSlider, animatedBackgroundStyle]}
        />

        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <AnimatedTabBarItem
              key={route.name}
              route={route}
              isFocused={isFocused}
              onPress={onPress}
              onLongPress={onLongPress}
              icon={icon[route.name]}
              options={options}
            />
          );
        })}
      </View>
    </LinearGradient>
  );
}

type AnimatedTabBarItemProps = {
  route: any;
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
  icon: (props: { color: string }) => JSX.Element;
  options: any;
};

const AnimatedTabBarItem = ({
  route,
  isFocused,
  onPress,
  onLongPress,
  icon: Icon,
  options,
}: AnimatedTabBarItemProps) => {
  // Animasi scale untuk efek tekan
  const scaleAnimation = useSharedValue(1);

  const animatedItemStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scaleAnimation.value }],
    };
  });

  const handlePressIn = () => {
    scaleAnimation.value = withTiming(0.95, { duration: 100 });
  };

  const handlePressOut = () => {
    scaleAnimation.value = withTiming(1, { duration: 100 });
    onPress();
  };

  return (
    <PlatformPressable
      href={undefined}
      pressColor='rgba(0, 0, 0, 0.0)'
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={options.tabBarAccessibilityLabel}
      testID={options.tabBarButtonTestID}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onLongPress={onLongPress}
      style={styles.tabBarItem}
    >
      <Animated.View style={[styles.tabBarItemInner, animatedItemStyle]}>
        <Icon color={isFocused ? '#fff' : '#666'} />
      </Animated.View>
    </PlatformPressable>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 50,
  },
  tabBarContainer: {
    position: 'relative',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: CONTAINER_PADDING,
    borderRadius: 50,
    borderColor: '#E0E0E0',
    borderWidth: 1,
    gap: 20,
  },
  backgroundSlider: {
    position: 'absolute',
    backgroundColor: '#007bff',
    width: TAB_WIDTH,
    height: TAB_WIDTH,
    borderRadius: 30,
    left: CONTAINER_PADDING + TAB_MARGIN,
  },
  tabBarItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: TAB_WIDTH,
    height: TAB_WIDTH,
    marginHorizontal: TAB_MARGIN,
    zIndex: 1,
  },
  tabBarItemInner: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
});
