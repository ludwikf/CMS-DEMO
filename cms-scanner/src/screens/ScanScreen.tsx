import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";
import { parseWarehouseQr } from "../lib/warehousePayload";
import { getIntakeApiUrl } from "../api/intake";

type Props = NativeStackScreenProps<RootStackParamList, "Scan">;

export default function ScanScreen({ navigation }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const scannedRef = useRef(false);
  const [active, setActive] = useState(true);

  useFocusEffect(
    useCallback(() => {
      scannedRef.current = false;
      setActive(true);
    }, [])
  );

  const onBarcodeScanned = useCallback(
    ({ data }: { data: string }) => {
      if (!active || scannedRef.current) return;
      scannedRef.current = true;
      setActive(false);

      try {
        const payload = parseWarehouseQr(data);
        navigation.navigate("Preview", { payload });
      } catch {
        Alert.alert(
          "Nieprawidłowy kod QR",
          "Kod nie zawiera poprawnych danych dostawy magazynowej.",
          [
            {
              text: "OK",
              onPress: () => {
                scannedRef.current = false;
                setActive(true);
              },
            },
          ]
        );
      }
    },
    [active, navigation]
  );

  if (!permission) {
    return (
      <View style={styles.centered}>
        <Text style={styles.message}>Ładowanie uprawnień aparatu…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Text style={styles.message}>
          Aplikacja potrzebuje dostępu do aparatu, aby skanować kody QR.
        </Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Zezwól na aparat</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={active ? onBarcodeScanned : undefined}
      />
      <View style={styles.overlay}>
        <Text style={styles.title}>CMS Scanner</Text>
        <Text style={styles.hint}>Skieruj aparat na kod QR dostawy</Text>
        <Text style={styles.api}>API: {getIntakeApiUrl()}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#111",
  },
  message: { color: "#fff", textAlign: "center", marginBottom: 16 },
  button: {
    backgroundColor: "#e80050",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  buttonText: { color: "#fff", fontWeight: "600" },
  overlay: {
    position: "absolute",
    bottom: 48,
    left: 16,
    right: 16,
    backgroundColor: "rgba(0,0,0,0.55)",
    padding: 16,
    borderRadius: 12,
  },
  title: { color: "#fff", fontSize: 20, fontWeight: "700" },
  hint: { color: "#ddd", marginTop: 4 },
  api: { color: "#aaa", fontSize: 11, marginTop: 8 },
});
