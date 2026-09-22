
import React,{useCallback,useEffect,useMemo,useRef,useState} from "react";
import {useLocalSearchParams} from "expo-router";
import {Animated,Modal,Pressable,SafeAreaView,FlatList,Text,TextInput,View,TouchableOpacity,StyleSheet,RefreshControl,ActivityIndicator} from "react-native";
import {api} from "../../src/api";import {useTheme} from "../../src/theme";import ActivityCard from "../../src/ActivityCard";
import {useFavorites} from "../../src/favorites";import {ListSkeleton,Empty,friendlyError} from "../../src/ui";
import {getSearches,pushSearch,removeSearch,clearSearches} from "../../src/searches";import {useScrollTopOnRetap} from "../../src/tabs";
import {tap} from "../../src/haptics";
const PAGE=20;
const REGIONS=["전체","부산","울산","경남"];
const CATEGORIES=["과학·탐구","창의·예술","언어·독서","신체·놀이","역사·지역","사회·생활"];
// 정렬은 사용자가 고를 때만 적용한다(기본은 기존 "최신").
const SORTS=[["recent","최신"],["deadline","마감임박순"],["popular","인기순"]];
const Chip=({label,on,onPress,s})=><TouchableOpacity onPress={onPress} style={[s.chip,on&&s.chipOn]} accessibilityRole="button" accessibilityState={{selected:on}} accessibilityLabel={`${label} 필터${on?" 켜짐":""}`}><Text style={[s.chipText,on&&s.chipTextOn]}>{label}</Text></TouchableOpacity>;
// 아래에서 올라오는 시트. 별도 라이브러리 없이 RN Modal + Animated 로만 만든다.
function Sheet({visible,onClose,children,s}){
 const y=useRef(new Animated.Value(320)).current;
 const op=useRef(new Animated.Value(0)).current;
 useEffect(()=>{
  if(!visible)return;
  y.setValue(320);op.setValue(0);
  Animated.parallel([
   Animated.spring(y,{toValue:0,useNativeDriver:true,speed:16,bounciness:3}),
   Animated.timing(op,{toValue:1,duration:160,useNativeDriver:true})
  ]).start();
 },[visible,y,op]);
 // 닫을 때는 애니메이션이 끝난 뒤에 Modal 을 내린다(그 전에 내리면 튕기듯 사라진다).
 const close=useCallback(()=>{
  Animated.parallel([
   Animated.timing(y,{toValue:320,duration:180,useNativeDriver:true}),
   Animated.timing(op,{toValue:0,duration:180,useNativeDriver:true})
  ]).start(({finished})=>{if(finished)onClose()});
 },[y,op,onClose]);
 return <Modal visible={visible} transparent animationType="none" onRequestClose={close}>
  <Animated.View style={[s.dim,{opacity:op}]}><Pressable style={{flex:1}} onPress={close} accessibilityLabel="닫기"/></Animated.View>
  <Animated.View style={[s.sheet,{transform:[{translateY:y}]}]}>
   <View style={s.grab}/>
   {children(close)}
  </Animated.View>
 </Modal>;
}
export default function Explore(){
 const [q,setQ]=useState(""),[term,setTerm]=useState("");
 const [region,setRegion]=useState("전체"),[category,setCategory]=useState(null);
 const [onlyFree,setOnlyFree]=useState(false),[onlyOpen,setOnlyOpen]=useState(false);
 const [sort,setSort]=useState("recent");
 const [rows,setRows]=useState([]),[end,setEnd]=useState(false),[error,setError]=useState(null);
 const [loading,setLoading]=useState(true),[refreshing,setRefreshing]=useState(false),[more,setMore]=useState(false);
 const [recentQ,setRecentQ]=useState([]),[focused,setFocused]=useState(false);
 const [filterOpen,setFilterOpen]=useState(false),[sortOpen,setSortOpen]=useState(false);
 // 시트 안에서 고르는 값은 "적용"을 누를 때까지 임시 상태에만 담는다.
 const [dRegion,setDRegion]=useState("전체"),[dCategory,setDCategory]=useState(null);
 const [dFree,setDFree]=useState(false),[dOpen,setDOpen]=useState(false);
 const {C}=useTheme();const s=useMemo(()=>styles(C),[C]);
 const listRef=useRef(null);
 useScrollTopOnRetap(listRef);
 const blurTimer=useRef(null);
 const fav=useFavorites();
 useEffect(()=>{getSearches().then(setRecentQ)},[]);
 useEffect(()=>()=>clearTimeout(blurTimer.current),[]);
 // 성장 탭의 "○○ 프로그램 찾기"로 넘어오면 그 카테고리를 필터로 켠 채 연다.
 const params=useLocalSearchParams();
 const one=v=>Array.isArray(v)?v[0]:v;
 const paramCategory=one(params.category),paramTs=one(params.ts);
 // 파라미터가 바뀔 때만 반영한다. 이후 사용자가 필터를 직접 바꾸면 여기서 다시 덮어쓰지 않는다.
 useEffect(()=>{
  if(paramCategory&&CATEGORIES.includes(paramCategory))setCategory(paramCategory);
 },[paramCategory,paramTs]);
 useEffect(()=>{const h=setTimeout(()=>setTerm(q.trim()),350);return ()=>clearTimeout(h)},[q]);
 // 최근 검색어로 바로 검색한다(디바운스를 기다리지 않고 즉시 반영).
 async function runSearch(text){
  const t=String(text||"").trim();
  if(!t)return;
  setQ(t);setTerm(t);setFocused(false);
  setRecentQ(await pushSearch(t));
 }
 function clearSearch(){setQ("");setTerm("")}
 const qs=useCallback(offset=>{
  const p=[`limit=${PAGE}`,`offset=${offset}`];
  if(region!=="전체")p.push(`region=${encodeURIComponent(region)}`);
  if(category)p.push(`category=${encodeURIComponent(category)}`);
  if(onlyFree)p.push("only_free=true");
  if(onlyOpen)p.push("only_open=true");
  if(term)p.push(`q=${encodeURIComponent(term)}`);
  if(sort!=="recent")p.push(`sort=${sort}`);
  return p.join("&");
 },[region,category,onlyFree,onlyOpen,term,sort]);
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
 function reset(){setQ("");setTerm("");setRegion("전체");setCategory(null);setOnlyFree(false);setOnlyOpen(false);setSort("recent")}
 function openFilters(){
  tap();
  setDRegion(region);setDCategory(category);setDFree(onlyFree);setDOpen(onlyOpen);  // 현재값을 임시 상태로 복사
  setFilterOpen(true);
 }
 function applyDraft(){setRegion(dRegion);setCategory(dCategory);setOnlyFree(dFree);setOnlyOpen(dOpen)}
 const count=(r,c,f,o)=>(r!=="전체"?1:0)+(c?1:0)+(f?1:0)+(o?1:0);
 const activeCount=count(region,category,onlyFree,onlyOpen);
 const draftCount=count(dRegion,dCategory,dFree,dOpen);
 const sortLabel=(SORTS.find(([v])=>v===sort)||SORTS[0])[1];
 // 켜져 있는 필터만 삭제 칩으로 보여준다. 하나도 없으면 줄 자체를 숨겨 결과가 위로 올라오게 한다.
 const activeChips=[
  region!=="전체"&&{key:"region",label:region,clear:()=>setRegion("전체")},
  category&&{key:"category",label:category,clear:()=>setCategory(null)},
  onlyFree&&{key:"free",label:"무료",clear:()=>setOnlyFree(false)},
  onlyOpen&&{key:"open",label:"모집중",clear:()=>setOnlyOpen(false)}
 ].filter(Boolean);
 const filtered=activeCount>0||term||sort!=="recent";
 const header=<View>
  <Text style={s.title}>지역 프로그램 탐색</Text>
  <View style={s.searchWrap}>
   <TextInput value={q} onChangeText={setQ} placeholder="생태, 과학, 무료, 박물관…" placeholderTextColor={C.muted} style={s.input}
    accessibilityLabel="프로그램 검색어 입력" returnKeyType="search"
    onFocus={()=>{clearTimeout(blurTimer.current);setFocused(true)}}
    onSubmitEditing={()=>runSearch(q)}
    onBlur={()=>{
     // 칩을 누르는 순간 blur 가 먼저 오므로, 목록을 잠깐 남겨 터치가 도달하게 한다.
     blurTimer.current=setTimeout(()=>setFocused(false),150);
     if(q.trim())pushSearch(q).then(setRecentQ);
    }}/>
   {q?<TouchableOpacity style={s.clear} onPress={clearSearch} hitSlop={10} accessibilityRole="button" accessibilityLabel="검색어 지우기"><Text style={s.clearText}>✕</Text></TouchableOpacity>:null}
  </View>
  {focused&&!q.trim()&&recentQ.length>0?<View style={s.recentBox}>
   <View style={s.recentHead}>
    <Text style={s.recentLabel}>최근 검색어</Text>
    <TouchableOpacity onPress={async()=>setRecentQ(await clearSearches())} accessibilityRole="button" accessibilityLabel="최근 검색어 전체 지우기"><Text style={s.reset}>전체 지우기</Text></TouchableOpacity>
   </View>
   <View style={s.chips}>{recentQ.map(t=><View key={t} style={s.recentChip}>
    <TouchableOpacity onPress={()=>runSearch(t)} accessibilityRole="button" accessibilityLabel={`${t} 다시 검색`}><Text style={s.recentChipText}>{t}</Text></TouchableOpacity>
    <TouchableOpacity onPress={async()=>setRecentQ(await removeSearch(t))} hitSlop={8} accessibilityRole="button" accessibilityLabel={`${t} 최근 검색어에서 삭제`}><Text style={s.recentX}>✕</Text></TouchableOpacity>
   </View>)}</View>
  </View>:null}
  {activeChips.length>0?<View style={s.chips}>{activeChips.map(c=><View key={c.key} style={s.activeChip}>
   <Text style={s.activeChipText}>{c.label}</Text>
   <TouchableOpacity onPress={c.clear} hitSlop={8} accessibilityRole="button" accessibilityLabel={`${c.label} 필터 해제`}><Text style={s.activeX}>✕</Text></TouchableOpacity>
  </View>)}</View>:null}
  <View style={s.controls}>
   <TouchableOpacity style={[s.control,activeCount>0&&s.controlOn]} onPress={openFilters} accessibilityRole="button" accessibilityLabel={activeCount>0?`필터 열기, ${activeCount}개 적용됨`:"필터 열기"}>
    <Text style={[s.controlText,activeCount>0&&s.controlTextOn]}>필터</Text>
    {activeCount>0?<View style={s.badge}><Text style={s.badgeText}>{activeCount}</Text></View>:null}
   </TouchableOpacity>
   <TouchableOpacity style={[s.control,sort!=="recent"&&s.controlOn]} onPress={()=>{tap();setSortOpen(true)}} accessibilityRole="button" accessibilityLabel={`정렬 선택, 현재 ${sortLabel}`}>
    <Text style={[s.controlText,sort!=="recent"&&s.controlTextOn]}>{sortLabel} ▾</Text>
   </TouchableOpacity>
   <Text style={s.count}>{loading?"불러오는 중…":`${rows.length}개${end?"":" 이상"}`}</Text>
  </View>
 </View>;
 return <SafeAreaView style={s.safe}>
  <FlatList
   ref={listRef}
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
  <Sheet visible={filterOpen} onClose={()=>setFilterOpen(false)} s={s}>
   {close=><>
    <Text style={s.sheetTitle}>필터</Text>
    <Text style={s.group}>지역</Text>
    <View style={s.chips}>{REGIONS.map(r=><Chip key={r} s={s} label={r} on={dRegion===r} onPress={()=>setDRegion(r)}/>)}</View>
    <Text style={s.group}>성장영역</Text>
    <View style={s.chips}>{CATEGORIES.map(r=><Chip key={r} s={s} label={r} on={dCategory===r} onPress={()=>setDCategory(dCategory===r?null:r)}/>)}</View>
    <Text style={s.group}>조건</Text>
    <View style={s.chips}>
     <Chip s={s} label="무료만" on={dFree} onPress={()=>setDFree(v=>!v)}/>
     <Chip s={s} label="모집중만" on={dOpen} onPress={()=>setDOpen(v=>!v)}/>
    </View>
    <View style={s.sheetActions}>
     <TouchableOpacity style={s.sheetGhost} onPress={()=>{setDRegion("전체");setDCategory(null);setDFree(false);setDOpen(false)}} accessibilityRole="button" accessibilityLabel="필터 초기화">
      <Text style={s.sheetGhostText}>초기화</Text>
     </TouchableOpacity>
     <TouchableOpacity style={s.sheetBtn} onPress={()=>{tap();applyDraft();close()}} accessibilityRole="button" accessibilityLabel={draftCount>0?`필터 ${draftCount}개 적용`:"필터 적용"}>
      <Text style={s.sheetBtnText}>적용{draftCount>0?`(${draftCount})`:""}</Text>
     </TouchableOpacity>
    </View>
   </>}
  </Sheet>
  <Sheet visible={sortOpen} onClose={()=>setSortOpen(false)} s={s}>
   {close=><>
    <Text style={s.sheetTitle}>정렬</Text>
    {SORTS.map(([v,label])=><TouchableOpacity key={v} style={s.sortItem} onPress={()=>{setSort(v);close()}} accessibilityRole="button" accessibilityState={{selected:sort===v}} accessibilityLabel={`${label}으로 정렬`}>
     <Text style={[s.sortItemText,sort===v&&s.sortItemOn]}>{label}</Text>
     {sort===v?<Text style={s.sortCheck}>✓</Text>:null}
    </TouchableOpacity>)}
   </>}
  </Sheet>
 </SafeAreaView>
}
const styles=C=>StyleSheet.create({
 safe:{flex:1,backgroundColor:C.bg},content:{padding:16,paddingBottom:100},
 title:{fontSize:26,fontWeight:"900",color:C.navy,marginBottom:12},
 searchWrap:{justifyContent:"center"},
 input:{backgroundColor:C.card,borderWidth:1,borderColor:C.line,borderRadius:13,padding:12,paddingRight:40,color:C.navy},
 clear:{position:"absolute",right:12,padding:2},clearText:{color:C.muted,fontSize:13,fontWeight:"900"},
 chips:{flexDirection:"row",gap:7,flexWrap:"wrap",marginTop:9},
 chip:{backgroundColor:C.chipBg,paddingHorizontal:11,paddingVertical:8,borderRadius:99},
 chipOn:{backgroundColor:C.chipOnBg,borderWidth:1,borderColor:C.chipOnLine},
 chipText:{color:C.muted,fontWeight:"800",fontSize:11.5},chipTextOn:{color:C.blue},
 activeChip:{flexDirection:"row",alignItems:"center",gap:7,backgroundColor:C.chipOnBg,borderWidth:1,borderColor:C.chipOnLine,paddingLeft:11,paddingRight:9,paddingVertical:7,borderRadius:99},
 activeChipText:{color:C.blue,fontWeight:"800",fontSize:11.5},activeX:{color:C.blue,fontSize:11,fontWeight:"900"},
 controls:{flexDirection:"row",alignItems:"center",gap:7,marginTop:12,marginBottom:10},
 control:{flexDirection:"row",alignItems:"center",gap:6,borderWidth:1,borderColor:C.line,backgroundColor:C.card,paddingHorizontal:12,paddingVertical:9,borderRadius:11},
 controlOn:{borderColor:C.chipOnLine,backgroundColor:C.chipOnBg},
 controlText:{fontSize:11.5,fontWeight:"800",color:C.navy},controlTextOn:{color:C.blue},
 badge:{minWidth:17,height:17,borderRadius:99,backgroundColor:C.blue,alignItems:"center",justifyContent:"center",paddingHorizontal:4},
 badgeText:{color:C.onAccent,fontSize:9.5,fontWeight:"900"},
 count:{fontSize:10.5,color:C.muted,marginLeft:"auto"},
 reset:{fontSize:10.5,color:C.blue,fontWeight:"800"},
 recentBox:{marginTop:11},
 recentHead:{flexDirection:"row",justifyContent:"space-between",alignItems:"center"},
 recentLabel:{fontSize:10.5,color:C.muted,fontWeight:"800"},
 recentChip:{flexDirection:"row",alignItems:"center",gap:7,backgroundColor:C.chipBg,paddingLeft:11,paddingRight:9,paddingVertical:8,borderRadius:99},
 recentChipText:{color:C.navy,fontWeight:"800",fontSize:11.5},recentX:{color:C.muted,fontSize:11,fontWeight:"900"},
 dim:{...StyleSheet.absoluteFillObject,backgroundColor:C.dim},
 sheet:{position:"absolute",left:0,right:0,bottom:0,backgroundColor:C.card,borderTopLeftRadius:22,borderTopRightRadius:22,borderTopWidth:1,borderColor:C.line,paddingHorizontal:18,paddingTop:10,paddingBottom:26},
 grab:{alignSelf:"center",width:38,height:4,borderRadius:99,backgroundColor:C.line,marginBottom:12},
 sheetTitle:{fontSize:17,fontWeight:"900",color:C.navy},
 group:{fontSize:10.5,fontWeight:"900",color:C.muted,marginTop:16},
 sheetActions:{flexDirection:"row",gap:9,marginTop:22},
 sheetGhost:{borderWidth:1,borderColor:C.line,paddingHorizontal:20,paddingVertical:14,borderRadius:13,alignItems:"center"},
 sheetGhostText:{color:C.muted,fontWeight:"800",fontSize:12.5},
 sheetBtn:{flex:1,backgroundColor:C.blue,paddingVertical:14,borderRadius:13,alignItems:"center"},
 sheetBtnText:{color:C.onAccent,fontWeight:"900",fontSize:13},
 sortItem:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",paddingVertical:15,borderBottomWidth:1,borderBottomColor:C.divider},
 sortItemText:{fontSize:13,fontWeight:"800",color:C.navy},sortItemOn:{color:C.blue},
 sortCheck:{color:C.blue,fontWeight:"900",fontSize:14}
});
