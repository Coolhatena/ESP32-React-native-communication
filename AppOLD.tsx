import React, { useEffect, useState } from 'react';
import { Text, View, PermissionsAndroid, Platform } from 'react-native';
import { BleManager } from 'react-native-ble-plx';

const manager = new BleManager();

export default function App() {
  const [message, setMessage] = useState("Esperando mensaje...");

  useEffect(() => {
    const startScan = async () => {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);
        if (
          granted['android.permission.BLUETOOTH_SCAN'] !== 'granted' ||
          granted['android.permission.ACCESS_FINE_LOCATION'] !== 'granted'
        ) {
          console.warn('Permissions not granted');
          return;
        }
      }

      manager.startDeviceScan(null, null, (error, device) => {
        if (error) {
          console.error('BLE Error:', error);
          return;
        }
        if (device?.name?.includes('Dyson')) {
          console.log('Found:', device.name, device.id);
          manager.stopDeviceScan();
          connectToDevice(device);
        }
      });
    };

    const connectToDevice = async (device: any) => {
      try {
        await device.connect();
        console.log('Device connected!');
        discoverServices(device);
      } catch (error) {
        console.error('Connection error:', error);
      }
    };

    const discoverServices = async (device: any) => {
      const services = await device.discoverAllServicesAndCharacteristics();
      const characteristic = await device.readCharacteristicForService(
        '12345678-1234-1234-1234-1234567890ab',
        'abcd1234-ab12-cd34-ef56-abcdef123456'
      );
      console.log('Characteristic value:', characteristic.value);
      
      device.monitorCharacteristicForService(
        '12345678-1234-1234-1234-1234567890ab',
        'abcd1234-ab12-cd34-ef56-abcdef123456',
        (error: any, characteristic: any) => {
          if (error) {
            console.error('Monitor error:', error);
            return;
          }
          // Decodificar Base64
          const base64Message = characteristic?.value;
          if (base64Message) {
            // Decodificar de Base64 a texto
            const decodedMessage = atob(base64Message); // Usa atob para decodificar Base64
            setMessage(decodedMessage);
          }
        }
      );
    };

    startScan();

    return () => {
      manager.stopDeviceScan();
    };
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Mensaje recibido: {message}</Text>
    </View>
  );
}
