
import React,{useEffect,useState} from "react";import {SafeAreaView,ScrollView,Text,View,TouchableOpacity,StyleSheet,Linking,ActivityIndicator,Alert,Modal,Pressable,Share} from "react-native";import {useLocalSearchParams,router} from "expo-router";import {api,token,WEB} from "../../src/api";import {C} from "../../src/theme";import {StatusBadge,Empty,alertError,friendlyError} from "../../src/ui";
export default function Detail(){
 const {id}=useLocalSearchParams();const [x,setX]=useState(null),[fav,setFav]=useState(false),[pick,setPick]=useState(null),[error,setError]=useState(null);
 function fetchOne(){setError(null);api.activity(id).then(setX).catch(e=>setError(friendlyError(e)))}
 useEffect(()=>{fetchOne()},[id]);
 useEffect(()=>{token().then(t=>{if(t)api.favorites().then(r=>setFav((r.items||[]).includes(id))).catch(()=>{})})},[id]);
 async function toggleFavorite(){
  if(!(await token())){router.push("/login");return}
  try{const r=await api.toggleFavorite(id);setFav(r.favorite)}catch(e){alertError(e,"찜을 변경하지 못했어요")}
 }
 async function share(){
  const url=`${WEB}/activity/${id}`;
  try{await Share.share({title:x.title,url,message:`${x.title} · ${x.region} ${x.provider||""}${"\n"}GROONA에서 보기: ${url}`})}
  catch(e){alertError(e,"공유하지 못했어요")}
 }
 async function complete(){
  if(!(await token())){router.push("/login");return}
  let kids=[];
  try{kids=(await api.children()).items||[]}catch(e){alertError(e);return}
  if(kids.length===0){Alert.alert("자녀 프로필이 필요해요","완료 기록은 자녀 프로필에 저장됩니다. 먼저 자녀를 등록해 주세요.",[{text:"취소"},{text:"자녀 등록",onPress:()=>router.push("/children")}]);return}
  if(kids.length===1){save(kids[0]);return}
  setPick(kids);
 }
 async function save(child){
  setPick(null);
  try{await api.complete(id,child.id);Alert.alert("완료 기록","‘"+child.name+"’의 성장 리포트에 반영했습니다.")}catch(e){alertError(e,"기록하지 못했어요")}
 }
 if(error)return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.content}><TouchableOpacity onPress={()=>router.back()} accessibilityRole="button" accessibilityLabel="뒤로 가기"><Text style={s.back}>‹ 뒤로</Text></TouchableOpacity><Empty title="정보를 불러오지 못했어요" desc={error} actionLabel="다시 시도" onAction={fetchOne}/></ScrollView></SafeAreaView>;
 if(!x)return <SafeAreaView style={s.safe}><ActivityIndicator/></SafeAreaView>;
 const q=`${(x.title||"").replace(/^\s*\d{4}년\s*/,"")} ${x.provider||""} ${x.region||""} 예약`.replace(/\s+/g," ").trim();
 const target=(x.detail_url&&/^https?:\/\//.test(x.detail_url))?x.detail_url:`https://search.naver.com/search.naver?query=${encodeURIComponent(q)}`;
 return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.content}>
  <View style={s.bar}>
   <TouchableOpacity onPress={()=>router.back()} accessibilityRole="button" accessibilityLabel="뒤로 가기"><Text style={s.back}>‹ 뒤로</Text></TouchableOpacity>
   <View style={s.barRight}>
    <TouchableOpacity hitSlop={10} onPress={share} accessibilityRole="button" accessibilityLabel={`${x.title} 공유하기`}><Text style={s.action}>공유</Text></TouchableOpacity>
    <TouchableOpacity hitSlop={10} onPress={toggleFavorite} accessibilityRole="button" accessibilityState={{selected:fav}} accessibilityLabel={fav?"찜 해제":"찜하기"}><Text style={[s.heart,fav&&s.heartOn]}>{fav?"♥":"♡"}</Text></TouchableOpacity>
   </View>
  </View>
  <Text style={s.category}>{x.category}</Text><Text style={s.title}>{x.title}</Text>
  <View style={s.metaRow}><Text style={s.meta}>{x.region} · {x.provider||x.place||""}</Text><StatusBadge status={x.status}/></View>
  <View style={s.panel}><Row k="대상" v={`${x.age_min}~${x.age_max}세`}/><Row k="비용" v={x.fee===0?"무료":x.fee?`${Number(x.fee).toLocaleString()}원`:"공식 페이지 확인"}/><Row k="상태" v={x.status}/><Row k="운영기간" v={`${x.start_date||"-"} ~ ${x.end_date||"-"}`}/><Row k="신청기간" v={`${x.apply_start||"-"} ~ ${x.apply_end||"-"}`}/><Row k="문의" v={x.phone||"-"}/></View>
  <Text style={s.head}>성장 연결</Text><View style={s.tags}>{(x.skills||[]).map(t=><Text style={s.tag} key={t}>{t}</Text>)}</View>
  <TouchableOpacity style={s.btn} onPress={()=>Linking.openURL(target)} accessibilityRole="button" accessibilityLabel="공식 정보 및 예약 페이지 열기"><Text style={s.btnText}>공식 정보·예약 확인</Text></TouchableOpacity>
  <TouchableOpacity style={s.done} onPress={complete} accessibilityRole="button" accessibilityLabel="활동 완료 체크"><Text style={s.doneText}>활동 완료 체크</Text></TouchableOpacity>
  <Text style={s.source}>출처: {x.source_name}{"\n"}GROONA는 공개 원천을 큐레이션하며 최종 예약/운영 여부는 공식 기관에서 확인합니다.</Text>
  <Modal visible={!!pick} transparent animationType="fade" onRequestClose={()=>setPick(null)}>
   <Pressable style={s.dim} onPress={()=>setPick(null)}>
    <Pressable style={s.sheet}>
     <Text style={s.sheetTitle}>어느 자녀의 활동인가요?</Text>
     {(pick||[]).map(c=><TouchableOpacity key={c.id} style={s.child} onPress={()=>save(c)} accessibilityRole="button" accessibilityLabel={`${c.name} 선택`}><Text style={s.childName}>{c.name}</Text><Text style={s.childMeta}>{c.age}세 · {c.region} · {c.interest}</Text></TouchableOpacity>)}
     <TouchableOpacity style={s.cancel} onPress={()=>setPick(null)} accessibilityRole="button" accessibilityLabel="취소"><Text style={s.cancelText}>취소</Text></TouchableOpacity>
    </Pressable>
   </Pressable>
  </Modal>
 </ScrollView></SafeAreaView>
}
const Row=({k,v})=><View style={s.row}><Text style={s.k}>{k}</Text><Text style={s.v}>{v}</Text></View>;
const s=StyleSheet.create({safe:{flex:1,backgroundColor:C.bg},content:{padding:18},bar:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",marginBottom:18},barRight:{flexDirection:"row",alignItems:"center",gap:16},back:{color:C.blue,fontWeight:"800"},action:{color:C.blue,fontWeight:"800",fontSize:12.5},heart:{fontSize:24,color:"#C3D0D8"},heartOn:{color:C.danger},category:{color:C.green,fontSize:11,fontWeight:"900"},title:{fontSize:28,fontWeight:"900",color:C.navy,lineHeight:36,marginTop:6},metaRow:{flexDirection:"row",alignItems:"center",gap:9,marginTop:7,marginBottom:16,flexWrap:"wrap"},meta:{fontSize:12,color:C.muted},panel:{backgroundColor:"#fff",padding:15,borderRadius:18,borderWidth:1,borderColor:C.line},row:{flexDirection:"row",paddingVertical:9,borderBottomWidth:1,borderBottomColor:"#EEF2F4"},k:{width:75,fontSize:11,color:C.muted},v:{flex:1,fontSize:11.5,color:C.navy,fontWeight:"700"},head:{fontSize:17,fontWeight:"900",color:C.navy,marginTop:20,marginBottom:9},tags:{flexDirection:"row",gap:6,flexWrap:"wrap"},tag:{backgroundColor:"#EAF9F5",color:C.green,paddingHorizontal:9,paddingVertical:7,borderRadius:99,fontSize:10.5,fontWeight:"800"},btn:{backgroundColor:C.blue,padding:14,borderRadius:13,alignItems:"center",marginTop:20},btnText:{color:"#fff",fontWeight:"900"},done:{borderWidth:1,borderColor:C.mint,backgroundColor:"#EAF9F5",padding:13,borderRadius:13,alignItems:"center",marginTop:9},doneText:{color:C.green,fontWeight:"900"},source:{fontSize:9.5,color:C.muted,lineHeight:16,marginTop:14},dim:{flex:1,backgroundColor:"rgba(25,56,75,0.35)",justifyContent:"center",padding:24},sheet:{backgroundColor:"#fff",borderRadius:20,padding:18},sheetTitle:{fontSize:16,fontWeight:"900",color:C.navy,marginBottom:12},child:{borderWidth:1,borderColor:C.line,borderRadius:13,padding:13,marginBottom:8},childName:{fontSize:13.5,fontWeight:"900",color:C.navy},childMeta:{fontSize:10.5,color:C.muted,marginTop:3},cancel:{padding:11,alignItems:"center"},cancelText:{color:C.muted,fontWeight:"800"}});
