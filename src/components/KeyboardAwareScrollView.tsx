import { ReactNode, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  findNodeHandle,
  Keyboard,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  ScrollViewProps,
  TextInput,
} from 'react-native';

type Props = ScrollViewProps & {
  children: ReactNode;
  extraKeyboardSpace?: number;
};

function getFocusedInput(): ReturnType<typeof TextInput.State.currentlyFocusedInput> {
  return TextInput.State.currentlyFocusedInput?.() ?? null;
}

function KeyboardAwareScrollView({
  children,
  extraKeyboardSpace = 92,
  onScroll,
  scrollEventThrottle,
  keyboardShouldPersistTaps = 'handled',
  keyboardDismissMode = 'on-drag',
  contentContainerStyle,
  ...props
}: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const scrollYRef = useRef(0);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const scrollFocusedInputIntoView = (keyboardHeight: number) => {
      const scrollAttempt = () => {
        const focusedInput = getFocusedInput();
        if (!focusedInput) {
          return;
        }

        const scrollResponder = scrollRef.current?.getScrollResponder?.();
        const inputNode = findNodeHandle(focusedInput as never);
        if (scrollResponder && inputNode) {
          scrollResponder.scrollResponderScrollNativeHandleToKeyboard(
            inputNode,
            extraKeyboardSpace,
            true,
          );
        }

        focusedInput.measureInWindow((_x, y, _width, height) => {
          const screenHeight = Dimensions.get('window').height;
          const visibleBottom = Math.max(
            screenHeight - keyboardHeight - extraKeyboardSpace,
            screenHeight * 0.42,
          );
          const inputBottom = y + height;

          if (inputBottom > visibleBottom) {
            scrollRef.current?.scrollTo({
              y: scrollYRef.current + inputBottom - visibleBottom + 18,
              animated: true,
            });
          }
        });
      };

      setTimeout(scrollAttempt, 60);
      setTimeout(scrollAttempt, 180);
      setTimeout(scrollAttempt, 340);
    };

    const showSubscription = Keyboard.addListener('keyboardDidShow', event => {
      setKeyboardHeight(event.endCoordinates.height);
      scrollFocusedInputIntoView(event.endCoordinates.height);
    });
    const frameSubscription = Keyboard.addListener('keyboardDidChangeFrame', event => {
      setKeyboardHeight(event.endCoordinates.height);
      scrollFocusedInputIntoView(event.endCoordinates.height);
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSubscription.remove();
      frameSubscription.remove();
      hideSubscription.remove();
    };
  }, [extraKeyboardSpace]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollYRef.current = event.nativeEvent.contentOffset.y;
    onScroll?.(event);
  };

  return (
    <ScrollView
      ref={scrollRef}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      keyboardDismissMode={keyboardDismissMode}
      scrollEventThrottle={scrollEventThrottle ?? 16}
      onScroll={handleScroll}
      contentContainerStyle={[
        contentContainerStyle,
        keyboardHeight > 0 && { paddingBottom: keyboardHeight + extraKeyboardSpace },
      ]}
      {...props}
    >
      {children}
    </ScrollView>
  );
}

export default KeyboardAwareScrollView;
