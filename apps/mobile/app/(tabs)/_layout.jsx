
import {Tabs} from "expo-router";
import {Text} from "react-native";
import {useTheme} from "../../src/theme";
const I=({x,color})=><Text style={{fontSize:20,color}}>{x}</Text>;
export default function TabsLayout(){
 const {C}=useTheme();
 return <Tabs screenOptions={{headerShown:false,tabBarActiveTintColor:C.blue,tabBarInactiveTintColor:C.muted,
   tabBarStyle:{backgroundColor:C.card,borderTopColor:C.line},sceneStyle:{backgroundColor:C.bg}}}>
  <Tabs.Screen name="index" options={{title:"홈",tabBarIcon:({color})=><I x="⌂" color={color}/>}}/>
  <Tabs.Screen name="explore" options={{title:"탐색",tabBarIcon:({color})=><I x="⌕" color={color}/>}}/>
  <Tabs.Screen name="favorites" options={{title:"찜",tabBarIcon:({color})=><I x="♡" color={color}/>}}/>
  <Tabs.Screen name="growth" options={{title:"성장",tabBarIcon:({color})=><I x="↗" color={color}/>}}/>
  <Tabs.Screen name="profile" options={{title:"마이",tabBarIcon:({color})=><I x="◎" color={color}/>}}/>
 </Tabs>
}
