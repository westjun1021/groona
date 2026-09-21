
import {Stack} from "expo-router";
export default function Layout(){
  return <Stack screenOptions={{headerShown:false}}>
    <Stack.Screen name="(tabs)"/>
    <Stack.Screen name="activity/[id]"/>
    <Stack.Screen name="login"/>
    <Stack.Screen name="children"/>
    <Stack.Screen name="settings"/>
  </Stack>
}
