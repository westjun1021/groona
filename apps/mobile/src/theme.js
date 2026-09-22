
import React,{createContext,useCallback,useContext,useEffect,useMemo,useState} from "react";
import {useColorScheme} from "react-native";
import * as SecureStore from "expo-secure-store";
const KEY="groona_theme_mode";
// 라이트 팔레트는 기존 값을 그대로 유지한다.
export const lightC={
  bg:"#F6FAFC", card:"#FFFFFF", navy:"#19384B", blue:"#4DA3FF",
  mint:"#72D6B4", yellow:"#FFD166", line:"#E5EDF2", muted:"#718096",
  soft:"#EAF4FF", green:"#1F8A70", danger:"#C94C4C",
  // 화면에 흩어져 있던 고정 색들을 역할별 토큰으로 모은 것(다크에서 뒤집히는 값들)
  onAccent:"#FFFFFF",      // 파란 버튼 위 글자
  divider:"#EFF3F5",       // 패널 내부 구분선
  skeleton:"#EDF2F5",      // 로딩 자리표시
  chipBg:"#EEF3F6", chipOnBg:"#EAF4FF", chipOnLine:"#BDDFFF",
  tagBg:"#F2F6F8", tagText:"#4F6473",
  successSoft:"#EAF9F5", dangerSoft:"#FBEDED", dangerLine:"#E5B6B6",
  infoFg:"#2F7FD1", warn:"#B7791F", heartOff:"#C3D0D8",
  heroBg:"#19384B", heroTitle:"#FFFFFF", heroText:"#DAE7EC",
  dim:"rgba(25,56,75,0.35)", editBg:"#F5FAFF",
  statusBar:"dark"
};
export const darkC={
  bg:"#0F1720", card:"#1B2430", navy:"#E7EEF3", blue:"#4DA3FF",
  mint:"#72D6B4", yellow:"#FFD166", line:"#2A3644", muted:"#8FA0AE",
  soft:"#16324B", green:"#34C79A", danger:"#E06B6B",
  onAccent:"#0F1720",      // 밝은 파랑 위에는 어두운 글자가 훨씬 잘 읽힌다
  divider:"#232E3B",
  skeleton:"#243040",
  chipBg:"#1E2936", chipOnBg:"#16324B", chipOnLine:"#2E6FA8",
  tagBg:"#1E2936", tagText:"#A8BDCC",
  successSoft:"#12302A", dangerSoft:"#3A1F22", dangerLine:"#5E3236",
  infoFg:"#7FC0FF", warn:"#E0A33E", heartOff:"#4A5A6B",
  // 다크에서 navy 는 '밝은 본문색'이라 히어로 배경으로 쓸 수 없다. 별도 배경을 둔다.
  heroBg:"#16212C", heroTitle:"#E7EEF3", heroText:"#A9BCC8",
  dim:"rgba(0,0,0,0.55)", editBg:"#16324B",
  statusBar:"light"
};
const ThemeCtx=createContext({mode:"system",C:lightC,dark:false,setMode:()=>{}});
export function ThemeProvider({children}){
 const system=useColorScheme();            // 기기 설정: "light" | "dark" | null
 const [mode,setModeState]=useState("system");
 useEffect(()=>{(async()=>{
  try{
   const v=await SecureStore.getItemAsync(KEY);
   if(v==="light"||v==="dark"||v==="system")setModeState(v);
  }catch(e){}                              // 저장소를 못 읽으면 시스템 모드로 둔다
 })()},[]);
 const setMode=useCallback(next=>{
  setModeState(next);
  SecureStore.setItemAsync(KEY,next).catch(()=>{});
 },[]);
 const dark=mode==="dark"||(mode==="system"&&system==="dark");
 const value=useMemo(()=>({mode,setMode,dark,C:dark?darkC:lightC}),[mode,setMode,dark]);
 return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}
export function useTheme(){return useContext(ThemeCtx)}
// 정적 import 가 남아 있어도 깨지지 않도록 두는 기본값(모드 전환에는 반응하지 않는다).
export const C=lightC;
