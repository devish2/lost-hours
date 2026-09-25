/**
 * @format
 */

import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';

import { ActivityClassification } from '../../domain/classification/ActivityClassification';
import { Platform } from '../../domain/platform/Platform';
import { useThemedScreenColors } from '../styles/useThemedScreenColors';
import { TodayAppBreakdownRow } from './TodayAppBreakdownRow';

function RowProbe({
  onPressClassification,
}: {
  onPressClassification: () => void;
}) {
  const colors = useThemedScreenColors();
  return (
    <TodayAppBreakdownRow
      colors={colors}
      item={{
        packageName: 'com.snapchat.android',
        displayName: 'Snapchat',
        platform: Platform.OTHER,
        classification: ActivityClassification.UNKNOWN,
        hasMixedClassification: false,
        hasMixedClassificationSource: false,
        trackedDurationMs: 60_000,
        lostDurationMs: 0,
      }}
      onPressClassification={() => onPressClassification()}
    />
  );
}

describe('TodayAppBreakdownRow', () => {
  it('renders Pressable classification control when callback is provided', () => {
    const onPressClassification = jest.fn();
    let tree!: ReactTestRenderer.ReactTestRenderer;
    act(() => {
      tree = ReactTestRenderer.create(
        <RowProbe onPressClassification={onPressClassification} />,
      );
    });

    const control = tree.root.findByProps({
      testID: 'today-app-classification-control:com.snapchat.android',
    });
    expect(control.props.accessibilityRole).toBe('button');
    act(() => {
      control.props.onPress();
    });
    expect(onPressClassification).toHaveBeenCalledTimes(1);
  });
});
