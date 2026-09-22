
import React,{useEffect,useMemo,useRef,useState} from "react";import {Animated,SafeAreaView,ScrollView,Text,View,TouchableOpacity,StyleSheet,Linking,ActivityIndicator,Alert,Modal,Pressable,Share,Platform} from "react-native";import {useLocalSearchParams,router} from "expo-router";import {api,token,WEB} from "../../src/api";import {useTheme} from "../../src/theme";import {StatusBadge,DeadlineBadge,Empty,alertError,friendlyError,useToast} from "../../src/ui";import {tap,success} from "../../src/haptics";import {pushRecentId} from "../../src/recent";import * as Calendar from "expo-calendar/legacy";
// "YYYY-MM-DD" 또는 "YYYY-MM-DD HH:MM" 을 로컬 Date 로 읽는다. 형식이 아니면 null.
function parseWhen(v){
 const m=String(v||"").trim().match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/);
 if(!m)return null;
 const [,y,mo,d,hh,mi]=m;
 return {date:new Date(+y,+mo-1,+d,hh?+hh:0,mi?+mi:0),hasTime:!!hh};
}
const allDay=d=>({startDate:new Date(d.getFullYear(),d.getMonth(),d.getDate()),endDate:new Date(d.getFullYear(),d.getMonth(),d.getDate()+1),allDay:true});
// 캘린더에 넣을 구간: 운영기간(start~end)이 있으면 그것을, 없으면 신청 마감일을 쓴다.
function eventRange(x){
 const st=parseWhen(x.start_date);
 if(st){
  const en=parseWhen(x.end_date)||st;
  const last=en.date<st.date?st.date:en.date;   // 끝이 시작보다 빠른 데이터는 하루짜리로 처리
  return {startDate:new Date(st.date.getFullYear(),st.date.getMonth(),st.date.getDate()),
          endDate:new Date(last.getFullYear(),last.getMonth(),last.getDate()+1),allDay:true};
 }
 const ae=parseWhen(x.apply_end);
 if(!ae)return null;
 return ae.hasTime?{startDate:ae.date,endDate:new Date(ae.date.getTime()+3600000),allDay:false}:allDay(ae.date);
}
// 쓰기 가능한 캘린더 하나를 고른다(iOS 는 기본 캘린더, 안드로이드는 수정 가능한 것 중 첫 번째).
async function writableCalendar(){
 if(Platform.OS==="ios"){try{const d=await Calendar.getDefaultCalendarAsync();if(d)return d}catch(e){}}
 const cals=await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
 return (cals||[]).find(c=>c.allowsModifications)||null;
}
export default function Detail(){
 const {C}=useTheme();const s=useMemo(()=>styles(C),[C]);
 const toast=useToast();
 const scale=useRef(new Animated.Value(1)).current;
 function bounce(){
  Animated.sequence([
   Animated.spring(scale,{toValue:1.35,useNativeDriver:true,speed:50,bounciness:14}),
   Animated.spring(scale,{toValue:1,useNativeDriver:true,speed:20,bounciness:10})
  ]).start();
 }
 const {id}=useLocalSearchParams();const [x,setX]=useState(null),[fav,setFav]=useState(false),[pick,setPick]=useState(null),[error,setError]=useState(null);
 // 조회에 성공한 것만 "최근 본 프로그램"에 남긴다(없는 id 를 기록하지 않도록).
 function fetchOne(){setError(null);api.activity(id).then(a=>{setX(a);pushRecentId(id)}).catch(e=>setError(friendlyError(e)))}
 useEffect(()=>{fetchOne()},[id]);
 useEffect(()=>{token().then(t=>{if(t)api.favorites().then(r=>setFav((r.items||[]).includes(id))).catch(()=>{})})},[id]);
 async function toggleFavorite(){
  tap();bounce();
  if(!(await token())){router.push("/login");return}
  try{
   const r=await api.toggleFavorite(id);setFav(r.favorite);
   toast(r.favorite?"찜에 추가했어요":"찜을 해제했어요");
  }catch(e){alertError(e,"찜을 변경하지 못했어요")}
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
  // 같은 자녀·같은 활동은 서버에서 1회만 집계되므로, 재체크인지 신규인지 그대로 알린다.
  try{
   const r=await api.complete(id,child.id);
   if(r&&r.already)toast("‘"+child.name+"’이 이미 완료한 활동이에요");
   else{success();toast("완료 체크! ‘"+child.name+"’의 성장 리포트에 반영했어요")}
  }catch(e){alertError(e,"기록하지 못했어요")}
 }
 async function addToCalendar(link){
  const range=eventRange(x);
  if(!range){Alert.alert("일정 정보가 없어요","이 프로그램에는 캘린더에 넣을 날짜 정보가 없습니다.");return}
  try{
   const {status}=await Calendar.requestCalendarPermissionsAsync();
   if(status!=="granted"){Alert.alert("캘린더 권한이 필요해요","기기 설정에서 캘린더 접근을 허용해 주세요.");return}
   const cal=await writableCalendar();
   if(!cal){Alert.alert("캘린더를 찾지 못했어요","기기에서 쓸 수 있는 캘린더가 없습니다.");return}
   await Calendar.createEventAsync(cal.id,{title:x.title,location:x.address||x.place||x.provider||"",
    notes:`${link}

GROONA에서 담은 일정입니다. 최종 일정과 신청 가능 여부는 공식 기관에서 확인하세요.`,
    ...range,timeZone:"Asia/Seoul"});
   success();Alert.alert("캘린더에 추가했어요",x.start_date?`${x.start_date} ~ ${x.end_date||x.start_date}`:`신청 마감 ${x.apply_end}`);
  }catch(e){alertError(e,"캘린더에 추가하지 못했어요")}
 }
 if(error)return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.content}><TouchableOpacity onPress={()=>router.back()} accessibilityRole="button" accessibilityLabel="뒤로 가기"><Text style={s.back}>‹ 뒤로</Text></TouchableOpacity><Empty title="정보를 불러오지 못했어요" desc={error} actionLabel="다시 시도" onAction={fetchOne}/></ScrollView></SafeAreaView>;
 if(!x)return <SafeAreaView style={s.safe}><ActivityIndicator/></SafeAreaView>;
 const q=`${(x.title||"").replace(/^\s*\d{4}년\s*/,"")} ${x.provider||""} ${x.region||""} 예약`.replace(/\s+/g," ").trim();
 const official=!!(x.detail_url&&/^https?:\/\//.test(x.detail_url));
 const target=official?x.detail_url:`https://search.naver.com/search.naver?query=${encodeURIComponent(q)}`;
 // 공식 상세 URL이 없으면 검색으로 보내면서 라벨도 그대로 밝힌다.
 const linkLabel=official?"공식 예약·정보 확인":"기관 정보 검색";
 const age=x.age_known?`${x.age_min}~${x.age_max}세`:"연령 정보 확인 필요";
 // 아래 세 액션은 데이터에 값이 있을 때만 버튼을 낸다.
 const tel=String(x.phone||"").replace(/[^\d+]/g,"");
 const place=x.address||x.place||x.provider||"";
 const mapUrl=(x.lat&&x.lon)?`https://map.kakao.com/link/map/${encodeURIComponent(x.title)},${x.lat},${x.lon}`
              :(place?`https://map.kakao.com/link/search/${encodeURIComponent(place)}`:null);
 const range=eventRange(x);
 return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.content}>
  <View style={s.bar}>
   <TouchableOpacity onPress={()=>router.back()} accessibilityRole="button" accessibilityLabel="뒤로 가기"><Text style={s.back}>‹ 뒤로</Text></TouchableOpacity>
   <View style={s.barRight}>
    <TouchableOpacity hitSlop={10} onPress={share} accessibilityRole="button" accessibilityLabel={`${x.title} 공유하기`}><Text style={s.action}>공유</Text></TouchableOpacity>
    <TouchableOpacity hitSlop={10} onPress={toggleFavorite} accessibilityRole="button" accessibilityState={{selected:fav}} accessibilityLabel={fav?"찜 해제":"찜하기"}><Animated.Text style={[s.heart,fav&&s.heartOn,{transform:[{scale}]}]}>{fav?"♥":"♡"}</Animated.Text></TouchableOpacity>
   </View>
  </View>
  <Text style={s.category}>{x.category}</Text><Text style={s.title}>{x.title}</Text>
  <View style={s.metaRow}><Text style={s.meta}>{x.region} · {x.provider||x.place||""}</Text><StatusBadge status={x.status}/><DeadlineBadge applyEnd={x.apply_end}/></View>
  <View style={s.panel}><Row s={s} k="대상" v={age}/><Row s={s} k="비용" v={x.fee===0?"무료":x.fee?`${Number(x.fee).toLocaleString()}원`:"공식 페이지 확인"}/><Row s={s} k="상태" v={x.status}/><Row s={s} k="운영기간" v={`${x.start_date||"-"} ~ ${x.end_date||"-"}`}/><Row s={s} k="신청기간" v={`${x.apply_start||"-"} ~ ${x.apply_end||"-"}`}/><Row s={s} k="문의" v={x.phone||"-"}/></View>
  {(tel||mapUrl||range)?<View style={s.quick}>
   {tel?<TouchableOpacity style={s.quickBtn} onPress={()=>{tap();Linking.openURL(`tel:${tel}`)}} accessibilityRole="button" accessibilityLabel={`${x.phone} 로 전화 문의`}><Text style={s.quickText}>전화 문의</Text></TouchableOpacity>:null}
   {mapUrl?<TouchableOpacity style={s.quickBtn} onPress={()=>{tap();Linking.openURL(mapUrl)}} accessibilityRole="button" accessibilityLabel={`${place} 지도로 보기`}><Text style={s.quickText}>지도로 보기</Text></TouchableOpacity>:null}
   {range?<TouchableOpacity style={s.quickBtn} onPress={()=>{tap();addToCalendar(target)}} accessibilityRole="button" accessibilityLabel="일정을 기기 캘린더에 추가"><Text style={s.quickText}>캘린더에 추가</Text></TouchableOpacity>:null}
  </View>:null}
  <Text style={s.head}>성장 연결</Text><View style={s.tags}>{(x.skills||[]).map(t=><Text style={s.tag} key={t}>{t}</Text>)}</View>
  <TouchableOpacity style={s.btn} onPress={()=>{tap();Linking.openURL(target)}} accessibilityRole="button" accessibilityLabel={official?"공식 예약·정보 페이지 열기":"기관 정보 검색 결과 열기"}><Text style={s.btnText}>{linkLabel}</Text></TouchableOpacity>
  <TouchableOpacity style={s.done} onPress={()=>{tap();complete()}} accessibilityRole="button" accessibilityLabel="활동 완료 체크"><Text style={s.doneText}>활동 완료 체크</Text></TouchableOpacity>
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
const Row=({k,v,s})=><View style={s.row}><Text style={s.k}>{k}</Text><Text style={s.v}>{v}</Text></View>;
const styles=C=>StyleSheet.create({safe:{flex:1,backgroundColor:C.bg},content:{padding:18},bar:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",marginBottom:18},barRight:{flexDirection:"row",alignItems:"center",gap:16},back:{color:C.blue,fontWeight:"800"},action:{color:C.blue,fontWeight:"800",fontSize:12.5},heart:{fontSize:24,color:C.heartOff},heartOn:{color:C.danger},category:{color:C.green,fontSize:11,fontWeight:"900"},title:{fontSize:28,fontWeight:"900",color:C.navy,lineHeight:36,marginTop:6},metaRow:{flexDirection:"row",alignItems:"center",gap:9,marginTop:7,marginBottom:16,flexWrap:"wrap"},meta:{fontSize:12,color:C.muted},panel:{backgroundColor:C.card,padding:15,borderRadius:18,borderWidth:1,borderColor:C.line},row:{flexDirection:"row",paddingVertical:9,borderBottomWidth:1,borderBottomColor:C.divider},k:{width:75,fontSize:11,color:C.muted},v:{flex:1,fontSize:11.5,color:C.navy,fontWeight:"700"},quick:{flexDirection:"row",gap:7,flexWrap:"wrap",marginTop:12},quickBtn:{borderWidth:1,borderColor:C.line,backgroundColor:C.card,paddingHorizontal:13,paddingVertical:11,borderRadius:12},quickText:{fontSize:11.5,fontWeight:"800",color:C.blue},head:{fontSize:17,fontWeight:"900",color:C.navy,marginTop:20,marginBottom:9},tags:{flexDirection:"row",gap:6,flexWrap:"wrap"},tag:{backgroundColor:C.successSoft,color:C.green,paddingHorizontal:9,paddingVertical:7,borderRadius:99,fontSize:10.5,fontWeight:"800"},btn:{backgroundColor:C.blue,padding:14,borderRadius:13,alignItems:"center",marginTop:20},btnText:{color:C.onAccent,fontWeight:"900"},done:{borderWidth:1,borderColor:C.mint,backgroundColor:C.successSoft,padding:13,borderRadius:13,alignItems:"center",marginTop:9},doneText:{color:C.green,fontWeight:"900"},source:{fontSize:9.5,color:C.muted,lineHeight:16,marginTop:14},dim:{flex:1,backgroundColor:C.dim,justifyContent:"center",padding:24},sheet:{backgroundColor:C.card,borderRadius:20,padding:18},sheetTitle:{fontSize:16,fontWeight:"900",color:C.navy,marginBottom:12},child:{borderWidth:1,borderColor:C.line,borderRadius:13,padding:13,marginBottom:8},childName:{fontSize:13.5,fontWeight:"900",color:C.navy},childMeta:{fontSize:10.5,color:C.muted,marginTop:3},cancel:{padding:11,alignItems:"center"},cancelText:{color:C.muted,fontWeight:"800"}});
