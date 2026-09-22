
import React,{useCallback,useEffect,useMemo,useState} from "react";
import {SafeAreaView,ScrollView,Text,View,TextInput,TouchableOpacity,StyleSheet,Alert,ActivityIndicator} from "react-native";
import {router} from "expo-router";
import {api,token} from "../src/api";import {useTheme} from "../src/theme";import {tap,success} from "../src/haptics";import {useToast} from "../src/ui";
const REGIONS=["부산","울산","경남"];
const INTERESTS=["과학·탐구","창의·예술","언어·독서","신체·놀이","역사·지역","사회·생활"];
// 연도 칸에 "2019-09" 처럼 한 번에 적어도 받아준다.
function parseBirth(yearText,monthText){
 const t=(yearText||"").trim();const ym=t.match(/^(\d{4})\s*[-./]\s*(\d{1,2})$/);
 return {y:ym?Number(ym[1]):Number(t),m:ym?Number(ym[2]):Number((monthText||"").trim())};
}
// 서버와 같은 규칙으로 만 나이를 계산한다(입력 미리보기용. 목록 표시는 서버 계산값을 쓴다).
function ageOf(y,m){const now=new Date();let a=now.getFullYear()-y;if(m&&now.getMonth()+1<m)a-=1;return a}
export default function Children(){
 const {C}=useTheme();const s=useMemo(()=>styles(C),[C]);
 const toast=useToast();
 const [rows,setRows]=useState([]),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false);
 const [editingId,setEditingId]=useState(null);
 const [name,setName]=useState(""),[birthYear,setBirthYear]=useState(""),[birthMonth,setBirthMonth]=useState("");
 const [region,setRegion]=useState("부산"),[interest,setInterest]=useState("과학·탐구");
 const load=useCallback(async()=>{
  setLoading(true);
  try{
   if(!(await token())){router.replace("/login");return}
   const r=await api.children();setRows(r.items||[]);
  }catch(e){Alert.alert("오류",e.message)}finally{setLoading(false)}
 },[]);
 useEffect(()=>{load()},[load]);
 function reset(){setEditingId(null);setName("");setBirthYear("");setBirthMonth("");setRegion("부산");setInterest("과학·탐구")}
 function edit(c){
  setEditingId(c.id);setName(c.name||"");
  setBirthYear(c.birth_year?String(c.birth_year):"");setBirthMonth(c.birth_month?String(c.birth_month):"");
  setRegion(c.region||"부산");setInterest(c.interest||"과학·탐구");
 }
 function remove(c){
  Alert.alert("자녀 삭제",`‘${c.name}’ 프로필과 그 자녀의 완료 기록이 함께 삭제됩니다. 되돌릴 수 없습니다.`,[
   {text:"취소",style:"cancel"},
   {text:"삭제",style:"destructive",onPress:async()=>{
     try{await api.deleteChild(c.id);toast(`‘${c.name}’ 프로필을 삭제했어요`);if(editingId===c.id)reset();await load()}
     catch(e){Alert.alert("오류",e.message)}}}]);
 }
 async function submit(){
  tap();
  const {y,m}=parseBirth(birthYear,birthMonth);
  if(!name.trim()){Alert.alert("확인","자녀 이름을 입력하세요.");return}
  if(!Number.isInteger(y)||y<1900||y>9999){Alert.alert("확인","출생 연도를 4자리로 입력하세요. 예: 2019");return}
  if(!Number.isInteger(m)||m<1||m>12){Alert.alert("확인","출생 월을 1~12 사이로 입력하세요.");return}
  const a=ageOf(y,m);
  if(a<0||a>17){Alert.alert("확인",`만 나이가 0~17세인 자녀만 등록할 수 있습니다. (입력 기준 만 ${a}세)`);return}
  setSaving(true);
  try{
   const body={name:name.trim(),birth_year:y,birth_month:m,region,interest};
   const editing=!!editingId;
   if(editing)await api.updateChild(editingId,body);else await api.addChild(body);
   success();toast(editing?`‘${body.name}’ 정보를 수정했어요`:`‘${body.name}’을 등록했어요`);
   reset();await load();
  }catch(e){Alert.alert("오류",e.message)}finally{setSaving(false)}
 }
 const preview=(()=>{const {y,m}=parseBirth(birthYear,birthMonth);
  if(!Number.isInteger(y)||!Number.isInteger(m)||m<1||m>12)return null;
  const a=ageOf(y,m);return a>=0&&a<=17?`만 ${a}세`:`만 ${a}세 — 0~17세만 등록할 수 있습니다`})();
 return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.content}>
  <TouchableOpacity onPress={()=>router.back()} accessibilityRole="button" accessibilityLabel="뒤로 가기"><Text style={s.back}>‹ 뒤로</Text></TouchableOpacity>
  <Text style={s.title}>자녀 프로필</Text>
  <Text style={s.desc}>보호자 계정 아래에 자녀를 등록하면 완료 활동이 자녀별 성장 리포트로 쌓입니다. 나이는 출생 연·월로 저장되어 해가 바뀌면 자동으로 올라갑니다.</Text>
  {loading?<ActivityIndicator/>:rows.length===0?
   <View style={s.empty}><Text style={s.emptyText}>등록된 자녀가 없습니다. 아래에서 추가해 주세요.</Text></View>
   :rows.map(c=><View key={c.id} style={[s.child,editingId===c.id&&s.editing]}>
     <View style={s.childTop}>
      <View style={{flex:1}}>
       <Text style={s.childName}>{c.name}</Text>
       <Text style={s.childMeta}>{c.age}세{c.birth_year?` · ${c.birth_year}년 ${c.birth_month}월생`:""}</Text>
       <Text style={s.childMeta}>{c.region} · {c.interest}</Text>
      </View>
      <View style={s.actions}>
       <TouchableOpacity onPress={()=>edit(c)} hitSlop={8} accessibilityRole="button" accessibilityLabel={`${c.name} 수정`}><Text style={s.edit}>수정</Text></TouchableOpacity>
       <TouchableOpacity onPress={()=>remove(c)} hitSlop={8} accessibilityRole="button" accessibilityLabel={`${c.name} 삭제`}><Text style={s.del}>삭제</Text></TouchableOpacity>
      </View>
     </View>
    </View>)}
  <Text style={s.head}>{editingId?"자녀 정보 수정":"자녀 추가"}</Text>
  <TextInput style={s.input} placeholder="이름" placeholderTextColor={C.muted} value={name} onChangeText={setName}/>
  <View style={s.birthRow}>
   <TextInput style={[s.input,s.birthYear]} placeholder="출생 연도 (예: 2019)" placeholderTextColor={C.muted} keyboardType="number-pad" maxLength={7} value={birthYear} onChangeText={setBirthYear}/>
   <TextInput style={[s.input,s.birthMonth]} placeholder="월" placeholderTextColor={C.muted} keyboardType="number-pad" maxLength={2} value={birthMonth} onChangeText={setBirthMonth}/>
  </View>
  {preview?<Text style={s.preview}>{preview}</Text>:null}
  <Text style={s.label}>지역</Text>
  <View style={s.chips}>{REGIONS.map(r=><TouchableOpacity key={r} onPress={()=>setRegion(r)} style={[s.chip,region===r&&s.on]} accessibilityRole="button" accessibilityState={{selected:region===r}}><Text style={{color:region===r?C.blue:C.muted,fontWeight:"800",fontSize:11.5}}>{r}</Text></TouchableOpacity>)}</View>
  <Text style={s.label}>관심 영역</Text>
  <View style={s.chips}>{INTERESTS.map(r=><TouchableOpacity key={r} onPress={()=>setInterest(r)} style={[s.chip,interest===r&&s.on]} accessibilityRole="button" accessibilityState={{selected:interest===r}}><Text style={{color:interest===r?C.blue:C.muted,fontWeight:"800",fontSize:11.5}}>{r}</Text></TouchableOpacity>)}</View>
  <TouchableOpacity style={[s.btn,saving&&{opacity:0.6}]} disabled={saving} onPress={submit} accessibilityRole="button"><Text style={s.btnText}>{saving?"저장 중…":editingId?"수정 저장":"자녀 추가"}</Text></TouchableOpacity>
  {editingId?<TouchableOpacity style={s.cancel} onPress={reset} accessibilityRole="button"><Text style={s.cancelText}>수정 취소</Text></TouchableOpacity>:null}
 </ScrollView></SafeAreaView>
}
const styles=C=>StyleSheet.create({safe:{flex:1,backgroundColor:C.bg},content:{padding:18,paddingBottom:60},back:{color:C.blue,fontWeight:"800",marginBottom:16},title:{fontSize:26,fontWeight:"900",color:C.navy},desc:{fontSize:11.5,color:C.muted,lineHeight:19,marginTop:6,marginBottom:16},empty:{backgroundColor:C.card,borderWidth:1,borderColor:C.line,borderRadius:16,padding:18,alignItems:"center"},emptyText:{fontSize:11.5,color:C.muted},child:{backgroundColor:C.card,borderWidth:1,borderColor:C.line,borderRadius:16,padding:14,marginBottom:8},editing:{borderColor:C.blue,backgroundColor:C.editBg},childTop:{flexDirection:"row",alignItems:"flex-start",gap:10},childName:{fontSize:13.5,fontWeight:"900",color:C.navy},childMeta:{fontSize:10.5,color:C.muted,marginTop:4},actions:{flexDirection:"row",gap:14,paddingTop:2},edit:{fontSize:11.5,fontWeight:"900",color:C.blue},del:{fontSize:11.5,fontWeight:"900",color:C.danger},head:{fontSize:17,fontWeight:"900",color:C.navy,marginTop:24,marginBottom:10},label:{fontSize:10.5,color:C.muted,fontWeight:"800",marginTop:8},input:{backgroundColor:C.card,borderWidth:1,borderColor:C.line,borderRadius:12,padding:12,marginBottom:9,color:C.navy},birthRow:{flexDirection:"row",gap:9},birthYear:{flex:3},birthMonth:{flex:1},preview:{fontSize:11,color:C.blue,fontWeight:"800",marginTop:-2,marginBottom:6},chips:{flexDirection:"row",gap:7,flexWrap:"wrap",marginTop:7},chip:{backgroundColor:C.chipBg,paddingHorizontal:11,paddingVertical:8,borderRadius:99},on:{backgroundColor:C.chipOnBg,borderWidth:1,borderColor:C.chipOnLine},btn:{backgroundColor:C.blue,padding:14,borderRadius:13,alignItems:"center",marginTop:20},btnText:{color:C.onAccent,fontWeight:"900"},cancel:{padding:12,alignItems:"center"},cancelText:{color:C.muted,fontWeight:"800",fontSize:11.5}});
