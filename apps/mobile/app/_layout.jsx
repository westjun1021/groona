
import React,{useEffect,useState} from "react";
import {Stack,router} from "expo-router";
import {StatusBar,View} from "react-native";
import {ThemeProvider,useTheme} from "../src/theme";
import {isOnboarded,setOnboarded} from "../src/onboarding";
import {token} from "../src/api";
import {ToastProvider} from "../src/ui";
function Root(){
  const {C,dark}=useTheme();
  const [gate,setGate]=useState(null);   // null = 아직 확인 중 | "home" | "onboarding"
  useEffect(()=>{(async()=>{
   const [t,done]=await Promise.all([token(),isOnboarded()]);
   // 로그인한 사용자에게는 온보딩을 보여주지 않는다. 이때 플래그도 함께 세워 두어야
   // 나중에 로그아웃했을 때 온보딩이 다시 뜨지 않는다.
   if(t&&!done)setOnboarded();
   setGate(t||done?"home":"onboarding");
  })()},[]);
  // 확인이 끝나기 전에는 첫 화면을 그리지 않는다(온보딩이 필요한데 홈이 먼저 번쩍이지 않도록).
  useEffect(()=>{if(gate==="onboarding")router.replace("/onboarding")},[gate]);
  if(gate===null)return <View style={{flex:1,backgroundColor:C.bg}}/>;
  return <>
    <StatusBar barStyle={dark?"light-content":"dark-content"} backgroundColor={C.bg}/>
    <Stack screenOptions={{headerShown:false,contentStyle:{backgroundColor:C.bg}}}>
      <Stack.Screen name="(tabs)"/>
      <Stack.Screen name="onboarding"/>
      <Stack.Screen name="activity/[id]"/>
      <Stack.Screen name="login"/>
      <Stack.Screen name="children"/>
      <Stack.Screen name="settings"/>
    </Stack>
  </>;
}
export default function Layout(){
  return <ThemeProvider><ToastProvider><Root/></ToastProvider></ThemeProvider>;
}
