
import React,{useCallback,useEffect,useMemo,useRef,useState} from "react";
import {SafeAreaView,FlatList,ScrollView,View,Text,TouchableOpacity,StyleSheet,RefreshControl,Linking} from "react-native";
import {router,useFocusEffect} from "expo-router";
import {api} from "../../src/api"; import {useTheme} from "../../src/theme"; import ActivityCard from "../../src/ActivityCard";
import {useFavorites} from "../../src/favorites"; import {ListSkeleton,Empty,friendlyError,StatusBadge,DeadlineBadge} from "../../src/ui";
import {tap} from "../../src/haptics";
import {useScrollTopOnRetap} from "../../src/tabs";
import {getRecentIds} from "../../src/recent";
export default function Home(){
 const [rows,setRows]=useState([]),[sources,setSources]=useState([]),[recent,setRecent]=useState([]),[benefits,setBenefits]=useState([]);
 const [loading,setLoading]=useState(true),[refreshing,setRefreshing]=useState(false),[error,setError]=useState(null);
 const {C}=useTheme();const s=useMemo(()=>styles(C),[C]);
 const listRef=useRef(null);
 useScrollTopOnRetap(listRef);
 const fav=useFavorites();
 const load=useCallback(async()=>{
  try{
   // 지원·정책은 실패해도 홈의 나머지가 그대로 보이도록 따로 잡는다.
   const [a,s,b]=await Promise.all([api.activities("limit=5"),api.sources(),api.benefits("limit=10").catch(()=>({items:[]}))]);
   setRows(a.items||[]);setSources(s.items||[]);setBenefits(b.items||[]);setError(null);
  }catch(e){setError(friendlyError(e))}
 },[]);
 useEffect(()=>{setLoading(true);load().finally(()=>setLoading(false))},[load]);
 // 최근 본 목록은 기기에 저장된 id 로만 만든다. 사라진 프로그램은 조용히 건너뛴다.
 const loadRecent=useCallback(async()=>{
  const ids=await getRecentIds();
  if(ids.length===0){setRecent([]);return}
  const items=await Promise.all(ids.map(i=>api.activity(i).catch(()=>null)));
  setRecent(items.filter(Boolean));
 },[]);
 // 상세를 보고 홈으로 돌아오면 바로 반영되도록 탭에 들어올 때마다 새로 읽는다.
 useFocusEffect(useCallback(()=>{loadRecent()},[loadRecent]));
 const onRefresh=useCallback(async()=>{setRefreshing(true);await Promise.all([load(),fav.reload(),loadRecent()]);setRefreshing(false)},[load,fav.reload,loadRecent]);
 const header=<View>
  <View style={s.top}>
   <View><Text style={s.logo}>GROO<Text style={{color:C.mint}}>N</Text><Text style={{color:C.yellow}}>A</Text></Text><Text style={s.sub}>오늘의 경험, 내일의 성장</Text></View>
   <View style={s.topRight}><View style={s.live}><Text style={s.liveText}>● LIVE</Text></View><TouchableOpacity hitSlop={10} onPress={()=>router.push("/settings")} accessibilityRole="button" accessibilityLabel="설정"><Text style={s.gear}>⚙</Text></TouchableOpacity></View>
  </View>
  <View style={s.hero}><Text style={s.eyebrow}>LOCAL AI GROWTH CURATION</Text><Text style={s.heroTitle}>아이에게 맞는{"\n"}지역 경험을 찾아요.</Text><Text style={s.heroText}>부산·울산·경남의 공개 프로그램을 자동 수집하고 성장영역으로 큐레이션합니다.</Text><TouchableOpacity style={s.primary} onPress={()=>{tap();router.push("/explore")}} accessibilityRole="button" accessibilityLabel="지역 프로그램 찾기"><Text style={s.primaryText}>지역 프로그램 찾기</Text></TouchableOpacity></View>
  {benefits.length>0?<>
   <View style={s.section}><Text style={s.sectionTitle}>육아 지원·정책</Text><Text style={s.small}>조회 많은 순</Text></View>
   <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.benefitRow}>
    {benefits.map(b=><TouchableOpacity key={b.id} style={s.benefitCard} disabled={!b.url} onPress={()=>{tap();Linking.openURL(b.url)}} accessibilityRole="button" accessibilityLabel={`${b.title}. ${b.org}. 공식 페이지 열기`}>
     <View style={s.benefitTop}>
      <Text style={s.benefitRegion}>{b.region}</Text>
      {b.support_type?<Text style={s.benefitType} numberOfLines={1}>{b.support_type}</Text>:null}
     </View>
     <Text style={s.benefitTitle} numberOfLines={2}>{b.title}</Text>
     {b.summary?<Text style={s.benefitSummary} numberOfLines={2}>{b.summary}</Text>:null}
     <Text style={s.benefitOrg} numberOfLines={1}>{b.org}{b.field?` · ${b.field}`:""}</Text>
    </TouchableOpacity>)}
   </ScrollView>
   <Text style={s.benefitNote}>출처: 정부24 보조금24 · 공식 정보와 신청 자격은 각 기관에서 확인하세요.</Text>
  </>:null}
  {recent.length>0?<>
   <View style={s.section}><Text style={s.sectionTitle}>최근 본 프로그램</Text><Text style={s.small}>{recent.length}개</Text></View>
   <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.recentRow}>
    {recent.map(x=><TouchableOpacity key={x.id} style={s.recentCard} onPress={()=>router.push(`/activity/${x.id}`)} accessibilityRole="button" accessibilityLabel={`${x.title} 다시 보기`}>
     <Text style={s.recentTitle} numberOfLines={2}>{x.title}</Text>
     <Text style={s.recentMeta} numberOfLines={1}>{x.region} · {x.provider||x.place||""}</Text>
     <View style={s.recentBadges}><StatusBadge status={x.status}/><DeadlineBadge applyEnd={x.apply_end} style={{marginLeft:5}}/></View>
    </TouchableOpacity>)}
   </ScrollView>
  </>:null}
  <View style={s.section}><Text style={s.sectionTitle}>데이터 연결</Text><Text style={s.small}>{sources.filter(x=>x.last_status==="ok").length}/{sources.length} 정상</Text></View>
  <View style={s.panel}>{sources.map(x=><View key={x.source_key} style={s.source}><Text style={s.sourceName}>{x.name}</Text><Text style={{fontSize:10,color:x.last_status==="ok"?C.green:C.warn}}>{x.last_status==="ok"?`${x.record_count}건`:"연결 대기"}</Text></View>)}</View>
  <View style={s.section}><Text style={s.sectionTitle}>새로운 활동</Text></View>
 </View>;
 return <SafeAreaView style={s.safe}>
  <FlatList
   ref={listRef}
   data={loading?[]:rows}
   keyExtractor={x=>x.id}
   renderItem={({item})=><ActivityCard x={item} favorite={fav.ids.has(item.id)} onToggleFavorite={fav.toggle}/>}
   ListHeaderComponent={header}
   ListEmptyComponent={loading?<ListSkeleton count={3}/>:error?<Empty title="정보를 불러오지 못했어요" desc={error} actionLabel="다시 시도" onAction={()=>{setLoading(true);load().finally(()=>setLoading(false))}}/>:<Empty title="표시할 프로그램이 없어요" desc="잠시 후 다시 확인해 주세요." actionLabel="지역 프로그램 탐색" onAction={()=>router.push("/explore")}/>}
   refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.blue}/>}
   contentContainerStyle={s.content}
  />
 </SafeAreaView>
}
const styles=C=>StyleSheet.create({safe:{flex:1,backgroundColor:C.bg},content:{padding:16,paddingBottom:100},top:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",marginBottom:12},logo:{fontSize:26,fontWeight:"900",color:C.blue},sub:{fontSize:9.5,color:C.muted},topRight:{flexDirection:"row",alignItems:"center",gap:10},gear:{fontSize:20,color:C.muted},live:{backgroundColor:C.successSoft,padding:7,borderRadius:99},liveText:{fontSize:9,color:C.green,fontWeight:"900"},hero:{backgroundColor:C.heroBg,borderRadius:28,padding:22},eyebrow:{color:C.mint,fontSize:10,fontWeight:"900",letterSpacing:1.2},heroTitle:{fontSize:29,lineHeight:38,color:C.heroTitle,fontWeight:"900",marginTop:9},heroText:{fontSize:12.5,color:C.heroText,lineHeight:20,marginTop:9},primary:{backgroundColor:C.blue,padding:13,borderRadius:13,alignItems:"center",marginTop:15},primaryText:{color:C.onAccent,fontWeight:"900"},section:{marginTop:22,marginBottom:10,flexDirection:"row",justifyContent:"space-between"},sectionTitle:{fontSize:19,fontWeight:"900",color:C.navy},small:{fontSize:10,color:C.muted},panel:{backgroundColor:C.card,borderWidth:1,borderColor:C.line,borderRadius:19,padding:14},source:{flexDirection:"row",justifyContent:"space-between",paddingVertical:7,borderBottomWidth:1,borderBottomColor:C.divider},sourceName:{fontSize:11.5,fontWeight:"800",color:C.navy},recentRow:{gap:9,paddingRight:4},recentCard:{width:208,backgroundColor:C.card,borderWidth:1,borderColor:C.line,borderRadius:16,padding:13},recentTitle:{fontSize:12.5,fontWeight:"900",color:C.navy,lineHeight:18},recentMeta:{fontSize:10,color:C.muted,marginTop:5},recentBadges:{flexDirection:"row",marginTop:8},benefitRow:{gap:9,paddingRight:4},benefitCard:{width:232,backgroundColor:C.card,borderWidth:1,borderColor:C.line,borderRadius:16,padding:13},benefitTop:{flexDirection:"row",alignItems:"center",gap:6,marginBottom:7},benefitRegion:{fontSize:9.5,fontWeight:"900",color:C.blue,backgroundColor:C.chipOnBg,paddingHorizontal:7,paddingVertical:3,borderRadius:99,overflow:"hidden"},benefitType:{fontSize:9.5,color:C.muted,fontWeight:"800",flex:1},benefitTitle:{fontSize:12.5,fontWeight:"900",color:C.navy,lineHeight:18},benefitSummary:{fontSize:10.5,color:C.muted,lineHeight:16,marginTop:5},benefitOrg:{fontSize:9.5,color:C.green,marginTop:7},benefitNote:{fontSize:9.5,color:C.muted,lineHeight:15,marginTop:9}});
