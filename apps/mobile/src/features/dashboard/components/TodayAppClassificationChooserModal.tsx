import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { TodayAppBreakdownItem } from '../../../application/models/TodayAppBreakdownItem';
import type { ExplicitActivityClassification } from '../../../domain/classification/appUserClassificationRule';
import type { ThemedScreenColors } from '../../../shared/styles/useThemedScreenColors';
import { formatActivityClassificationLabel } from '../../../shared/utils/formatActivityClassificationLabel';
import { EXPLICIT_APP_CLASSIFICATION_OPTIONS } from '../explicitAppClassificationOptions';

type TodayAppClassificationChooserModalProps = {
  visible: boolean;
  item: TodayAppBreakdownItem | null;
  explicitAppClassification: ExplicitActivityClassification | null;
  loadingExplicitState: boolean;
  mutating: boolean;
  colors: ThemedScreenColors;
  onSelect: (classification: ExplicitActivityClassification) => void;
  onClear: () => void;
  onCancel: () => void;
};

export function TodayAppClassificationChooserModal({
  visible,
  item,
  explicitAppClassification,
  loadingExplicitState,
  mutating,
  colors,
  onSelect,
  onClear,
  onCancel,
}: TodayAppClassificationChooserModalProps) {
  if (item == null) {
    return null;
  }

  const displayLabel = item.displayName ?? item.packageName;
  const effectiveLabel = formatActivityClassificationLabel(
    item.classification,
    item.hasMixedClassification,
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}>
      <Pressable
        style={styles.backdrop}
        accessibilityRole="button"
        accessibilityLabel="Dismiss classification chooser"
        onPress={onCancel}>
        <Pressable
          testID="today-app-classification-chooser"
          style={[
            styles.sheet,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
          onPress={() => {}}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {displayLabel}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Effective classification: {effectiveLabel}
          </Text>

          {loadingExplicitState ? (
            <ActivityIndicator accessibilityLabel="Loading app rule state" />
          ) : (
            <>
              {EXPLICIT_APP_CLASSIFICATION_OPTIONS.map(option => (
                <Pressable
                  key={option.classification}
                  testID={`today-app-classify:${item.packageName}:${option.classification}`}
                  accessibilityRole="button"
                  accessibilityLabel={option.accessibilityLabel}
                  accessibilityState={{ disabled: mutating }}
                  disabled={mutating}
                  onPress={() => onSelect(option.classification)}
                  style={({ pressed }) => [
                    styles.option,
                    { borderBottomColor: colors.border },
                    pressed && !mutating ? styles.optionPressed : undefined,
                  ]}>
                  <Text style={[styles.optionLabel, { color: colors.textPrimary }]}>
                    {option.label}
                  </Text>
                </Pressable>
              ))}

              {explicitAppClassification != null ? (
                <Pressable
                  testID={`today-app-clear:${item.packageName}`}
                  accessibilityRole="button"
                  accessibilityLabel="Clear classification"
                  accessibilityState={{ disabled: mutating }}
                  disabled={mutating}
                  onPress={onClear}
                  style={({ pressed }) => [
                    styles.option,
                    styles.clearOption,
                    pressed && !mutating ? styles.optionPressed : undefined,
                  ]}>
                  <Text style={[styles.clearLabel, { color: colors.textPrimary }]}>
                    Clear classification
                  </Text>
                </Pressable>
              ) : null}
            </>
          )}

          {mutating ? (
            <View style={styles.mutatingRow}>
              <ActivityIndicator accessibilityLabel="Saving classification" />
              <Text style={[styles.mutatingText, { color: colors.textSecondary }]}>
                Saving…
              </Text>
            </View>
          ) : null}

          <Pressable
            testID="today-app-classify-cancel"
            accessibilityRole="button"
            accessibilityLabel="Cancel"
            accessibilityState={{ disabled: mutating }}
            disabled={mutating}
            onPress={onCancel}
            style={({ pressed }) => [
              styles.cancel,
              pressed && !mutating ? styles.optionPressed : undefined,
            ]}>
            <Text style={[styles.cancelLabel, { color: colors.textSecondary }]}>
              Cancel
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
    gap: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 12,
  },
  option: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionPressed: {
    opacity: 0.7,
  },
  optionLabel: {
    fontSize: 17,
  },
  clearOption: {
    marginTop: 8,
    borderBottomWidth: 0,
  },
  clearLabel: {
    fontSize: 17,
    fontWeight: '500',
  },
  mutatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
  },
  mutatingText: {
    fontSize: 14,
  },
  cancel: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
});
