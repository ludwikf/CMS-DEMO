import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import ScanScreen from "./src/screens/ScanScreen";
import PreviewScreen from "./src/screens/PreviewScreen";
import type { WarehouseIntakePayload } from "./src/lib/warehousePayload";

export type RootStackParamList = {
  Scan: undefined;
  Preview: { payload: WarehouseIntakePayload };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="Scan" component={ScanScreen} />
        <Stack.Screen name="Preview" component={PreviewScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
