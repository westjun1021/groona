
import React,{useCallback,useEffect,useState} from "react";
import {SafeAreaView,ScrollView,Text,View,TextInput,TouchableOpacity,StyleSheet,Alert,ActivityIndicator} from "react-native";
import {router} from "expo-router";
import {api,token} from "../src/api";import {C} from "../src/theme";
const REGIONS=["부산","울산","경남"];
const INTERESTS=["과학·탐구","창의·예술","언어·독서","신체·놀이","역사·지역","사회·생활"];
export default function Children(){
 const [rows,setRows]=useState([]),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false);
 const [name,setName]=useState(""),[age,setAge]=useState(""),[region,setRegion]=useState("부산"),[interest,setInterest]=useState("과학·탐구");
 const load=useCallback(async()=>{
  setLoading(true);
  try{
   if(!(await token())){router.replace("/login");return}
   const r=await api.children();setRows(r.items||[]);
  }catch(e){Alert.alert("오류",e.message)}finally{setLoading(false)}
 },[]);
 useEffect(()=>{load()},[load]);
 async function add(){
  const n=Number(age);
  if(!name.trim()){Alert.alert("확인","자녀 이름을 입력하세요.");return}
  if(!Number.isInteger(n)||n<0||n>17){Alert.alert("확인","나이는 0~17 사이 숫자로 입력하세요.");return}
  setSaving(true);
  try{await api.addChild({name:name.trim(),age:n,region,interest});setName("");setAge("");await load()}
  catch(e){Alert.alert("오류",e.message)}finally{setSaving(false)}
 }
 return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.content}>
  <TouchableOpacity onPress={()=>router.back()}><Text style={s.back}>‹ 뒤로</Text></TouchableOpacity>
  <Text style={s.title}>자녀 프로필</Text>
  <Text style={s.desc}>보호자 계정 아래에 자녀를 등록하면 완료 활동이 자녀별 성장 리포트로 쌓입니다.</Text>
  {loading?<ActivityIndicator/>:rows.length===0?
   <View style={s.empty}><Text style={s.emptyText}>등록된 자녀가 없습니다. 아래에서 추가해 주세요.</Text></View>
   :rows.map(c=><View key={c.id} style={s.child}><Text style={s.childName}>{c.name}</Text><Text style={s.childMeta}>{c.age}세 · {c.region} · {c.interest}</Text></View>)}
  <Text style={s.head}>자녀 추가</Text>
  <TextInput style={s.input} placeholder="이름" value={name} onChangeText={setName}/>
  <TextInput style={s.input} placeholder="나이(만)" keyboardType="number-pad" value={age} onChangeText={setAge}/>
  <Text style={s.label}>지역</Text>
  <View style={s.chips}>{REGIONS.map(r=><TouchableOpacity key={r} onPress={()=>setRegion(r)} style={[s.chip,region===r&&s.on]}><Text style={{color:region===r?C.blue:C.muted,fontWeight:"800",fontSize:11.5}}>{r}</Text></TouchableOpacity>)}</View>
  <Text style={s.label}>관심 영역</Text>
  <View style={s.chips}>{INTERESTS.map(r=><TouchableOpacity key={r} onPress={()=>setInterest(r)} style={[s.chip,interest===r&&s.on]}><Text style={{color:interest===r?C.blue:C.muted,fontWeight:"800",fontSize:11.5}}>{r}</Text></TouchableOpacity>)}</View>
  <TouchableOpacity style={[s.btn,saving&&{opacity:0.6}]} disabled={saving} onPress={add}><Text style={s.btnText}>{saving?"저장 중…":"자녀 추가"}</Text></TouchableOpacity>
 </ScrollView></SafeAreaView>
}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:C.bg},content:{padding:18,paddingBottom:60},back:{color:C.blue,fontWeight:"800",marginBottom:16},title:{fontSize:26,fontWeight:"900",color:C.navy},desc:{fontSize:11.5,color:C.muted,lineHeight:19,marginTop:6,marginBottom:16},empty:{backgroundColor:"#fff",borderWidth:1,borderColor:C.line,borderRadius:16,padding:18,alignItems:"center"},emptyText:{fontSize:11.5,color:C.muted},child:{backgroundColor:"#fff",borderWidth:1,borderColor:C.line,borderRadius:16,padding:14,marginBottom:8},childName:{fontSize:13.5,fontWeight:"900",color:C.navy},childMeta:{fontSize:10.5,color:C.muted,marginTop:4},head:{fontSize:17,fontWeight:"900",color:C.navy,marginTop:24,marginBottom:10},label:{fontSize:10.5,color:C.muted,fontWeight:"800",marginTop:8},input:{backgroundColor:"#fff",borderWidth:1,borderColor:C.line,borderRadius:12,padding:12,marginBottom:9},chips:{flexDirection:"row",gap:7,flexWrap:"wrap",marginTop:7},chip:{backgroundColor:"#EEF3F6",paddingHorizontal:11,paddingVertical:8,borderRadius:99},on:{backgroundColor:C.soft,borderWidth:1,borderColor:"#BDDFFF"},btn:{backgroundColor:C.blue,padding:14,borderRadius:13,alignItems:"center",marginTop:20},btnText:{color:"#fff",fontWeight:"900"}});
