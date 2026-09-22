
import React,{useEffect,useMemo,useState} from "react";
import {SafeAreaView,ScrollView,Text,View,TouchableOpacity,Switch,StyleSheet,Alert,Linking,Platform} from "react-native";
import {router} from "expo-router";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import {api,setToken,token,API} from "../src/api";import {useTheme} from "../src/theme";import {tap} from "../src/haptics";
const MODES=[["light","라이트"],["dark","다크"],["system","시스템"]];
export default function Settings(){
 const {C,mode,setMode}=useTheme();const s=useMemo(()=>styles(C),[C]);
 const [logged,setLogged]=useState(false),[push,setPush]=useState(false),[busy,setBusy]=useState(false);
 useEffect(()=>{
  token().then(t=>setLogged(!!t));
  Notifications.getPermissionsAsync().then(p=>setPush(p.status==="granted")).catch(()=>{});
 },[]);
 async function logout(){await setToken(null);setLogged(false);router.replace("/")}
 async function onPush(next){
  if(!next){Alert.alert("알림 끄기","기기 설정에서 GROONA 알림을 끌 수 있습니다.",[{text:"취소"},{text:"설정 열기",onPress:()=>Linking.openSettings()}]);return}
  if(!(await token())){router.push("/login");return}
  setBusy(true);
  try{
   let p=await Notifications.getPermissionsAsync();
   if(p.status!=="granted")p=await Notifications.requestPermissionsAsync();
   if(p.status!=="granted"){Alert.alert("알림 권한","기기 설정에서 알림을 허용해 주세요.");return}
   const projectId=Constants.expoConfig?.extra?.eas?.projectId;
   const t=(await Notifications.getExpoPushTokenAsync(projectId?{projectId}:undefined)).data;
   await api.registerPush(t,Platform.OS);
   setPush(true);
   Alert.alert("알림 허용","새로운 지역 프로그램 알림을 받도록 등록했습니다.");
  }catch(e){Alert.alert("알림 등록 실패",e.message)}finally{setBusy(false)}
 }
 function del(){
  Alert.alert("계정 삭제","계정과 연결된 자녀 프로필·기록이 함께 삭제됩니다.",[{text:"취소"},{text:"삭제",style:"destructive",onPress:async()=>{
   try{await api.deleteAccount();await setToken(null);setLogged(false);router.replace("/")}catch(e){Alert.alert("오류",e.message)}
  }}]);
 }
 const version=Constants.expoConfig?.version||"4.0.0";
 return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.content}>
  <TouchableOpacity onPress={()=>router.back()}><Text style={s.back}>‹ 뒤로</Text></TouchableOpacity>
  <Text style={s.title}>설정</Text>
  <Text style={s.head}>화면</Text>
  <View style={s.panel}><View style={s.rowCol}>
   <Text style={s.rowTitle}>화면 테마</Text>
   <Text style={s.rowDesc}>‘시스템’을 고르면 기기의 라이트/다크 설정을 따릅니다. 선택은 앱을 껐다 켜도 유지됩니다.</Text>
   <View style={s.seg}>{MODES.map(([v,label])=>
    <TouchableOpacity key={v} onPress={()=>{tap();setMode(v)}} style={[s.segItem,mode===v&&s.segOn]} accessibilityRole="button" accessibilityState={{selected:mode===v}} accessibilityLabel={`${label} 테마`}>
     <Text style={[s.segText,mode===v&&s.segTextOn]}>{label}</Text>
    </TouchableOpacity>)}</View>
  </View>
  <TouchableOpacity style={s.linkLast} onPress={()=>{tap();router.push({pathname:"/onboarding",params:{review:"1"}})}} accessibilityRole="button" accessibilityLabel="앱 소개 다시 보기">
   <Text style={s.linkText}>앱 소개 다시 보기</Text><Text style={s.arrow}>›</Text>
  </TouchableOpacity></View>
  <Text style={s.head}>알림</Text>
  <View style={s.panel}><View style={s.row}><View style={{flex:1}}><Text style={s.rowTitle}>새 프로그램 알림</Text><Text style={s.rowDesc}>관심 지역에 새로운 공개 프로그램이 등록되면 알려드립니다.</Text></View><Switch value={push} disabled={busy} onValueChange={onPush} trackColor={{true:C.mint}}/></View></View>
  <Text style={s.head}>약관 및 정책</Text>
  <View style={s.panel}>
   <TouchableOpacity style={s.link} onPress={()=>Linking.openURL(API+"/privacy")}><Text style={s.linkText}>개인정보처리방침</Text><Text style={s.arrow}>›</Text></TouchableOpacity>
   <TouchableOpacity style={s.linkLast} onPress={()=>Linking.openURL(API+"/terms")}><Text style={s.linkText}>이용약관</Text><Text style={s.arrow}>›</Text></TouchableOpacity>
  </View>
  <Text style={s.head}>계정</Text>
  {logged?<>
   <TouchableOpacity style={s.btn} onPress={()=>router.push("/children")}><Text style={s.btnText}>자녀 프로필 관리</Text></TouchableOpacity>
   <TouchableOpacity style={s.ghost} onPress={logout}><Text style={s.ghostText}>로그아웃</Text></TouchableOpacity>
   <TouchableOpacity style={s.out} onPress={del}><Text style={s.outText}>계정 및 데이터 삭제</Text></TouchableOpacity>
  </>:<TouchableOpacity style={s.btn} onPress={()=>router.push("/login")}><Text style={s.btnText}>로그인 / 보호자 가입</Text></TouchableOpacity>}
  <Text style={s.version}>GROONA v{version}</Text>
 </ScrollView></SafeAreaView>
}
const styles=C=>StyleSheet.create({safe:{flex:1,backgroundColor:C.bg},content:{padding:18,paddingBottom:60},back:{color:C.blue,fontWeight:"800",marginBottom:16},title:{fontSize:26,fontWeight:"900",color:C.navy},head:{fontSize:12,fontWeight:"900",color:C.muted,marginTop:24,marginBottom:9},panel:{backgroundColor:C.card,borderWidth:1,borderColor:C.line,borderRadius:18,paddingHorizontal:15},row:{flexDirection:"row",alignItems:"center",gap:12,paddingVertical:14},rowCol:{paddingVertical:14,borderBottomWidth:1,borderBottomColor:C.divider},rowTitle:{fontSize:12.5,fontWeight:"800",color:C.navy},rowDesc:{fontSize:10.5,color:C.muted,lineHeight:16,marginTop:3},seg:{flexDirection:"row",gap:7,marginTop:11},segItem:{flex:1,backgroundColor:C.chipBg,paddingVertical:10,borderRadius:11,alignItems:"center",borderWidth:1,borderColor:"transparent"},segOn:{backgroundColor:C.chipOnBg,borderColor:C.chipOnLine},segText:{fontSize:11.5,fontWeight:"800",color:C.muted},segTextOn:{color:C.blue},link:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",paddingVertical:14,borderBottomWidth:1,borderBottomColor:C.divider},linkLast:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",paddingVertical:14},linkText:{fontSize:12.5,fontWeight:"800",color:C.navy},arrow:{fontSize:17,color:C.muted},btn:{backgroundColor:C.blue,padding:14,borderRadius:13,alignItems:"center"},btnText:{color:C.onAccent,fontWeight:"900"},ghost:{borderWidth:1,borderColor:C.line,backgroundColor:C.card,padding:13,borderRadius:13,alignItems:"center",marginTop:9},ghostText:{color:C.navy,fontWeight:"800"},out:{borderWidth:1,borderColor:C.dangerLine,padding:13,borderRadius:13,alignItems:"center",marginTop:9},outText:{color:C.danger,fontWeight:"800"},version:{fontSize:10.5,color:C.muted,textAlign:"center",marginTop:26}});
