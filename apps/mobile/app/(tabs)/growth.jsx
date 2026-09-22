
import React,{useCallback,useEffect,useMemo,useState} from "react";
import {SafeAreaView,ScrollView,Text,View,TouchableOpacity,StyleSheet,ActivityIndicator} from "react-native";
import {router,useFocusEffect} from "expo-router";
import {api,token} from "../../src/api";import {useTheme} from "../../src/theme";
const AREAS=["과학·탐구","창의·예술","언어·독서","신체·놀이","역사·지역","사회·생활"];
// '민준이의 성장' / '지우의 성장' — 끝글자 받침 유무로 조사를 고른다.
function possessive(name){
 const last=(name||"").trim().slice(-1);const code=last?last.charCodeAt(0):0;
 const jong=code>=0xAC00&&code<=0xD7A3&&((code-0xAC00)%28)!==0;
 return `${name}${jong?"이의":"의"}`;
}
export default function Growth(){
 const {C}=useTheme();const s=useMemo(()=>styles(C),[C]);
 const [kids,setKids]=useState([]),[selectedChildId,setSelectedChildId]=useState(null);
 const [rows,setRows]=useState([]),[logged,setLogged]=useState(false);
 const [loadingKids,setLoadingKids]=useState(true),[loadingRows,setLoadingRows]=useState(false);
 const [refreshAt,setRefreshAt]=useState(0); // 탭에 다시 들어오면 같은 자녀라도 집계를 새로 받는다
 const loadKids=useCallback(async()=>{
  setLoadingKids(true);
  try{
   const t=await token();setLogged(!!t);
   if(!t){setKids([]);setSelectedChildId(null);return}
   const list=(await api.children()).items||[];setKids(list);
   // 기본은 첫 자녀. 이미 고른 자녀가 목록에 남아 있으면 그대로 유지한다.
   setSelectedChildId(prev=>list.some(k=>Number(k.id)===prev)?prev:(list.length?Number(list[0].id):null));
  }catch(e){setKids([]);setSelectedChildId(null)}
  finally{setLoadingKids(false);setRefreshAt(Date.now())}
 },[]);
 useFocusEffect(useCallback(()=>{loadKids()},[loadKids]));
 // 집계는 반드시 선택된 자녀의 child_id 로만 조회한다(child_id 없이 부르면 계정 전체 합산이라
 // 모든 자녀 탭이 같은 값으로 보인다). 자녀가 1명이어도 그 자녀 id 로 조회한다.
 useEffect(()=>{
  if(selectedChildId==null){setRows([]);setLoadingRows(false);return}
  const id=selectedChildId;
  let alive=true;setLoadingRows(true);
  api.growth(id)
   .then(r=>{
    if(typeof __DEV__!=="undefined"&&__DEV__){
     console.log("[growth] child",id,"resp",JSON.stringify(r));
     // 서버가 child_id 를 무시하고 계정 전체 합산을 돌려주면(구버전 백엔드) 여기서 드러난다.
     if(r&&r.child_id==null)console.warn("[growth] 응답에 child_id 가 없습니다 — 백엔드가 구버전이라 자녀 필터가 무시되는 중일 수 있습니다. 서버를 재시작하세요.");
     else if(r&&Number(r.child_id)!==Number(id))console.warn("[growth] 요청한 child_id 와 응답이 다릅니다",id,r.child_id);
    }
    // 항상 선택 자녀의 응답으로 "교체"한다. 이전 자녀 값에 누적/병합하지 않는다.
    if(alive)setRows(r.items||[]);
   })
   .catch(()=>{if(alive)setRows([])})
   .finally(()=>{if(alive)setLoadingRows(false)});
  return ()=>{alive=false}; // 칩을 빠르게 바꿀 때 늦게 온 응답이 덮어쓰지 않도록
 },[selectedChildId,refreshAt]);
 const loading=loadingKids||loadingRows;
 const child=kids.find(k=>Number(k.id)===selectedChildId)||null;
 const counts={};(rows||[]).forEach(r=>{counts[r.category]=(counts[r.category]||0)+r.count});
 const areas=Array.from(new Set([...AREAS,...Object.keys(counts)]));
 const total=areas.reduce((a,k)=>a+(counts[k]||0),0);
 const max=areas.reduce((a,k)=>Math.max(a,counts[k]||0),0);
 const weakest=total>0?areas.reduce((a,k)=>((counts[k]||0)<(counts[a]||0)?k:a),areas[0]):null;
 return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.content}>
  <Text style={s.title}>{child?`${possessive(child.name)} 성장`:"성장 리포트"}</Text>
  {child?<Text style={s.who}>지금 보는 자녀: {child.name} ({child.age}세)</Text>:null}
  <Text style={s.desc}>완료 체크한 활동이 자녀별로 성장영역에 누적됩니다.</Text>
  {!logged&&!loadingKids?
   <View style={s.empty}><Text style={s.emptyText}>로그인하면 자녀별 완료 활동이 성장영역으로 누적됩니다.</Text><TouchableOpacity style={s.btn} onPress={()=>router.push("/login")} accessibilityRole="button"><Text style={s.btnText}>로그인 / 보호자 가입</Text></TouchableOpacity></View>
   :null}
  {logged&&kids.length>0&&<View style={s.chips}>{kids.map(k=><TouchableOpacity key={k.id} onPress={()=>setSelectedChildId(Number(k.id))} style={[s.chip,Number(k.id)===selectedChildId&&s.on]} accessibilityRole="button" accessibilityState={{selected:Number(k.id)===selectedChildId}} accessibilityLabel={`${k.name} 성장 리포트 보기`}><Text style={{color:Number(k.id)===selectedChildId?C.blue:C.muted,fontWeight:"800",fontSize:11.5}}>{k.name}</Text></TouchableOpacity>)}</View>}
  {loading?<ActivityIndicator/>
   :!logged?null
   :kids.length===0?
    <View style={s.empty}><Text style={s.emptyText}>등록된 자녀가 없습니다. 자녀를 등록하면 완료 활동이 자녀별 성장 리포트로 쌓입니다.</Text><TouchableOpacity style={s.btn} onPress={()=>router.push("/children")} accessibilityRole="button"><Text style={s.btnText}>자녀 등록</Text></TouchableOpacity></View>
   :<>
    {total===0&&<View style={s.empty}><Text style={s.emptyText}>{child?`‘${child.name}’의 완료 기록이 아직 없습니다.`:"아직 완료한 활동이 없습니다."} 프로그램 상세에서 ‘활동 완료 체크’를 누르면 여기에 기록됩니다.</Text><TouchableOpacity style={s.btn} onPress={()=>router.push("/explore")} accessibilityRole="button"><Text style={s.btnText}>지역 프로그램 탐색</Text></TouchableOpacity></View>}
    {total>0&&<Text style={s.count}>{child?`${child.name} 누적 ${total}회`:`누적 ${total}회`}</Text>}
    {areas.map(k=>{const n=counts[k]||0;return <View key={k} style={s.row}><View style={s.between}><Text style={s.name}>{k}</Text><Text style={s.num}>{n}회</Text></View><View style={s.bar}><View style={[s.fill,{width:max>0?`${Math.round(n/max*100)}%`:"0%"}]}/></View></View>})}
    <View style={s.tip}><Text style={s.tipTitle}>이런 영역을 더 경험해보세요</Text>
     {weakest?<Text style={s.desc}>지금까지의 완료 기록에서는 ‘{weakest}’ 경험이 가장 적습니다.</Text>
             :<Text style={s.desc}>활동 이력이 쌓이면 상대적으로 적게 경험한 영역을 여기에 표시합니다.</Text>}
     {weakest&&<TouchableOpacity style={s.btn} onPress={()=>router.push({pathname:"/(tabs)/explore",params:{category:weakest,ts:String(Date.now())}})} accessibilityRole="button" accessibilityLabel={`${weakest} 카테고리로 탐색 열기`}><Text style={s.btnText}>{weakest} 프로그램 찾기</Text></TouchableOpacity>}
    </View>
   </>}
 </ScrollView></SafeAreaView>
}
const styles=C=>StyleSheet.create({safe:{flex:1,backgroundColor:C.bg},content:{padding:16,paddingBottom:100},title:{fontSize:26,fontWeight:"900",color:C.navy},who:{fontSize:11.5,color:C.blue,fontWeight:"800",marginTop:5},desc:{fontSize:11.5,color:C.muted,lineHeight:19,marginTop:6,marginBottom:18},chips:{flexDirection:"row",gap:6,flexWrap:"wrap",marginBottom:14},chip:{borderWidth:1,borderColor:C.line,backgroundColor:C.card,paddingHorizontal:13,paddingVertical:9,borderRadius:99},on:{borderColor:C.blue,backgroundColor:C.chipOnBg},count:{fontSize:10.5,color:C.muted,marginBottom:9},row:{backgroundColor:C.card,padding:15,borderWidth:1,borderColor:C.line,borderRadius:16,marginBottom:8},between:{flexDirection:"row",justifyContent:"space-between"},name:{fontSize:12,fontWeight:"800",color:C.navy},num:{fontSize:10.5,color:C.muted},bar:{height:8,backgroundColor:C.skeleton,borderRadius:99,marginTop:8,overflow:"hidden"},fill:{height:"100%",backgroundColor:C.blue},tip:{backgroundColor:C.successSoft,padding:16,borderRadius:18,marginTop:12},tipTitle:{fontSize:15,fontWeight:"900",color:C.navy},empty:{backgroundColor:C.card,borderWidth:1,borderColor:C.line,borderRadius:19,padding:20,alignItems:"center",marginBottom:12},emptyText:{fontSize:11.5,color:C.muted,lineHeight:19,textAlign:"center"},btn:{backgroundColor:C.blue,paddingHorizontal:18,paddingVertical:13,borderRadius:13,alignItems:"center",marginTop:12,alignSelf:"stretch"},btnText:{color:C.onAccent,fontWeight:"900"}});
