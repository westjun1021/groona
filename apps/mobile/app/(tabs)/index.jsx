
import React,{useCallback,useEffect,useState} from "react";
import {SafeAreaView,FlatList,View,Text,TouchableOpacity,StyleSheet,RefreshControl} from "react-native";
import {router} from "expo-router";
import {api} from "../../src/api"; import {C} from "../../src/theme"; import ActivityCard from "../../src/ActivityCard";
import {useFavorites} from "../../src/favorites"; import {ListSkeleton,Empty,friendlyError} from "../../src/ui";
export default function Home(){
 const [rows,setRows]=useState([]),[sources,setSources]=useState([]);
 const [loading,setLoading]=useState(true),[refreshing,setRefreshing]=useState(false),[error,setError]=useState(null);
 const fav=useFavorites();
 const load=useCallback(async()=>{
  try{
   const [a,s]=await Promise.all([api.activities("limit=5"),api.sources()]);
   setRows(a.items||[]);setSources(s.items||[]);setError(null);
  }catch(e){setError(friendlyError(e))}
 },[]);
 useEffect(()=>{setLoading(true);load().finally(()=>setLoading(false))},[load]);
 const onRefresh=useCallback(async()=>{setRefreshing(true);await Promise.all([load(),fav.reload()]);setRefreshing(false)},[load,fav.reload]);
 const header=<View>
  <View style={s.top}>
   <View><Text style={s.logo}>GROO<Text style={{color:C.mint}}>N</Text><Text style={{color:C.yellow}}>A</Text></Text><Text style={s.sub}>오늘의 경험, 내일의 성장</Text></View>
   <View style={s.topRight}><View style={s.live}><Text style={s.liveText}>● LIVE</Text></View><TouchableOpacity hitSlop={10} onPress={()=>router.push("/settings")} accessibilityRole="button" accessibilityLabel="설정"><Text style={s.gear}>⚙</Text></TouchableOpacity></View>
  </View>
  <View style={s.hero}><Text style={s.eyebrow}>LOCAL AI GROWTH CURATION</Text><Text style={s.heroTitle}>아이에게 맞는{"\n"}지역 경험을 찾아요.</Text><Text style={s.heroText}>부산·울산·경남의 공개 프로그램을 자동 수집하고 성장영역으로 큐레이션합니다.</Text><TouchableOpacity style={s.primary} onPress={()=>router.push("/explore")} accessibilityRole="button" accessibilityLabel="지역 프로그램 찾기"><Text style={s.primaryText}>지역 프로그램 찾기</Text></TouchableOpacity></View>
  <View style={s.section}><Text style={s.sectionTitle}>데이터 연결</Text><Text style={s.small}>{sources.filter(x=>x.last_status==="ok").length}/{sources.length} 정상</Text></View>
  <View style={s.panel}>{sources.map(x=><View key={x.source_key} style={s.source}><Text style={s.sourceName}>{x.name}</Text><Text style={{fontSize:10,color:x.last_status==="ok"?C.green:"#B7791F"}}>{x.last_status==="ok"?`${x.record_count}건`:"연결 대기"}</Text></View>)}</View>
  <View style={s.section}><Text style={s.sectionTitle}>새로운 활동</Text></View>
 </View>;
 return <SafeAreaView style={s.safe}>
  <FlatList
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
const s=StyleSheet.create({safe:{flex:1,backgroundColor:C.bg},content:{padding:16,paddingBottom:100},top:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",marginBottom:12},logo:{fontSize:26,fontWeight:"900",color:C.blue},sub:{fontSize:9.5,color:C.muted},topRight:{flexDirection:"row",alignItems:"center",gap:10},gear:{fontSize:20,color:C.muted},live:{backgroundColor:"#EAF9F5",padding:7,borderRadius:99},liveText:{fontSize:9,color:C.green,fontWeight:"900"},hero:{backgroundColor:C.navy,borderRadius:28,padding:22},eyebrow:{color:C.mint,fontSize:10,fontWeight:"900",letterSpacing:1.2},heroTitle:{fontSize:29,lineHeight:38,color:"#fff",fontWeight:"900",marginTop:9},heroText:{fontSize:12.5,color:"#DAE7EC",lineHeight:20,marginTop:9},primary:{backgroundColor:C.blue,padding:13,borderRadius:13,alignItems:"center",marginTop:15},primaryText:{color:"#fff",fontWeight:"900"},section:{marginTop:22,marginBottom:10,flexDirection:"row",justifyContent:"space-between"},sectionTitle:{fontSize:19,fontWeight:"900",color:C.navy},small:{fontSize:10,color:C.muted},panel:{backgroundColor:"#fff",borderWidth:1,borderColor:C.line,borderRadius:19,padding:14},source:{flexDirection:"row",justifyContent:"space-between",paddingVertical:7,borderBottomWidth:1,borderBottomColor:"#EFF3F5"},sourceName:{fontSize:11.5,fontWeight:"800",color:C.navy}});
