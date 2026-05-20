import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";
import { IntakeApiError, submitIntake } from "../api/intake";

type Props = NativeStackScreenProps<RootStackParamList, "Preview">;

export default function PreviewScreen({ navigation, route }: Props) {
  const { payload } = route.params;
  const [loading, setLoading] = useState(false);

  const onConfirm = async () => {
    setLoading(true);
    try {
      const result = await submitIntake(payload);
      const summary = result.updated
        .map((u) => `${u.name}: ${u.quantity} ( +${u.added} )`)
        .join("\n");
      Alert.alert("Dodano do magazynu", summary || "Przyjęcie zapisane.", [
        {
          text: "OK",
          onPress: () => navigation.popToTop(),
        },
      ]);
    } catch (error) {
      const message =
        error instanceof IntakeApiError
          ? error.message
          : "Nie udało się połączyć z serwerem cms-demo.";
      Alert.alert("Błąd połączenia", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Podgląd dostawy</Text>
      {payload.label ? <Text style={styles.label}>{payload.label}</Text> : null}
      <Text style={styles.meta}>ID: {payload.intakeId}</Text>

      <FlatList
        data={payload.items}
        keyExtractor={(item, index) => `${item.name}-${index}`}
        style={styles.list}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemQty}>
              {item.quantity} {item.unit ?? "szt"}
            </Text>
          </View>
        )}
      />

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.cancel]}
          onPress={() => navigation.goBack()}
          disabled={loading}
        >
          <Text style={styles.cancelText}>Anuluj</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.confirm]}
          onPress={onConfirm}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.confirmText}>Potwierdź i dodaj</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 56,
    backgroundColor: "#f8fafc",
  },
  title: { fontSize: 22, fontWeight: "700", color: "#1e293b" },
  label: { fontSize: 16, color: "#475569", marginTop: 4 },
  meta: { fontSize: 12, color: "#94a3b8", marginTop: 4, marginBottom: 16 },
  list: { flex: 1 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  itemName: { fontSize: 16, fontWeight: "500", color: "#334155" },
  itemQty: { fontSize: 16, color: "#64748b" },
  actions: { flexDirection: "row", gap: 12, marginTop: 16 },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  cancel: { backgroundColor: "#e2e8f0" },
  confirm: { backgroundColor: "#e80050" },
  cancelText: { color: "#334155", fontWeight: "600" },
  confirmText: { color: "#fff", fontWeight: "600" },
});
