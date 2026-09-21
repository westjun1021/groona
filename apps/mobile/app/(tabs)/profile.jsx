
import React,{useCallback,useState} from "react";
import {SafeAreaView,ScrollView,Text,View,TouchableOpacity,StyleSheet} from "react-native";
import {router,useFocusEffect} from "expo-router";
import {token,setToken} from "../../src/api";import {C} from "../../src/theme";
export default function Profile(){
 const [logged,setLogged]=useState(false);
 useFocusEffect(useCallback(()=>{token().then(x=>setLogged(!!x))},[]));
 async function logout(){await setToken(null);setLogged(false);router.replace("/")}
 return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.content}>
  <View style={s.top}><Text style={s.title}>보호자 계정</Text><TouchableOpacity hitSlop={10} onPress={()=>router.push("/settings")} accessibilityLabel="설정"><Text style={s.gear}>⚙</Text></TouchableOpacity></View>
  <Text style={s.desc}>GROONA는 보호자 계정 아래에 자녀 프로필을 관리하도록 설계했습니다.</Text>
  {logged?<>
   <TouchableOpacity style={s.btn} onPress={()=>router.push("/children")}><Text style={s.btnText}>자녀 프로필 관리</Text></TouchableOpacity>
   <TouchableOpacity style={s.ghost} onPress={()=>router.push("/settings")}><Text style={s.ghostText}>설정</Text></TouchableOpacity>
   <TouchableOpacity style={s.ghost} onPress={logout}><Text style={s.ghostText}>로그아웃</Text></TouchableOpacity>
  </>:<>
   <TouchableOpacity style={s.btn} onPress={()=>router.push("/login")}><Text style={s.btnText}>로그인 / 보호자 가입</Text></TouchableOpacity>
   <TouchableOpacity style={s.ghost} onPress={()=>router.push("/settings")}><Text style={s.ghostText}>설정</Text></TouchableOpacity>
  </>}
  <Text style={s.legal}>개인정보처리방침과 이용약관은 설정 화면과 공개 웹사이트에서 항상 확인할 수 있습니다.</Text>
 </ScrollView></SafeAreaView>
}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:C.bg},content:{padding:16,paddingBottom:100},top:{flexDirection:"row",justifyContent:"space-between",alignItems:"center"},title:{fontSize:26,fontWeight:"900",color:C.navy},gear:{fontSize:21,color:C.muted},desc:{fontSize:11.5,color:C.muted,lineHeight:19,marginVertical:7},btn:{backgroundColor:C.blue,padding:14,borderRadius:13,alignItems:"center",marginTop:14},btnText:{color:"#fff",fontWeight:"900"},ghost:{borderWidth:1,borderColor:C.line,backgroundColor:"#fff",padding:13,borderRadius:13,alignItems:"center",marginTop:9},ghostText:{color:C.navy,fontWeight:"800"},legal:{fontSize:10.5,color:C.muted,lineHeight:17,marginTop:20}});
