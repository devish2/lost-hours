import type { ReactNode } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  type RefreshControlProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useThemedScreenColors } from '../styles/useThemedScreenColors';

type ScreenScaffoldProps = {
  children: ReactNode;
  scroll?: boolean;
  centered?: boolean;
  refreshControl?: React.ReactElement<RefreshControlProps>;
};

export function ScreenScaffold({
  children,
  scroll = false,
  centered = false,
  refreshControl,
}: ScreenScaffoldProps) {
  const colors = useThemedScreenColors();

  const content = (
    <View
      style={[
        styles.content,
        centered ? styles.centered : undefined,
        !scroll ? styles.flex : undefined,
      ]}>
      {children}
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={['top', 'left', 'right']}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          refreshControl={refreshControl}>
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
  },
  scrollContent: {
    flexGrow: 1,
  },
});
