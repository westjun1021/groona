
import {Tabs} from "expo-router";
import {Text} from "react-native";
import {C} from "../../src/theme";
const I=({x,color})=><Text style={{fontSize:20,color}}>{x}</Text>;
export default function TabsLayout(){
 return <Tabs screenOptions={{headerShown:false,tabBarActiveTintColor:C.blue,tabBarInactiveTintColor:"#94A3AD"}}>
  <Tabs.Screen name="index" options={{title:"홈",tabBarIcon:({color})=><I x="⌂" color={color}/>}}/>
  <Tabs.Screen name="explore" options={{title:"탐색",tabBarIcon:({color})=><I x="⌕" color={color}/>}}/>
  <Tabs.Screen name="favorites" options={{title:"찜",tabBarIcon:({color})=><I x="♡" color={color}/>}}/>
  <Tabs.Screen name="growth" options={{title:"성장",tabBarIcon:({color})=><I x="↗" color={color}/>}}/>
  <Tabs.Screen name="profile" options={{title:"마이",tabBarIcon:({color})=><I x="◎" color={color}/>}}/>
 </Tabs>
}
