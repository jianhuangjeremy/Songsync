import React from 'react';
import { View, Text } from 'react-native';

export default function SimpleTest() {
  console.log('SimpleTest component is rendering');
  
  return (
    <View style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#000'
    }}>
      <Text style={{
        color: '#fff',
        fontSize: 24
      }}>
        SongSync Web Test - Working!
      </Text>
    </View>
  );
}
