
import React,{useCallback,useState} from "react";
import {SafeAreaView,ScrollView,Text,View,TouchableOpacity,StyleSheet,ActivityIndicator} from "react-native";
import {router,useFocusEffect} from "expo-router";
import {api,token} from "../../src/api";import {C} from "../../src/theme";
const AREAS=["과학·탐구","창의·예술","언어·독서","신체·놀이","역사·지역","사회·생활"];
export default function Growth(){
 const [rows,setRows]=useState([]),[logged,setLogged]=useState(false),[loading,setLoading]=useState(true);
 const load=useCallback(async()=>{
  setLoading(true);
  try{
   const t=await token();setLogged(!!t);
   if(!t){setRows([]);return}
   const r=await api.growth();setRows(r.items||[]);
  }catch(e){setRows([])}finally{setLoading(false)}
 },[]);
 useFocusEffect(useCallback(()=>{load()},[load]));
 const counts={};(rows||[]).forEach(r=>{counts[r.category]=(counts[r.category]||0)+r.count});
 const areas=Array.from(new Set([...AREAS,...Object.keys(counts)]));
 const total=areas.reduce((a,k)=>a+(counts[k]||0),0);
 const max=areas.reduce((a,k)=>Math.max(a,counts[k]||0),0);
 const weakest=total>0?areas.reduce((a,k)=>((counts[k]||0)<(counts[a]||0)?k:a),areas[0]):null;
 return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.content}>
  <Text style={s.title}>성장 리포트</Text>
  <Text style={s.desc}>완료 체크한 활동이 성장영역별로 누적됩니다.</Text>
  {loading?<ActivityIndicator/>:!logged?
   <View style={s.empty}><Text style={s.emptyText}>로그인하면 자녀별 완료 활동이 성장영역으로 누적됩니다.</Text><TouchableOpacity style={s.btn} onPress={()=>router.push("/login")}><Text style={s.btnText}>로그인 / 보호자 가입</Text></TouchableOpacity></View>
   :<>
    {total===0&&<View style={s.empty}><Text style={s.emptyText}>아직 완료한 활동이 없습니다. 프로그램 상세에서 ‘활동 완료 체크’를 누르면 여기에 기록됩니다.</Text><TouchableOpacity style={s.btn} onPress={()=>router.push("/explore")}><Text style={s.btnText}>지역 프로그램 탐색</Text></TouchableOpacity></View>}
    {total>0&&<Text style={s.count}>누적 {total}회</Text>}
    {areas.map(k=>{const n=counts[k]||0;return <View key={k} style={s.row}><View style={s.between}><Text style={s.name}>{k}</Text><Text style={s.num}>{n}회</Text></View><View style={s.bar}><View style={[s.fill,{width:max>0?`${Math.round(n/max*100)}%`:"0%"}]}/></View></View>})}
    <View style={s.tip}><Text style={s.tipTitle}>AI 균형 제안</Text>
     {weakest?<Text style={s.desc}>지금까지 ‘{weakest}’ 경험이 가장 적습니다. 다음 추천에서 이 영역을 우선 보완합니다.</Text>
             :<Text style={s.desc}>활동 이력이 쌓이면 상대적으로 적게 경험한 영역을 다음 추천에서 보완합니다.</Text>}
     {weakest&&<TouchableOpacity style={s.btn} onPress={()=>router.push("/explore")}><Text style={s.btnText}>{weakest} 프로그램 찾기</Text></TouchableOpacity>}
    </View>
   </>}
 </ScrollView></SafeAreaView>
}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:C.bg},content:{padding:16,paddingBottom:100},title:{fontSize:26,fontWeight:"900",color:C.navy},desc:{fontSize:11.5,color:C.muted,lineHeight:19,marginTop:6,marginBottom:18},count:{fontSize:10.5,color:C.muted,marginBottom:9},row:{backgroundColor:"#fff",padding:15,borderWidth:1,borderColor:C.line,borderRadius:16,marginBottom:8},between:{flexDirection:"row",justifyContent:"space-between"},name:{fontSize:12,fontWeight:"800",color:C.navy},num:{fontSize:10.5,color:C.muted},bar:{height:8,backgroundColor:"#EDF2F5",borderRadius:99,marginTop:8,overflow:"hidden"},fill:{height:"100%",backgroundColor:C.blue},tip:{backgroundColor:"#EAF9F5",padding:16,borderRadius:18,marginTop:12},tipTitle:{fontSize:15,fontWeight:"900",color:C.navy},empty:{backgroundColor:"#fff",borderWidth:1,borderColor:C.line,borderRadius:19,padding:20,alignItems:"center",marginBottom:12},emptyText:{fontSize:11.5,color:C.muted,lineHeight:19,textAlign:"center"},btn:{backgroundColor:C.blue,paddingHorizontal:18,paddingVertical:13,borderRadius:13,alignItems:"center",marginTop:12,alignSelf:"stretch"},btnText:{color:"#fff",fontWeight:"900"}});
