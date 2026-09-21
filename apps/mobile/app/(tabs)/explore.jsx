
import React,{useCallback,useEffect,useState} from "react";
import {SafeAreaView,FlatList,Text,TextInput,View,TouchableOpacity,StyleSheet,RefreshControl,ActivityIndicator} from "react-native";
import {api,token} from "../../src/api";import {C} from "../../src/theme";import ActivityCard from "../../src/ActivityCard";
import {useFavorites} from "../../src/favorites";import {ListSkeleton,Empty,friendlyError} from "../../src/ui";
const PAGE=20;
const REGIONS=["전체","부산","울산","경남"];
const CATEGORIES=["과학·탐구","창의·예술","언어·독서","신체·놀이","역사·지역","사회·생활"];
const Chip=({label,on,onPress})=><TouchableOpacity onPress={onPress} style={[s.chip,on&&s.chipOn]} accessibilityRole="button" accessibilityState={{selected:on}} accessibilityLabel={`${label} 필터${on?" 켜짐":""}`}><Text style={[s.chipText,on&&s.chipTextOn]}>{label}</Text></TouchableOpacity>;
export default function Explore(){
 const [q,setQ]=useState(""),[term,setTerm]=useState("");
 const [region,setRegion]=useState("전체"),[category,setCategory]=useState(null);
 const [onlyFree,setOnlyFree]=useState(false),[onlyOpen,setOnlyOpen]=useState(false);
 const [age,setAge]=useState(null),[kid,setKid]=useState(null);
 const [rows,setRows]=useState([]),[end,setEnd]=useState(false),[error,setError]=useState(null);
 const [loading,setLoading]=useState(true),[refreshing,setRefreshing]=useState(false),[more,setMore]=useState(false);
 const fav=useFavorites();
 useEffect(()=>{const h=setTimeout(()=>setTerm(q.trim()),350);return ()=>clearTimeout(h)},[q]);
 // 로그인 + 자녀가 있으면 첫 자녀 나이를 기본 연령 필터로 적용한다.
 useEffect(()=>{(async()=>{
  if(!(await token()))return;
  try{const c=((await api.children()).items||[])[0];if(c){setKid(c);setAge(c.age)}}catch(e){}
 })()},[]);
 const qs=useCallback(offset=>{
  const p=[`limit=${PAGE}`,`offset=${offset}`];
  if(region!=="전체")p.push(`region=${encodeURIComponent(region)}`);
  if(category)p.push(`category=${encodeURIComponent(category)}`);
  if(onlyFree)p.push("only_free=true");
  if(onlyOpen)p.push("only_open=true");
  if(age!=null)p.push(`age=${age}`);
  if(term)p.push(`q=${encodeURIComponent(term)}`);
  return p.join("&");
 },[region,category,onlyFree,onlyOpen,age,term]);
 const loadPage=useCallback(async(offset,replace)=>{
  try{
   const items=(await api.activities(qs(offset))).items||[];
   setRows(p=>replace?items:[...p,...items]);
   setEnd(items.length<PAGE);setError(null);
  }catch(e){setError(friendlyError(e));if(replace){setRows([]);setEnd(true)}}
 },[qs]);
 useEffect(()=>{let live=true;setLoading(true);loadPage(0,true).finally(()=>{if(live)setLoading(false)});return ()=>{live=false}},[loadPage]);
 const onRefresh=useCallback(async()=>{setRefreshing(true);await Promise.all([loadPage(0,true),fav.reload()]);setRefreshing(false)},[loadPage,fav.reload]);
 const onEnd=useCallback(async()=>{
  if(loading||more||end||refreshing||rows.length===0)return;
  setMore(true);await loadPage(rows.length,false);setMore(false);
 },[loading,more,end,refreshing,rows.length,loadPage]);
 function reset(){setQ("");setTerm("");setRegion("전체");setCategory(null);setOnlyFree(false);setOnlyOpen(false);setAge(null)}
 const filtered=region!=="전체"||category||onlyFree||onlyOpen||age!=null||term;
 const header=<View>
  <Text style={s.title}>지역 프로그램 탐색</Text>
  <Text style={s.desc}>공식 공개데이터를 기준으로 최신 수집 정보를 보여줍니다.</Text>
  <TextInput value={q} onChangeText={setQ} placeholder="생태, 과학, 무료, 박물관…" style={s.input} accessibilityLabel="프로그램 검색어 입력" returnKeyType="search"/>
  <View style={s.chips}>{REGIONS.map(r=><Chip key={r} label={r} on={region===r} onPress={()=>setRegion(r)}/>)}</View>
  <View style={s.chips}>{CATEGORIES.map(r=><Chip key={r} label={r} on={category===r} onPress={()=>setCategory(category===r?null:r)}/>)}</View>
  <View style={s.chips}>
   <Chip label="무료만" on={onlyFree} onPress={()=>setOnlyFree(v=>!v)}/>
   <Chip label="모집중만" on={onlyOpen} onPress={()=>setOnlyOpen(v=>!v)}/>
   {kid?<Chip label={`${kid.name} ${kid.age}세 맞춤`} on={age!=null} onPress={()=>setAge(age==null?kid.age:null)}/>:null}
  </View>
  <View style={s.countRow}>
   <Text style={s.count}>{loading?"불러오는 중…":`${rows.length}개${end?"":" 이상"}`}</Text>
   {filtered?<TouchableOpacity onPress={reset} accessibilityRole="button" accessibilityLabel="필터 초기화"><Text style={s.reset}>필터 초기화</Text></TouchableOpacity>:null}
  </View>
 </View>;
 return <SafeAreaView style={s.safe}>
  <FlatList
   data={loading?[]:rows}
   keyExtractor={x=>x.id}
   renderItem={({item})=><ActivityCard x={item} favorite={fav.ids.has(item.id)} onToggleFavorite={fav.toggle}/>}
   ListHeaderComponent={header}
   ListEmptyComponent={loading?<ListSkeleton/>:error?<Empty title="정보를 불러오지 못했어요" desc={error} actionLabel="다시 시도" onAction={()=>{setLoading(true);loadPage(0,true).finally(()=>setLoading(false))}}/>:<Empty title="조건에 맞는 프로그램이 없어요" desc="검색어나 필터를 바꿔 다시 찾아보세요." actionLabel={filtered?"필터 초기화":null} onAction={reset}/>}
   ListFooterComponent={more?<ActivityIndicator style={{marginVertical:16}}/>:null}
   onEndReached={onEnd}
   onEndReachedThreshold={0.4}
   refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.blue}/>}
   contentContainerStyle={s.content}
   keyboardShouldPersistTaps="handled"
   removeClippedSubviews={false}
  />
 </SafeAreaView>
}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:C.bg},content:{padding:16,paddingBottom:100},title:{fontSize:26,fontWeight:"900",color:C.navy},desc:{fontSize:11.5,color:C.muted,marginTop:5,marginBottom:14},input:{backgroundColor:"#fff",borderWidth:1,borderColor:C.line,borderRadius:13,padding:12},chips:{flexDirection:"row",gap:7,flexWrap:"wrap",marginTop:9},chip:{backgroundColor:"#EEF3F6",paddingHorizontal:11,paddingVertical:8,borderRadius:99},chipOn:{backgroundColor:C.soft,borderWidth:1,borderColor:"#BDDFFF"},chipText:{color:C.muted,fontWeight:"800",fontSize:11.5},chipTextOn:{color:C.blue},countRow:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",marginTop:14,marginBottom:9},count:{fontSize:10.5,color:C.muted},reset:{fontSize:10.5,color:C.blue,fontWeight:"800"}});
